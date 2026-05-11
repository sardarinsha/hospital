import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePatientFeeLineDto,
  PatientFeeLine,
  UpdatePatientFeeLineDto,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { FeeCatalogService } from '../fee-catalog/fee-catalog.service';
import { PatientEntity } from '../patients/patient.entity';
import { PatientFeeLineEntity } from './patient-fee-line.entity';

@Injectable()
export class PatientFeesService {
  constructor(
    @InjectRepository(PatientFeeLineEntity)
    private readonly linesRepo: Repository<PatientFeeLineEntity>,
    @InjectRepository(PatientEntity)
    private readonly patientsRepo: Repository<PatientEntity>,
    private readonly feeCatalogService: FeeCatalogService,
  ) {}

  private money(n: number): string {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  private parseMoney(s: string): number {
    return parseFloat(s);
  }

  private toDto(
    row: PatientFeeLineEntity,
    createdByName?: string,
  ): PatientFeeLine {
    return {
      id: row.id,
      patientId: row.patientId,
      catalogItemId: row.catalogItemId,
      description: row.description,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      lineTotal: row.lineTotal,
      createdById: row.createdById ?? '',
      createdByName,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      paidByName: row.paidByUser?.name ?? null,
    };
  }

  async ensurePatient(patientId: string): Promise<PatientEntity> {
    const p = await this.patientsRepo.findOne({ where: { id: patientId } });
    if (!p) throw new NotFoundException('Patient not found');
    return p;
  }

  async listForPatient(patientId: string): Promise<PatientFeeLine[]> {
    await this.ensurePatient(patientId);
    const rows = await this.linesRepo.find({
      where: { patientId },
      relations: { createdByUser: true, paidByUser: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) =>
      this.toDto(r, r.createdByUser?.name ?? undefined),
    );
  }

  async addLine(
    patientId: string,
    dto: CreatePatientFeeLineDto,
    createdById: string,
  ): Promise<PatientFeeLine> {
    await this.ensurePatient(patientId);
    const hasCat = !!dto.catalogItemId?.trim();
    const hasCustom =
      !!dto.customDescription && dto.customDescription.trim().length > 0;
    if (hasCat === hasCustom) {
      throw new BadRequestException(
        'Provide either catalogItemId or customDescription (not both, not neither).',
      );
    }
    let description: string;
    let catalogItemId: string | null = null;
    if (hasCat) {
      const item = await this.feeCatalogService.findOneEntity(
        dto.catalogItemId!,
      );
      if (!item.isActive) throw new BadRequestException('Fee item is inactive');
      description = item.name;
      catalogItemId = item.id;
    } else {
      description = dto.customDescription!.trim();
    }
    const qty = dto.quantity;
    const unit = dto.unitPrice;
    const total = qty * unit;
    const row = this.linesRepo.create({
      patientId,
      catalogItemId,
      description,
      quantity: this.money(qty),
      unitPrice: this.money(unit),
      lineTotal: this.money(total),
      createdById,
    });
    const saved = await this.linesRepo.save(row);
    const withUser = await this.linesRepo.findOne({
      where: { id: saved.id },
      relations: { createdByUser: true, paidByUser: true },
    });
    return this.toDto(
      withUser!,
      withUser!.createdByUser?.name ?? undefined,
    );
  }

  async updateLine(
    patientId: string,
    lineId: string,
    dto: UpdatePatientFeeLineDto,
  ): Promise<PatientFeeLine> {
    await this.ensurePatient(patientId);
    const line = await this.linesRepo.findOne({
      where: { id: lineId, patientId },
      relations: { createdByUser: true, paidByUser: true },
    });
    if (!line) throw new NotFoundException('Fee line not found');
    if (
      dto.description !== undefined &&
      dto.description !== null &&
      line.catalogItemId
    ) {
      throw new BadRequestException(
        'Catalog-linked charges cannot be renamed. Change quantity or unit price, or remove and add again.',
      );
    }
    if (dto.quantity !== undefined) line.quantity = this.money(dto.quantity);
    if (dto.unitPrice !== undefined) line.unitPrice = this.money(dto.unitPrice);
    if (dto.description !== undefined && dto.description.trim().length > 0) {
      line.description = dto.description.trim();
    }
    const q = this.parseMoney(line.quantity);
    const u = this.parseMoney(line.unitPrice);
    line.lineTotal = this.money(q * u);
    await this.linesRepo.save(line);
    const reloaded = await this.linesRepo.findOne({
      where: { id: lineId },
      relations: { createdByUser: true, paidByUser: true },
    });
    return this.toDto(
      reloaded!,
      reloaded!.createdByUser?.name ?? undefined,
    );
  }

  async removeLine(patientId: string, lineId: string): Promise<void> {
    await this.ensurePatient(patientId);
    const res = await this.linesRepo.delete({ id: lineId, patientId });
    if (!res.affected) throw new NotFoundException('Fee line not found');
  }

  /** Mark a charge as paid at the desk (or clear payment). */
  async setLinePaid(
    patientId: string,
    lineId: string,
    paid: boolean,
    actorUserId: string,
  ): Promise<PatientFeeLine> {
    await this.ensurePatient(patientId);
    const line = await this.linesRepo.findOne({
      where: { id: lineId, patientId },
      relations: { createdByUser: true, paidByUser: true },
    });
    if (!line) throw new NotFoundException('Fee line not found');
    if (paid) {
      line.paidAt = new Date();
      line.paidById = actorUserId;
    } else {
      line.paidAt = null;
      line.paidById = null;
    }
    await this.linesRepo.save(line);
    const reloaded = await this.linesRepo.findOne({
      where: { id: lineId },
      relations: { createdByUser: true, paidByUser: true },
    });
    return this.toDto(
      reloaded!,
      reloaded!.createdByUser?.name ?? undefined,
    );
  }

  async totalForPatient(patientId: string): Promise<string> {
    const lines = await this.linesRepo.find({ where: { patientId } });
    let sum = 0;
    for (const l of lines) sum += this.parseMoney(l.lineTotal);
    return this.money(sum);
  }
}

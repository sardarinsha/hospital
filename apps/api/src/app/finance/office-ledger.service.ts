import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateOfficeLedgerEntryDto,
  OfficeLedgerEntry,
  OfficeLedgerKind,
  StaffPayeeOption,
} from '@hospital/shared';
import { QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { OfficeLedgerEntryEntity } from './office-ledger-entry.entity';

@Injectable()
export class OfficeLedgerService {
  constructor(
    @InjectRepository(OfficeLedgerEntryEntity)
    private readonly ledgerRepo: Repository<OfficeLedgerEntryEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  private handleLedgerDbError(e: unknown): never {
    const raw =
      e instanceof QueryFailedError
        ? e.message
        : e instanceof Error
          ? e.message
          : String(e);
    if (
      /does not exist/i.test(raw) &&
      /office_ledger|patient_fee_lines/i.test(raw)
    ) {
      throw new ServiceUnavailableException(
        'Database migrations are pending. From the project root run: npm run migrate:run — then restart the API.',
      );
    }
    throw e;
  }

  private money(n: number): string {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  private toDto(row: OfficeLedgerEntryEntity): OfficeLedgerEntry {
    const ed =
      typeof row.entryDate === 'string'
        ? row.entryDate.slice(0, 10)
        : String(row.entryDate).slice(0, 10);
    return {
      id: row.id,
      kind: row.kind,
      amount: row.amount,
      description: row.description,
      entryDate: ed,
      payeeUserId: row.payeeUserId,
      payeeName: row.payeeUser?.name ?? null,
      recordedById: row.recordedById,
      recordedByName: row.recordedByUser?.name ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listRecent(limit = 200): Promise<OfficeLedgerEntry[]> {
    const cap = Math.min(Math.max(limit, 1), 500);
    try {
      const rows = await this.ledgerRepo.find({
        relations: { payeeUser: true, recordedByUser: true },
        order: { entryDate: 'DESC', createdAt: 'DESC' },
        take: cap,
      });
      return rows.map((r) => this.toDto(r));
    } catch (e) {
      this.handleLedgerDbError(e);
    }
  }

  /** Staff who can receive salary (all user accounts). */
  async staffPayeeOptions(): Promise<StaffPayeeOption[]> {
    const rows = await this.usersRepo.find({
      order: { name: 'ASC' },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }

  async create(
    dto: CreateOfficeLedgerEntryDto,
    recordedById: string,
  ): Promise<OfficeLedgerEntry> {
    if (dto.kind === OfficeLedgerKind.SALARY) {
      if (!dto.payeeUserId?.trim()) {
        throw new BadRequestException(
          'payeeUserId is required for salary entries',
        );
      }
      const payee = await this.usersRepo.findOne({
        where: { id: dto.payeeUserId },
      });
      if (!payee) throw new NotFoundException('Payee user not found');
    } else if (dto.payeeUserId) {
      throw new BadRequestException(
        'payeeUserId is only used for salary entries',
      );
    }

    const row = this.ledgerRepo.create({
      kind: dto.kind,
      amount: this.money(dto.amount),
      description: dto.description.trim(),
      entryDate: dto.entryDate.slice(0, 10),
      payeeUserId: dto.kind === OfficeLedgerKind.SALARY ? dto.payeeUserId! : null,
      recordedById,
    });
    try {
      const saved = await this.ledgerRepo.save(row);
      const reloaded = await this.ledgerRepo.findOne({
        where: { id: saved.id },
        relations: { payeeUser: true, recordedByUser: true },
      });
      return this.toDto(reloaded!);
    } catch (e) {
      this.handleLedgerDbError(e);
    }
  }
}

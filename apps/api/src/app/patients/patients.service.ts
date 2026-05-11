import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatePatientDto,
  PaginatedPatients,
  Patient,
  PatientAppointmentDoctor,
  PatientRegisteredBySummary,
  Role,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { DoctorsService } from '../doctors/doctors.service';
import { PatientEntity } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly repo: Repository<PatientEntity>,
    private readonly doctorsService: DoctorsService,
  ) {}

  private mapEntity(
    entity: PatientEntity,
    appointmentDoctor: PatientAppointmentDoctor | null,
  ): Patient {
    let registeredBy: PatientRegisteredBySummary | null = null;
    if (entity.registeredByUser) {
      const u = entity.registeredByUser;
      registeredBy = {
        id: u.id,
        name: u.name,
        email: u.email,
      };
    }
    return {
      id: entity.id,
      mrn: entity.mrn,
      firstName: entity.firstName,
      lastName: entity.lastName,
      gender: entity.gender,
      age: entity.age,
      phone: entity.phone,
      address: entity.address,
      bloodGroup: entity.bloodGroup,
      notes: entity.notes,
      appointmentDoctor,
      registeredBy,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  private async nextMrn(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MRN-${year}-`;
    const last = await this.repo
      .createQueryBuilder('p')
      .where('p.mrn LIKE :pre', { pre: `${prefix}%` })
      .orderBy('p.mrn', 'DESC')
      .getOne();
    let seq = 1;
    if (last?.mrn) {
      const part = last.mrn.split('-')[2];
      const n = part ? parseInt(part, 10) : 0;
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  async create(
    dto: CreatePatientDto,
    registeredById: string,
  ): Promise<Patient> {
    await this.doctorsService.assertValidDoctorUserId(dto.appointmentDoctorId);
    const mrn = await this.nextMrn();
    const row = this.repo.create({
      mrn,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      gender: dto.gender,
      age: dto.age,
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
      bloodGroup: dto.bloodGroup ?? null,
      notes: dto.notes?.trim() || null,
      appointmentDoctorId: dto.appointmentDoctorId,
      registeredById,
    });
    const saved = await this.repo.save(row);
    return this.findOne(saved.id);
  }

  async findAll(params: {
    search?: string;
    page: number;
    limit: number;
    /** When set (front desk), only patients registered by this user. */
    registeredByUserId?: string;
  }): Promise<PaginatedPatients> {
    const { search, page, limit, registeredByUserId } = params;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.registeredByUser', 'u')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (registeredByUserId) {
      qb.andWhere('p.registered_by_id = :rid', { rid: registeredByUserId });
    }
    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.firstName) LIKE :t OR LOWER(p.lastName) LIKE :t OR LOWER(p.mrn) LIKE :t OR LOWER(COALESCE(p.phone, \'\')) LIKE :t)',
        { t: term },
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((i) => this.mapEntity(i, null)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Patient> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { registeredByUser: true },
    });
    if (!entity) throw new NotFoundException('Patient not found');
    let appointmentDoctor: PatientAppointmentDoctor | null = null;
    if (entity.appointmentDoctorId) {
      appointmentDoctor = await this.doctorsService.getAppointmentSummary(
        entity.appointmentDoctorId,
      );
    }
    return this.mapEntity(entity, appointmentDoctor);
  }

  async update(
    id: string,
    patch: Partial<CreatePatientDto>,
    actor?: { role: Role; userId: string },
  ): Promise<Patient> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Patient not found');
    if (
      actor?.role === Role.RECEPTIONIST &&
      entity.registeredById !== actor.userId
    ) {
      throw new ForbiddenException(
        'You can only edit patients you registered.',
      );
    }
    if (patch.firstName !== undefined)
      entity.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) entity.lastName = patch.lastName.trim();
    if (patch.gender !== undefined) entity.gender = patch.gender;
    if (patch.age !== undefined) entity.age = patch.age;
    if (patch.phone !== undefined)
      entity.phone = patch.phone?.trim() || null;
    if (patch.address !== undefined)
      entity.address = patch.address?.trim() || null;
    if (patch.bloodGroup !== undefined) entity.bloodGroup = patch.bloodGroup;
    if (patch.notes !== undefined) entity.notes = patch.notes?.trim() || null;
    if (patch.appointmentDoctorId !== undefined) {
      if (patch.appointmentDoctorId) {
        await this.doctorsService.assertValidDoctorUserId(
          patch.appointmentDoctorId,
        );
        entity.appointmentDoctorId = patch.appointmentDoctorId;
      } else {
        entity.appointmentDoctorId = null;
      }
    }
    await this.repo.save(entity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Patient not found');
  }

  /** Receptionists may only open patients they registered; others see all (within role rules). */
  async assertCanAccessPatient(
    patientId: string,
    viewerRole: Role,
    viewerUserId: string,
  ): Promise<void> {
    if (viewerRole !== Role.RECEPTIONIST) return;
    const row = await this.repo.findOne({
      where: { id: patientId },
      select: ['id', 'registeredById'],
    });
    if (!row) throw new NotFoundException('Patient not found');
    if (row.registeredById !== viewerUserId) {
      throw new ForbiddenException(
        'You can only view patients you registered.',
      );
    }
  }
}

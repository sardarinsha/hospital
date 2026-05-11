import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  PatientAppointmentDoctor,
  PatientDoctorOption,
  Role,
} from '@hospital/shared';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { DoctorEntity } from './doctor.entity';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DoctorEntity)
    private readonly doctorsRepo: Repository<DoctorEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async create(input: {
    email: string;
    password: string;
    name: string;
    medicalField: string;
  }): Promise<{
    id: string;
    userId: string;
    email: string;
    name: string;
    role: Role;
    medicalField: string;
    createdAt: Date;
  }> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const doctors = manager.getRepository(DoctorEntity);

      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await users.save(
        users.create({
          email,
          passwordHash,
          name: input.name.trim(),
          role: Role.DOCTOR,
        }),
      );

      const profile = await doctors.save(
        doctors.create({
          userId: user.id,
          medicalField: input.medicalField.trim(),
        }),
      );

      return {
        id: profile.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        medicalField: profile.medicalField,
        createdAt: profile.createdAt,
      };
    });
  }

  async findAllForAdmin(): Promise<
    Array<{
      id: string;
      userId: string;
      email: string;
      name: string;
      role: Role;
      medicalField: string;
      createdAt: Date;
    }>
  > {
    const rows = await this.doctorsRepo.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return rows.map((d) => ({
      id: d.id,
      userId: d.userId,
      email: d.user.email,
      name: d.user.name,
      role: d.user.role,
      medicalField: d.medicalField,
      createdAt: d.createdAt,
    }));
  }

  /** Dropdown options when registering a patient (reception). */
  async findRegistrationOptions(): Promise<PatientDoctorOption[]> {
    const rows = await this.doctorsRepo.find({
      relations: ['user'],
    });
    rows.sort((a, b) => a.user.name.localeCompare(b.user.name));
    return rows.map((d) => ({
      userId: d.userId,
      name: d.user.name,
      medicalField: d.medicalField,
      label: `${d.user.name} — ${d.medicalField}`,
    }));
  }

  async getAppointmentSummary(
    userId: string,
  ): Promise<PatientAppointmentDoctor | null> {
    const d = await this.doctorsRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!d) return null;
    return {
      userId: d.userId,
      name: d.user.name,
      medicalField: d.medicalField,
    };
  }

  async assertValidDoctorUserId(userId: string): Promise<void> {
    const ok = await this.doctorsRepo.exist({ where: { userId } });
    if (!ok) {
      throw new BadRequestException('Selected doctor is invalid');
    }
  }

  async update(
    doctorProfileId: string,
    patch: { name?: string; medicalField?: string },
  ): Promise<{
    id: string;
    userId: string;
    email: string;
    name: string;
    role: Role;
    medicalField: string;
    createdAt: Date;
  }> {
    if (patch.name === undefined && patch.medicalField === undefined) {
      throw new BadRequestException('Provide name and/or medicalField');
    }
    const row = await this.doctorsRepo.findOne({
      where: { id: doctorProfileId },
      relations: ['user'],
    });
    if (!row) throw new NotFoundException('Doctor not found');
    if (patch.medicalField !== undefined) {
      row.medicalField = patch.medicalField.trim();
    }
    if (patch.name !== undefined) {
      row.user.name = patch.name.trim();
      await this.usersRepo.save(row.user);
    }
    await this.doctorsRepo.save(row);
    const reloaded = await this.doctorsRepo.findOne({
      where: { id: doctorProfileId },
      relations: ['user'],
    });
    const d = reloaded!;
    return {
      id: d.id,
      userId: d.userId,
      email: d.user.email,
      name: d.user.name,
      role: d.user.role,
      medicalField: d.medicalField,
      createdAt: d.createdAt,
    };
  }

  async remove(doctorProfileId: string): Promise<void> {
    const row = await this.doctorsRepo.findOne({
      where: { id: doctorProfileId },
    });
    if (!row) throw new NotFoundException('Doctor not found');
    const userId = row.userId;
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(DoctorEntity).delete({ id: doctorProfileId });
      await manager.getRepository(UserEntity).delete({ id: userId });
    });
  }
}

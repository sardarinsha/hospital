import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DoctorEntity } from '../doctors/doctor.entity';
import { FeeCatalogItemEntity } from '../fee-catalog/fee-catalog-item.entity';
import { LabReportRecordEntity } from '../lab-reports/lab-report-record.entity';
import { LabReportTemplateEntity } from '../lab-reports/lab-report-template.entity';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { PatientEntity } from '../patients/patient.entity';
import { TrialSettingsEntity } from '../trial/trial-settings.entity';
import { UserEntity } from '../users/user.entity';
import { OfficeLedgerEntryEntity } from '../finance/office-ledger-entry.entity';

@Injectable()
export class BackupService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async buildExport(): Promise<Record<string, unknown>> {
    const users = await this.dataSource.getRepository(UserEntity).find();
    const patients = await this.dataSource.getRepository(PatientEntity).find();
    const feeCatalog = await this.dataSource
      .getRepository(FeeCatalogItemEntity)
      .find();
    const patientFeeLines = await this.dataSource
      .getRepository(PatientFeeLineEntity)
      .find();
    const labTemplates = await this.dataSource
      .getRepository(LabReportTemplateEntity)
      .find({ relations: { feeCatalogItem: true } });
    const labRecords = await this.dataSource
      .getRepository(LabReportRecordEntity)
      .find({ relations: { template: true, createdBy: true } });
    const trial = await this.dataSource.getRepository(TrialSettingsEntity).find();
    const doctors = await this.dataSource.getRepository(DoctorEntity).find();
    const ledger = await this.dataSource
      .getRepository(OfficeLedgerEntryEntity)
      .find();

    return {
      meta: {
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        notice:
          'Confidential. Contains password hashes. Store on a separate drive, encrypted cloud, or secure email to yourself — not on shared machines.',
      },
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
      doctors: doctors.map((d) => ({
        id: d.id,
        userId: d.userId,
        medicalField: d.medicalField,
        createdAt: d.createdAt.toISOString(),
      })),
      patients: patients.map((p) => ({
        id: p.id,
        mrn: p.mrn,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        age: p.age,
        phone: p.phone,
        address: p.address,
        bloodGroup: p.bloodGroup,
        notes: p.notes,
        appointmentDoctorId: p.appointmentDoctorId,
        registeredById: p.registeredById,
        createdAt: p.createdAt.toISOString(),
      })),
      feeCatalogItems: feeCatalog.map((f) => ({
        id: f.id,
        name: f.name,
        defaultPrice: f.defaultPrice,
        isActive: f.isActive,
        sortOrder: f.sortOrder,
        createdAt: f.createdAt.toISOString(),
      })),
      patientFeeLines: patientFeeLines.map((l) => ({
        id: l.id,
        patientId: l.patientId,
        catalogItemId: l.catalogItemId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        createdById: l.createdById,
        createdAt: l.createdAt.toISOString(),
        paidAt: l.paidAt ? l.paidAt.toISOString() : null,
        paidById: l.paidById,
      })),
      labReportTemplates: labTemplates.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        feeCatalogItemId: t.feeCatalogItem?.id ?? null,
        fieldsSchema: t.fieldsSchema,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
        createdAt: t.createdAt.toISOString(),
      })),
      labReportRecords: labRecords.map((r) => ({
        id: r.id,
        templateId: r.template.id,
        patientMrn: r.patientMrn,
        patientName: r.patientName,
        fieldValues: r.fieldValues,
        createdById: r.createdBy.id,
        createdAt: r.createdAt.toISOString(),
      })),
      trialSettings: trial.map((t) => ({
        id: t.id,
        trialEndsAt: t.trialEndsAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      officeLedgerEntries: ledger.map((e) => ({
        id: e.id,
        kind: e.kind,
        amount: e.amount,
        description: e.description,
        entryDate: e.entryDate,
        payeeUserId: e.payeeUserId,
        recordedById: e.recordedById,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }
}

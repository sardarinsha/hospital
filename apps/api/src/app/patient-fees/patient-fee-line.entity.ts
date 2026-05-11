import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeeCatalogItemEntity } from '../fee-catalog/fee-catalog-item.entity';
import { PatientEntity } from '../patients/patient.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'patient_fee_lines' })
export class PatientFeeLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => PatientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient!: PatientEntity;

  @Column({ name: 'catalog_item_id', type: 'uuid', nullable: true })
  catalogItemId!: string | null;

  @ManyToOne(() => FeeCatalogItemEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'catalog_item_id' })
  catalogItem!: FeeCatalogItemEntity | null;

  @Column({ type: 'varchar', length: 512 })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '1' })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'line_total', type: 'decimal', precision: 12, scale: 2 })
  lineTotal!: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdByUser!: UserEntity | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'paid_by_id', type: 'uuid', nullable: true })
  paidById!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paid_by_id' })
  paidByUser!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

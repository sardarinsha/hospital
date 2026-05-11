import { OfficeLedgerKind } from '@hospital/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'office_ledger_entries' })
export class OfficeLedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24 })
  kind!: OfficeLedgerKind;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 512 })
  description!: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate!: string;

  @Column({ name: 'payee_user_id', type: 'uuid', nullable: true })
  payeeUserId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payee_user_id' })
  payeeUser!: UserEntity | null;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedByUser!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

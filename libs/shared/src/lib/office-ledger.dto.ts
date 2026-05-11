import { Role } from './roles';

export enum OfficeLedgerKind {
  EXPENSE = 'EXPENSE',
  SALARY = 'SALARY',
}

export interface OfficeLedgerEntry {
  id: string;
  kind: OfficeLedgerKind;
  amount: string;
  description: string;
  /** Calendar date YYYY-MM-DD */
  entryDate: string;
  payeeUserId: string | null;
  payeeName: string | null;
  recordedById: string | null;
  recordedByName: string | null;
  createdAt: string;
}

export interface CreateOfficeLedgerEntryDto {
  kind: OfficeLedgerKind;
  amount: number;
  description: string;
  /** ISO date or YYYY-MM-DD */
  entryDate: string;
  /** Required when kind is SALARY — staff member paid */
  payeeUserId?: string;
}

export interface StaffPayeeOption {
  id: string;
  name: string;
  email: string;
  role: Role;
}

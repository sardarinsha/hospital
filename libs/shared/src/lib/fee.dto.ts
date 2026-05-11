export interface FeeCatalogItem {
  id: string;
  name: string;
  defaultPrice: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PatientFeeLine {
  id: string;
  patientId: string;
  catalogItemId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  /** When reception recorded payment for this line (ISO timestamp). */
  paidAt?: string | null;
  paidByName?: string | null;
}

export interface CreateFeeCatalogItemDto {
  name: string;
  defaultPrice: number;
  sortOrder?: number;
}

export interface UpdateFeeCatalogItemDto {
  name?: string;
  defaultPrice?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreatePatientFeeLineDto {
  catalogItemId?: string;
  customDescription?: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdatePatientFeeLineDto {
  quantity?: number;
  unitPrice?: number;
  /** Only allowed when the line is not linked to a catalog item */
  description?: string;
}

export interface PatientFeeSlip {
  patientMrn: string;
  patientName: string;
  lines: PatientFeeLine[];
  total: string;
  printedAt: string;
}

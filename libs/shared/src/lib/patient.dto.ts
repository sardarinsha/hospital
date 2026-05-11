export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
  UNKNOWN = 'UNKNOWN',
}

/** Doctor choices when registering a patient (reception desk). */
export interface PatientDoctorOption {
  userId: string;
  name: string;
  medicalField: string;
  label: string;
}

export interface PatientAppointmentDoctor {
  userId: string;
  name: string;
  medicalField: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  gender: Gender;
  /** Whole years as entered at registration (not derived from DOB). */
  age: number;
  /** Doctor user id for this visit / appointment */
  appointmentDoctorId: string;
  phone?: string;
  address?: string;
  bloodGroup?: BloodGroup;
  notes?: string;
}

/** Partial update for patient demographics and appointment doctor. */
export type UpdatePatientDto = Partial<CreatePatientDto>;

export interface PatientRegisteredBySummary {
  id: string;
  name: string;
  email: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: BloodGroup | null;
  notes?: string | null;
  appointmentDoctor?: PatientAppointmentDoctor | null;
  registeredBy?: PatientRegisteredBySummary | null;
  createdAt: string;
}

export interface PaginatedPatients {
  items: Patient[];
  total: number;
  page: number;
  limit: number;
}

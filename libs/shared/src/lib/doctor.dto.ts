import { Role } from './roles';

/** Admin creates a doctor account plus profile in one request. */
export interface CreateDoctorRequest {
  email: string;
  password: string;
  name: string;
  /** Free text: specialty / department / field of practice */
  medicalField: string;
}

export interface DoctorSummary {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  medicalField: string;
  createdAt: string;
}

/** Admin updates doctor display name and/or medical field (login email unchanged here). */
export interface UpdateDoctorRequest {
  name?: string;
  medicalField?: string;
}

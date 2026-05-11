import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreatePatientDto,
  PaginatedPatients,
  Patient,
  PatientDoctorOption,
  UpdatePatientDto,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly http = inject(HttpClient);

  list(params: {
    search?: string;
    page: number;
    limit: number;
  }): Observable<PaginatedPatients> {
    let p = new HttpParams()
      .set('page', String(params.page))
      .set('limit', String(params.limit));
    if (params.search?.trim()) {
      p = p.set('search', params.search.trim());
    }
    return this.http.get<PaginatedPatients>('/api/patients', { params: p });
  }

  get(id: string): Observable<Patient> {
    return this.http.get<Patient>(`/api/patients/${id}`);
  }

  /** Doctors shown on patient registration (reception). */
  doctorOptions(): Observable<PatientDoctorOption[]> {
    return this.http.get<PatientDoctorOption[]>('/api/patients/doctor-options');
  }

  create(body: CreatePatientDto): Observable<Patient> {
    return this.http.post<Patient>('/api/patients', body);
  }

  update(id: string, body: UpdatePatientDto): Observable<Patient> {
    return this.http.patch<Patient>(`/api/patients/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/patients/${id}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateDoctorRequest,
  DoctorSummary,
  UpdateDoctorRequest,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminDoctorsService {
  private readonly http = inject(HttpClient);

  list(): Observable<DoctorSummary[]> {
    return this.http.get<DoctorSummary[]>('/api/admin/doctors');
  }

  create(body: CreateDoctorRequest): Observable<DoctorSummary> {
    return this.http.post<DoctorSummary>('/api/admin/doctors', body);
  }

  update(id: string, body: UpdateDoctorRequest): Observable<DoctorSummary> {
    return this.http.patch<DoctorSummary>(`/api/admin/doctors/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/doctors/${id}`);
  }
}

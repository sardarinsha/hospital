import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreatePatientFeeLineDto,
  PatientFeeLine,
  UpdatePatientFeeLineDto,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientFeesService {
  private readonly http = inject(HttpClient);

  list(patientId: string): Observable<PatientFeeLine[]> {
    return this.http.get<PatientFeeLine[]>(`/api/patients/${patientId}/fees`);
  }

  add(
    patientId: string,
    body: CreatePatientFeeLineDto,
  ): Observable<PatientFeeLine> {
    return this.http.post<PatientFeeLine>(
      `/api/patients/${patientId}/fees`,
      body,
    );
  }

  update(
    patientId: string,
    lineId: string,
    body: UpdatePatientFeeLineDto,
  ): Observable<PatientFeeLine> {
    return this.http.patch<PatientFeeLine>(
      `/api/patients/${patientId}/fees/${lineId}`,
      body,
    );
  }

  remove(patientId: string, lineId: string): Observable<void> {
    return this.http.delete<void>(
      `/api/patients/${patientId}/fees/${lineId}`,
    );
  }

  recordPayment(
    patientId: string,
    lineId: string,
  ): Observable<PatientFeeLine> {
    return this.http.post<PatientFeeLine>(
      `/api/patients/${patientId}/fees/${lineId}/payment`,
      {},
    );
  }

  voidPayment(
    patientId: string,
    lineId: string,
  ): Observable<PatientFeeLine> {
    return this.http.delete<PatientFeeLine>(
      `/api/patients/${patientId}/fees/${lineId}/payment`,
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateLabReportRecordDto,
  LabReportRecordDetail,
  LabReportRecordSummary,
  LabReportTemplateSummary,
  UpdateLabReportTemplateDto,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LabReportsApiService {
  private readonly http = inject(HttpClient);

  listTemplates(): Observable<LabReportTemplateSummary[]> {
    return this.http.get<LabReportTemplateSummary[]>('/api/lab/report-templates');
  }

  getTemplate(id: string): Observable<LabReportTemplateSummary> {
    return this.http.get<LabReportTemplateSummary>(
      `/api/lab/report-templates/${id}`,
    );
  }

  createRecord(body: CreateLabReportRecordDto): Observable<LabReportRecordDetail> {
    return this.http.post<LabReportRecordDetail>('/api/lab/report-records', body);
  }

  listRecords(
    limit = 50,
    patientMrn?: string,
  ): Observable<LabReportRecordSummary[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (patientMrn?.trim()) {
      params = params.set('patientMrn', patientMrn.trim());
    }
    return this.http.get<LabReportRecordSummary[]>('/api/lab/report-records', {
      params,
    });
  }

  getRecord(id: string): Observable<LabReportRecordDetail> {
    return this.http.get<LabReportRecordDetail>(`/api/lab/report-records/${id}`);
  }

  /** Admin: all templates including inactive. */
  listTemplatesAdmin(): Observable<LabReportTemplateSummary[]> {
    return this.http.get<LabReportTemplateSummary[]>(
      '/api/admin/lab-report-templates',
    );
  }

  updateTemplateAdmin(
    id: string,
    body: UpdateLabReportTemplateDto,
  ): Observable<LabReportTemplateSummary> {
    return this.http.patch<LabReportTemplateSummary>(
      `/api/admin/lab-report-templates/${id}`,
      body,
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  DashboardOverview,
  LabBenchOverview,
  ReceptionDeskOverview,
  ReceptionistPerformanceOverview,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  overview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>('/api/dashboard/overview');
  }

  receptionistPerformance(): Observable<ReceptionistPerformanceOverview> {
    return this.http.get<ReceptionistPerformanceOverview>(
      '/api/dashboard/receptionists',
    );
  }

  receptionDesk(): Observable<ReceptionDeskOverview> {
    return this.http.get<ReceptionDeskOverview>('/api/dashboard/reception-desk');
  }

  labBench(): Observable<LabBenchOverview> {
    return this.http.get<LabBenchOverview>('/api/dashboard/lab-bench');
  }
}

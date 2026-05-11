import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProfitLossReport } from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceProfitLossService {
  private readonly http = inject(HttpClient);

  /** `from` / `to` inclusive calendar dates YYYY-MM-DD */
  report(from: string, to: string): Observable<ProfitLossReport> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ProfitLossReport>('/api/finance/profit-loss', {
      params,
    });
  }
}

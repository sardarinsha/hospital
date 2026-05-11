import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateOfficeLedgerEntryDto,
  OfficeLedgerEntry,
  StaffPayeeOption,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FinanceLedgerService {
  private readonly http = inject(HttpClient);

  list(limit = 200): Observable<OfficeLedgerEntry[]> {
    return this.http.get<OfficeLedgerEntry[]>('/api/finance/ledger', {
      params: { limit: String(limit) },
    });
  }

  create(body: CreateOfficeLedgerEntryDto): Observable<OfficeLedgerEntry> {
    return this.http.post<OfficeLedgerEntry>('/api/finance/ledger', body);
  }

  staffPayees(): Observable<StaffPayeeOption[]> {
    return this.http.get<StaffPayeeOption[]>('/api/finance/staff-payees');
  }
}

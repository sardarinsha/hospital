import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CreateFeeCatalogItemDto,
  FeeCatalogItem,
  UpdateFeeCatalogItemDto,
} from '@hospital/shared';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeeCatalogService {
  private readonly http = inject(HttpClient);

  listActive(): Observable<FeeCatalogItem[]> {
    return this.http.get<FeeCatalogItem[]>('/api/fee-catalog');
  }

  listAllAdmin(): Observable<FeeCatalogItem[]> {
    return this.http.get<FeeCatalogItem[]>('/api/admin/fee-catalog');
  }

  create(body: CreateFeeCatalogItemDto): Observable<FeeCatalogItem> {
    return this.http.post<FeeCatalogItem>('/api/admin/fee-catalog', body);
  }

  update(
    id: string,
    body: UpdateFeeCatalogItemDto,
  ): Observable<FeeCatalogItem> {
    return this.http.patch<FeeCatalogItem>(
      `/api/admin/fee-catalog/${id}`,
      body,
    );
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/fee-catalog/${id}`);
  }
}

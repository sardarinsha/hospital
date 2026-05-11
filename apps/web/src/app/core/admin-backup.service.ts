import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminBackupService {
  private readonly http = inject(HttpClient);

  /** Triggers a JSON file download in the browser (save to USB, Drive, etc.). */
  downloadExport(): Observable<Blob> {
    return this.http.get('/api/admin/backup/export', {
      responseType: 'blob',
    });
  }
}

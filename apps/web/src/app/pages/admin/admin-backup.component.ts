import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Toast } from 'primeng/toast';
import { AdminBackupService } from '../../core/admin-backup.service';

@Component({
  selector: 'app-admin-backup',
  imports: [Card, Button, Toast, RouterLink],
  templateUrl: './admin-backup.component.html',
  styleUrl: './admin-backup.component.scss',
})
export class AdminBackupComponent {
  private readonly api = inject(AdminBackupService);
  private readonly messages = inject(MessageService);

  downloading = false;

  download(): void {
    this.downloading = true;
    this.api.downloadExport().subscribe({
      next: (blob) => {
        this.downloading = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hospital-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.messages.add({
          severity: 'success',
          summary: 'Download started',
          detail:
            'Choose another drive, attach to an email, or upload the file to Google Drive / OneDrive.',
        });
      },
      error: () => {
        this.downloading = false;
        this.messages.add({
          severity: 'error',
          summary: 'Download failed',
          detail: 'Sign in as admin and ensure the API is running.',
        });
      },
    });
  }
}

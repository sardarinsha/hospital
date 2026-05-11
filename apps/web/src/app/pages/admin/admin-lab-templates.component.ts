import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeeCatalogItem, LabReportTemplateSummary } from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FeeCatalogService } from '../../core/fee-catalog.service';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

@Component({
  selector: 'app-admin-lab-templates',
  imports: [
    FormsModule,
    RouterLink,
    Card,
    TableModule,
    Button,
    Tag,
    Toast,
    Dialog,
    Select,
    ToggleSwitch,
  ],
  templateUrl: './admin-lab-templates.component.html',
  styleUrl: './admin-lab-templates.component.scss',
})
export class AdminLabTemplatesComponent implements OnInit {
  private readonly labApi = inject(LabReportsApiService);
  private readonly feeApi = inject(FeeCatalogService);
  private readonly messages = inject(MessageService);

  readonly rows = signal<LabReportTemplateSummary[]>([]);
  readonly catalog = signal<FeeCatalogItem[]>([]);
  readonly loading = signal(false);

  linkDialog = false;
  editing: LabReportTemplateSummary | null = null;
  selCatalogId = '';

  ngOnInit(): void {
    this.reload();
    this.feeApi.listAllAdmin().subscribe({
      next: (c) => this.catalog.set(c),
      error: () => this.catalog.set([]),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.labApi.listTemplatesAdmin().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  catalogOptions(): { label: string; value: string }[] {
    const opts = this.catalog().map((i) => ({
      label: `${i.name} (${i.defaultPrice})${i.isActive ? '' : ' — inactive'}`,
      value: i.id,
    }));
    return [{ label: '— None —', value: '' }, ...opts];
  }

  openLink(row: LabReportTemplateSummary): void {
    this.editing = row;
    this.selCatalogId = row.feeCatalogItemId ?? '';
    this.linkDialog = true;
  }

  saveLink(): void {
    const row = this.editing;
    if (!row) return;
    const feeId = this.selCatalogId?.trim() || null;
    this.labApi
      .updateTemplateAdmin(row.id, { feeCatalogItemId: feeId })
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Link updated' });
          this.linkDialog = false;
          this.editing = null;
          this.reload();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
          }),
      });
  }

  toggleActive(row: LabReportTemplateSummary, active: boolean): void {
    this.labApi.updateTemplateAdmin(row.id, { isActive: active }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Saved' });
        this.reload();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Update failed' }),
    });
  }
}

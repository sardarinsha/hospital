import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CreateOfficeLedgerEntryDto,
  OfficeLedgerEntry,
  OfficeLedgerKind,
  StaffPayeeOption,
} from '@hospital/shared';
import { FinanceLedgerService } from '../../core/finance-ledger.service';

@Component({
  selector: 'app-office-ledger',
  imports: [
    DatePipe,
    FormsModule,
    Card,
    Button,
    TableModule,
    Toast,
    InputText,
    InputNumber,
    Select,
    Textarea,
    RouterLink,
    ProgressSpinner,
  ],
  templateUrl: './office-ledger.component.html',
  styleUrl: './office-ledger.component.scss',
})
export class OfficeLedgerComponent implements OnInit {
  private readonly api = inject(FinanceLedgerService);
  private readonly messages = inject(MessageService);

  readonly rows = signal<OfficeLedgerEntry[]>([]);
  readonly payees = signal<StaffPayeeOption[]>([]);
  readonly loading = signal(true);
  readonly OfficeLedgerKind = OfficeLedgerKind;

  formKind: OfficeLedgerKind = OfficeLedgerKind.EXPENSE;
  formAmount: number | null = null;
  formDescription = '';
  formEntryDate = new Date().toISOString().slice(0, 10);
  formPayeeId = '';

  saving = false;

  ngOnInit(): void {
    this.reload();
    this.api.staffPayees().subscribe({
      next: (p) => this.payees.set(p),
      error: () => this.payees.set([]),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api.list(250).subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.rows.set([]);
        this.loading.set(false);
        let detail =
          typeof err.error?.message === 'string'
            ? err.error.message
            : 'Unknown error.';
        if (err.status === 403) {
          detail =
            'Finance is only available to Admin and Reception roles.';
        } else if (err.status === 0) {
          detail =
            'Cannot reach the API. Start the server (npm start) and ensure PostgreSQL is running.';
        } else if (err.status === 503) {
          detail =
            typeof err.error?.message === 'string'
              ? err.error.message
              : detail;
        }
        this.messages.add({
          severity: 'error',
          summary: 'Could not load ledger',
          detail,
          life: 10000,
        });
      },
    });
  }

  payeeOptions(): { label: string; value: string }[] {
    return this.payees().map((u) => ({
      label: `${u.name} (${u.role})`,
      value: u.id,
    }));
  }

  submit(): void {
    const amount = this.formAmount;
    const desc = this.formDescription.trim();
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Enter a valid amount',
      });
      return;
    }
    if (!desc) {
      this.messages.add({
        severity: 'warn',
        summary: 'Enter a description',
      });
      return;
    }
    if (this.formKind === OfficeLedgerKind.SALARY && !this.formPayeeId) {
      this.messages.add({
        severity: 'warn',
        summary: 'Select employee',
        detail: 'Salary entries must name who was paid.',
      });
      return;
    }
    const body: CreateOfficeLedgerEntryDto = {
      kind: this.formKind,
      amount,
      description: desc,
      entryDate: this.formEntryDate,
      payeeUserId:
        this.formKind === OfficeLedgerKind.SALARY
          ? this.formPayeeId
          : undefined,
    };
    this.saving = true;
    this.api.create(body).subscribe({
      next: () => {
        this.saving = false;
        this.messages.add({ severity: 'success', summary: 'Entry saved' });
        this.formDescription = '';
        this.formAmount = null;
        this.formPayeeId = '';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const msg =
          typeof err.error?.message === 'string'
            ? err.error.message
            : err.message;
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: msg,
        });
      },
    });
  }
}

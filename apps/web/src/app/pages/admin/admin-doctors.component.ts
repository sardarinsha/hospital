import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CreateDoctorRequest,
  DoctorSummary,
  UpdateDoctorRequest,
} from '@hospital/shared';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { AdminDoctorsService } from '../../core/admin-doctors.service';

@Component({
  selector: 'app-admin-doctors',
  imports: [
    FormsModule,
    Card,
    Button,
    TableModule,
    RouterLink,
    DatePipe,
    Dialog,
    InputText,
    Password,
    Textarea,
    Toast,
  ],
  templateUrl: './admin-doctors.component.html',
  styleUrl: './admin-doctors.component.scss',
})
export class AdminDoctorsComponent implements OnInit {
  private readonly api = inject(AdminDoctorsService);
  private readonly messages = inject(MessageService);

  readonly rows = signal<DoctorSummary[]>([]);
  readonly loading = signal(false);

  dialogVisible = false;
  editDialogVisible = false;
  saving = false;
  editingId: string | null = null;
  formName = '';
  formEmail = '';
  formMedicalField = '';
  formPassword = '';
  formPasswordConfirm = '';
  editFormName = '';
  editFormMedicalField = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openRegister(): void {
    this.formName = '';
    this.formEmail = '';
    this.formMedicalField = '';
    this.formPassword = '';
    this.formPasswordConfirm = '';
    this.dialogVisible = true;
  }

  submitRegister(): void {
    const name = this.formName.trim();
    const email = this.formEmail.trim();
    const medicalField = this.formMedicalField.trim();
    if (!name || !email) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Enter full name and email.',
      });
      return;
    }
    if (!medicalField) {
      this.messages.add({
        severity: 'warn',
        summary: 'Medical field required',
        detail:
          'Describe the doctor’s specialty, department, or field of practice.',
      });
      return;
    }
    if (this.formPassword.length < 8) {
      this.messages.add({
        severity: 'warn',
        summary: 'Password too short',
        detail: 'Use at least 8 characters.',
      });
      return;
    }
    if (this.formPassword !== this.formPasswordConfirm) {
      this.messages.add({
        severity: 'warn',
        summary: 'Password mismatch',
        detail: 'Password and confirmation must match.',
      });
      return;
    }

    const body: CreateDoctorRequest = {
      name,
      email,
      password: this.formPassword,
      medicalField,
    };

    this.saving = true;
    this.api.create(body).subscribe({
      next: (created) => {
        this.saving = false;
        this.dialogVisible = false;
        this.messages.add({
          severity: 'success',
          summary: 'Doctor registered',
          detail: `${created.name} (${created.medicalField}) can sign in as ${created.email}`,
        });
        this.rows.update((r) =>
          [...r, created].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const msg =
          typeof err.error?.message === 'string'
            ? err.error.message
            : Array.isArray(err.error?.message)
              ? err.error.message.join(', ')
              : err.message;
        this.messages.add({
          severity: 'error',
          summary: 'Could not register doctor',
          detail: msg,
        });
      },
    });
  }

  openEdit(row: DoctorSummary): void {
    this.editingId = row.id;
    this.editFormName = row.name;
    this.editFormMedicalField = row.medicalField;
    this.editDialogVisible = true;
  }

  submitEdit(): void {
    const id = this.editingId;
    if (!id) return;
    const name = this.editFormName.trim();
    const medicalField = this.editFormMedicalField.trim();
    if (!name || !medicalField) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Name and medical field are required.',
      });
      return;
    }
    const body: UpdateDoctorRequest = { name, medicalField };
    this.saving = true;
    this.api.update(id, body).subscribe({
      next: (updated) => {
        this.saving = false;
        this.editDialogVisible = false;
        this.editingId = null;
        this.messages.add({
          severity: 'success',
          summary: 'Doctor updated',
          detail: `${updated.name} — ${updated.medicalField}`,
        });
        this.rows.update((r) =>
          r.map((x) => (x.id === updated.id ? updated : x)),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const msg =
          typeof err.error?.message === 'string'
            ? err.error.message
            : Array.isArray(err.error?.message)
              ? err.error.message.join(', ')
              : err.message;
        this.messages.add({
          severity: 'error',
          summary: 'Update failed',
          detail: msg,
        });
      },
    });
  }

  confirmDelete(row: DoctorSummary): void {
    const ok = confirm(
      `Delete doctor “${row.name}”? Their login will stop working. Existing patients keep records; appointment doctor may need to be reassigned on future visits.`,
    );
    if (!ok) return;
    this.api.delete(row.id).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Doctor removed',
          detail: row.email,
        });
        this.rows.update((r) => r.filter((x) => x.id !== row.id));
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          typeof err.error?.message === 'string'
            ? err.error.message
            : err.message;
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete',
          detail: msg,
        });
      },
    });
  }
}

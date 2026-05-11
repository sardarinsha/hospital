import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BloodGroup,
  CreatePatientDto,
  Gender,
  PatientDoctorOption,
  UpdatePatientDto,
} from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { PatientsService } from '../../core/patients.service';

@Component({
  selector: 'app-patient-form',
  imports: [
    ReactiveFormsModule,
    Card,
    InputText,
    Textarea,
    Button,
    Toast,
    Select,
    Message,
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss',
})
export class PatientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientsApi = inject(PatientsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);

  readonly genders = Object.values(Gender);
  readonly bloodGroups = Object.values(BloodGroup);
  readonly doctorOptions = signal<PatientDoctorOption[]>([]);
  readonly editPatientId = signal<string | null>(null);
  readonly pageTitle = signal('Register patient');

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: [Gender.MALE, Validators.required],
    age: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(130)],
    ],
    appointmentDoctorId: ['', Validators.required],
    phone: [''],
    address: [''],
    bloodGroup: [''],
    notes: [''],
  });

  saving = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (this.router.url.endsWith('/edit') && id) {
      this.editPatientId.set(id);
      this.pageTitle.set('Edit patient');
      this.patientsApi.get(id).subscribe({
        next: (p) => {
          this.form.patchValue({
            firstName: p.firstName,
            lastName: p.lastName,
            gender: p.gender,
            age: p.age,
            appointmentDoctorId: p.appointmentDoctor?.userId ?? '',
            phone: p.phone ?? '',
            address: p.address ?? '',
            bloodGroup: p.bloodGroup ?? '',
            notes: p.notes ?? '',
          });
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Patient not found',
          });
          void this.router.navigate(['/patients']);
        },
      });
    }

    this.patientsApi.doctorOptions().subscribe({
      next: (opts) => this.doctorOptions.set(opts),
      error: () => this.doctorOptions.set([]),
    });
  }

  cancel(): void {
    const eid = this.editPatientId();
    if (eid) {
      void this.router.navigate(['/patients', eid]);
    } else {
      void this.router.navigate(['/patients']);
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.doctorOptions().length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'No doctors available',
        detail:
          'Register doctors under Admin → Doctors before saving patient details.',
      });
      return;
    }
    const raw = this.form.getRawValue();
    const ageNum = Math.round(Number(raw.age));
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130) {
      this.messages.add({
        severity: 'warn',
        summary: 'Invalid age',
        detail: 'Enter age as a whole number from 0 to 130.',
      });
      return;
    }
    const firstName = raw.firstName?.trim() ?? '';
    const lastName = raw.lastName?.trim() ?? '';
    const gender = raw.gender;
    const appointmentDoctorId = raw.appointmentDoctorId?.trim() ?? '';
    if (!firstName || !lastName || !gender || !appointmentDoctorId) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Fill all required fields.',
      });
      return;
    }
    const bloodRaw = String(raw.bloodGroup ?? '').trim();
    const blood =
      bloodRaw && bloodRaw.length > 0
        ? (bloodRaw as BloodGroup)
        : undefined;
    const body: CreatePatientDto = {
      firstName,
      lastName,
      gender,
      age: ageNum,
      appointmentDoctorId,
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      bloodGroup: blood,
      notes: raw.notes || undefined,
    };

    const editId = this.editPatientId();
    this.saving = true;
    if (editId) {
      const patch: UpdatePatientDto = body;
      this.patientsApi.update(editId, patch).subscribe({
        next: (p) => {
          this.saving = false;
          void this.router.navigate(['/patients', p.id]);
        },
        error: () => {
          this.saving = false;
          this.messages.add({
            severity: 'error',
            summary: 'Could not update patient',
            detail: 'Check permissions (only the registering receptionist can edit their patients) and try again.',
          });
        },
      });
    } else {
      this.patientsApi.create(body).subscribe({
        next: (p) => {
          this.saving = false;
          void this.router.navigate(['/patients', p.id]);
        },
        error: () => {
          this.saving = false;
          this.messages.add({
            severity: 'error',
            summary: 'Could not register patient',
            detail: 'Check required fields and try again.',
          });
        },
      });
    }
  }
}

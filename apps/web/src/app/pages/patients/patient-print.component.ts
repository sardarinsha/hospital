import { DatePipe } from '@angular/common';
import { Component, OnDestroy, inject, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Gender, Patient } from '@hospital/shared';
import { Button } from 'primeng/button';
import { PatientsService } from '../../core/patients.service';
import { APP_BRANDING } from '../../core/branding';
import { CLINIC_PRINT } from '../../core/clinic-print.constants';

@Component({
  selector: 'app-patient-print',
  imports: [Button, DatePipe],
  templateUrl: './patient-print.component.html',
  styleUrl: './patient-print.component.scss',
})
export class PatientPrintComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientsApi = inject(PatientsService);
  private readonly title = inject(Title);
  private previousTitle = '';

  readonly patient = signal<Patient | null>(null);
  readonly printedAt = signal(new Date());

  readonly Gender = Gender;
  readonly branding = APP_BRANDING;
  readonly clinic = CLINIC_PRINT;

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();
    this.title.setTitle('');

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.patientsApi.get(id).subscribe({
      next: (p) => {
        this.patient.set(p);
        this.printedAt.set(new Date());
        setTimeout(() => window.print(), 500);
      },
      error: () => void this.router.navigate(['/patients']),
    });
  }

  ngOnDestroy(): void {
    if (this.previousTitle) this.title.setTitle(this.previousTitle);
  }

  patientFullName(p: Patient): string {
    return `${p.firstName} ${p.lastName}`.trim();
  }

  referredByLine(p: Patient): string {
    return p.appointmentDoctor?.name?.trim() ?? '';
  }

  back(): void {
    const p = this.patient();
    if (p) void this.router.navigate(['/patients', p.id]);
    else void this.router.navigate(['/patients']);
  }

  triggerPrint(): void {
    window.print();
  }
}

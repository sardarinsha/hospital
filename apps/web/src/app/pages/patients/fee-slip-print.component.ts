import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Gender, Patient, PatientFeeLine } from '@hospital/shared';
import { Button } from 'primeng/button';
import { APP_BRANDING } from '../../core/branding';
import { CLINIC_PRINT } from '../../core/clinic-print.constants';
import { PatientFeesService } from '../../core/patient-fees.service';
import { PatientsService } from '../../core/patients.service';

export type FeeSlipLayoutMode = 'a4' | 'pos';

@Component({
  selector: 'app-fee-slip-print',
  imports: [Button, DatePipe],
  templateUrl: './fee-slip-print.component.html',
  styleUrl: './fee-slip-print.component.scss',
})
export class FeeSlipPrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientsApi = inject(PatientsService);
  private readonly feesApi = inject(PatientFeesService);

  readonly patient = signal<Patient | null>(null);
  readonly lines = signal<PatientFeeLine[]>([]);
  readonly selectedLine = signal<PatientFeeLine | null>(null);
  readonly printedAt = signal(new Date());
  readonly layoutMode = signal<FeeSlipLayoutMode>('a4');
  readonly Gender = Gender;
  readonly branding = APP_BRANDING;
  readonly clinic = CLINIC_PRINT;

  readonly total = computed(() => {
    let s = 0;
    for (const l of this.lines()) {
      s += parseFloat(l.lineTotal);
    }
    return (Math.round(s * 100) / 100).toFixed(2);
  });

  ngOnInit(): void {
    const layout = this.route.snapshot.data['feeSlipLayout'] as
      | FeeSlipLayoutMode
      | undefined;
    this.layoutMode.set(layout === 'pos' ? 'pos' : 'a4');

    const id = this.route.snapshot.paramMap.get('id');
    const lineId = this.route.snapshot.paramMap.get('lineId');
    if (!id) return;
    this.patientsApi.get(id).subscribe({
      next: (p) => {
        this.patient.set(p);
        this.feesApi.list(id).subscribe({
          next: (rows) => {
            if (lineId) {
              const row = rows.find((x) => x.id === lineId) ?? null;
              if (!row) {
                void this.router.navigate(['/patients', id]);
                return;
              }
              this.selectedLine.set(row);
              this.lines.set([row]);
            } else {
              this.selectedLine.set(null);
              this.lines.set(rows);
            }
            this.printedAt.set(new Date());
            const delay = this.layoutMode() === 'pos' ? 650 : 500;
            setTimeout(() => window.print(), delay);
          },
          error: () => void this.router.navigate(['/patients', id]),
        });
      },
      error: () => void this.router.navigate(['/patients']),
    });
  }

  dateFormatForPrint(): string {
    return this.layoutMode() === 'pos' ? 'dd/MM/y HH:mm' : 'dd/MM/yyyy';
  }

  isSingleChargeSlip(): boolean {
    return !!this.selectedLine();
  }

  referredByLine(p: Patient): string {
    return p.appointmentDoctor?.name?.trim() ?? '';
  }

  patientFullName(p: Patient): string {
    return `${p.firstName} ${p.lastName}`.trim();
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

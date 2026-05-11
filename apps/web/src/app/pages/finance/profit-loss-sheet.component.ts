import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfitLossReport } from '@hospital/shared';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { APP_BRANDING } from '../../core/branding';
import { CLINIC_PRINT } from '../../core/clinic-print.constants';
import { FinanceProfitLossService } from '../../core/finance-profit-loss.service';

function monthBounds(d: Date): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const last = new Date(y, m + 1, 0);
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(last.getDate())}`,
  };
}

@Component({
  selector: 'app-profit-loss-sheet',
  imports: [FormsModule, Button, Card, DatePipe, DecimalPipe],
  templateUrl: './profit-loss-sheet.component.html',
  styleUrl: './profit-loss-sheet.component.scss',
})
export class ProfitLossSheetComponent implements OnInit {
  private readonly api = inject(FinanceProfitLossService);
  private readonly router = inject(Router);

  readonly clinic = CLINIC_PRINT;
  readonly branding = APP_BRANDING;

  fromStr = '';
  toStr = '';
  readonly report = signal<ProfitLossReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const b = monthBounds(new Date());
    this.fromStr = b.from;
    this.toStr = b.to;
    this.load();
  }

  load(): void {
    if (!this.fromStr || !this.toStr) {
      this.error.set('Choose both dates.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api.report(this.fromStr, this.toStr).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.report.set(null);
        this.loading.set(false);
        this.error.set(
          'Could not load the profit and loss report. Check your connection and permissions.',
        );
      },
    });
  }

  parseAmt(s: string): number {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  triggerPrint(): void {
    window.print();
  }

  back(): void {
    void this.router.navigate(['/finance/ledger']);
  }
}

import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LabReportFieldSchema, LabReportRecordDetail } from '@hospital/shared';
import html2pdf from 'html2pdf.js';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { APP_BRANDING } from '../../core/branding';
import { CLINIC_PRINT } from '../../core/clinic-print.constants';
import { LabReportsApiService } from '../../core/lab-reports-api.service';

@Component({
  selector: 'app-lab-report-print',
  imports: [Button, DatePipe, Tooltip],
  templateUrl: './lab-report-print.component.html',
  styleUrl: './lab-report-print.component.scss',
})
export class LabReportPrintComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LabReportsApiService);
  private readonly title = inject(Title);
  private readonly sanitizer = inject(DomSanitizer);
  private previousTitle = '';

  readonly printRoot = viewChild<ElementRef<HTMLElement>>('printRoot');

  readonly record = signal<LabReportRecordDetail | null>(null);
  readonly printedAt = signal(new Date());
  readonly pdfBusy = signal(false);
  readonly branding = APP_BRANDING;
  readonly clinic = CLINIC_PRINT;

  ngOnInit(): void {
    this.previousTitle = this.title.getTitle();
    this.title.setTitle('');

    const id = this.route.snapshot.paramMap.get('recordId');
    if (!id) {
      void this.router.navigate(['/lab/reports']);
      return;
    }
    this.api.getRecord(id).subscribe({
      next: (r) => {
        this.record.set(r);
        this.printedAt.set(new Date());
      },
      error: () => void this.router.navigate(['/lab/reports']),
    });
  }

  ngOnDestroy(): void {
    if (this.previousTitle) this.title.setTitle(this.previousTitle);
  }

  async downloadPdf(): Promise<void> {
    if (this.pdfBusy()) return;
    this.pdfBusy.set(true);
    try {
      const blob = await this.buildPdfBlob();
      if (!blob) return;
      this.saveBlob(blob, this.pdfFilename());
    } finally {
      this.pdfBusy.set(false);
    }
  }

  /** Opens a generated PDF so printing uses the PDF viewer (no HTML page URL in headers). */
  async openPdfForPrint(): Promise<void> {
    if (this.pdfBusy()) return;
    this.pdfBusy.set(true);
    try {
      const blob = await this.buildPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        URL.revokeObjectURL(url);
        this.saveBlob(blob, this.pdfFilename());
      }
      // Leave blob URL alive for the new tab so the PDF keeps loading.
    } finally {
      this.pdfBusy.set(false);
    }
  }

  private pdfFilename(): string {
    const r = this.record();
    const raw = r ? `${r.patientMrn}-${r.templateTitle}` : 'lab-report';
    const safe = raw.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
    return `${safe}.pdf`;
  }

  private async buildPdfBlob(): Promise<Blob | null> {
    const el = this.printRoot()?.nativeElement;
    if (!el) return null;
    const opt = {
      margin: [8, 8, 12, 8] as [number, number, number, number],
      filename: this.pdfFilename(),
      image: { type: 'jpeg' as const, quality: 0.92 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    return html2pdf().set(opt).from(el).outputPdf('blob');
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  back(): void {
    void this.router.navigate(['/lab/reports/recent']);
  }

  /** New reports store HTML in `reportBody`; older rows use multiple plain fields. */
  hasRichBody(): boolean {
    const html = this.record()?.fieldValues['reportBody'];
    return !!html?.trim();
  }

  richBodyHtml(): SafeHtml {
    const html = this.record()?.fieldValues['reportBody'] ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  orderedFields(schema: LabReportFieldSchema[]): LabReportFieldSchema[] {
    return [...schema];
  }

  fieldValue(key: string): string {
    const r = this.record();
    return r?.fieldValues[key] ?? '';
  }
}

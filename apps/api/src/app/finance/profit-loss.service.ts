import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfficeLedgerKind, ProfitLossReport } from '@hospital/shared';
import { Repository } from 'typeorm';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { OfficeLedgerEntryEntity } from './office-ledger-entry.entity';

@Injectable()
export class ProfitLossService {
  constructor(
    @InjectRepository(PatientFeeLineEntity)
    private readonly feeLinesRepo: Repository<PatientFeeLineEntity>,
    @InjectRepository(OfficeLedgerEntryEntity)
    private readonly ledgerRepo: Repository<OfficeLedgerEntryEntity>,
  ) {}

  private money(n: number): string {
    if (Number.isNaN(n) || !Number.isFinite(n)) return '0.00';
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  private parseNum(v: string | null | undefined): number {
    if (v == null) return 0;
    const n = parseFloat(String(v));
    return Number.isNaN(n) ? 0 : n;
  }

  /** Inclusive local calendar dates `fromStr` / `toStr` as YYYY-MM-DD. */
  private dayStart(isoDate: string): Date {
    const [y, m, d] = isoDate.split('-').map((x) => parseInt(x, 10));
    if (!y || !m || !d) throw new BadRequestException('Invalid date');
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  private dayEnd(isoDate: string): Date {
    const [y, m, d] = isoDate.split('-').map((x) => parseInt(x, 10));
    if (!y || !m || !d) throw new BadRequestException('Invalid date');
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  async report(fromStr: string, toStr: string): Promise<ProfitLossReport> {
    const fromTrim = fromStr?.trim().slice(0, 10);
    const toTrim = toStr?.trim().slice(0, 10);
    if (!fromTrim || !toTrim) {
      throw new BadRequestException(
        'Query params "from" and "to" are required (YYYY-MM-DD)',
      );
    }
    const start = this.dayStart(fromTrim);
    const end = this.dayEnd(toTrim);
    if (start > end) {
      throw new BadRequestException('"from" must be on or before "to"');
    }

    const collectedRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.paid_at IS NOT NULL')
      .andWhere('f.paid_at BETWEEN :a AND :b', { a: start, b: end })
      .getRawOne<{ s: string }>();

    const postedRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_at BETWEEN :a AND :b', { a: start, b: end })
      .getRawOne<{ s: string }>();

    const expenseRaw = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount::numeric),0)', 's')
      .where('l.kind = :k', { k: OfficeLedgerKind.EXPENSE })
      .andWhere('l.entry_date >= :fromD', { fromD: fromTrim })
      .andWhere('l.entry_date <= :toD', { toD: toTrim })
      .getRawOne<{ s: string }>();

    const salaryRaw = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount::numeric),0)', 's')
      .where('l.kind = :k', { k: OfficeLedgerKind.SALARY })
      .andWhere('l.entry_date >= :fromD', { fromD: fromTrim })
      .andWhere('l.entry_date <= :toD', { toD: toTrim })
      .getRawOne<{ s: string }>();

    const incomeCollected = this.parseNum(collectedRaw?.s);
    const chargesPosted = this.parseNum(postedRaw?.s);
    const expenses = this.parseNum(expenseRaw?.s);
    const salaries = this.parseNum(salaryRaw?.s);
    const totalOut = expenses + salaries;
    const net = incomeCollected - totalOut;

    return {
      from: fromTrim,
      to: toTrim,
      generatedAt: new Date().toISOString(),
      incomeCollected: this.money(incomeCollected),
      chargesPostedInPeriod: this.money(chargesPosted),
      expenseLedgerTotal: this.money(expenses),
      salaryLedgerTotal: this.money(salaries),
      totalOutflows: this.money(totalOut),
      netIncome: this.money(net),
    };
  }
}

/** Profit & loss for a date range (collections vs ledger outflows). */
export interface ProfitLossReport {
  from: string;
  to: string;
  generatedAt: string;
  /** Sum of fee lines with paid_at in range (cash/collected view). */
  incomeCollected: string;
  /** Sum of fee line_totals where charge was created in range (accrual-style info). */
  chargesPostedInPeriod: string;
  expenseLedgerTotal: string;
  salaryLedgerTotal: string;
  totalOutflows: string;
  /** incomeCollected - totalOutflows */
  netIncome: string;
}

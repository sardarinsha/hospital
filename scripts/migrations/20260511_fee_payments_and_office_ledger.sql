-- Fee line payment (reception desk) + office ledger (expenses & salaries)
ALTER TABLE patient_fee_lines
  ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL;
ALTER TABLE patient_fee_lines
  ADD COLUMN IF NOT EXISTS paid_by_id uuid NULL REFERENCES users (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS office_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  kind varchar(24) NOT NULL,
  amount decimal(12, 2) NOT NULL,
  description varchar(512) NOT NULL,
  entry_date date NOT NULL,
  payee_user_id uuid NULL REFERENCES users (id) ON DELETE SET NULL,
  recorded_by_id uuid NULL REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_office_ledger_entry_date ON office_ledger_entries (entry_date DESC);

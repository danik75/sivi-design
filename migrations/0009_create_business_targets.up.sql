CREATE TABLE IF NOT EXISTS business_targets (
  id                      INTEGER PRIMARY KEY DEFAULT 1,
  target_hours_per_month  NUMERIC(10,2) NOT NULL DEFAULT 0,
  target_income_per_month NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency                CHAR(3) NOT NULL DEFAULT 'USD',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_targets_single_row CHECK (id = 1)
);

INSERT INTO business_targets (id, target_hours_per_month, target_income_per_month, currency)
VALUES (1, 0, 0, 'USD')
ON CONFLICT (id) DO NOTHING;

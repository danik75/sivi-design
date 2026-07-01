CREATE TYPE contract_type AS ENUM (
  'lump_sum',
  'time_and_materials',
  'prepaid_hours',
  'monthly_retainer'
);

CREATE TYPE contract_status AS ENUM ('active', 'inactive');

CREATE TABLE IF NOT EXISTS contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  type            contract_type NOT NULL,
  status          contract_status NOT NULL DEFAULT 'active',
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,

  -- Lump Sum
  total_amount    numeric(14,2),

  -- Time & Materials
  hourly_rate     numeric(10,2),

  -- Prepaid Hours Block
  hours_purchased numeric(10,2),
  amount_paid     numeric(14,2),

  -- Monthly Retainer
  monthly_fee     numeric(14,2),
  hours_per_month numeric(10,2),

  -- Shared currency
  currency        char(3),

  CONSTRAINT contracts_total_amount_positive_chk    CHECK (total_amount IS NULL OR total_amount > 0),
  CONSTRAINT contracts_hourly_rate_positive_chk     CHECK (hourly_rate IS NULL OR hourly_rate > 0),
  CONSTRAINT contracts_hours_purchased_positive_chk CHECK (hours_purchased IS NULL OR hours_purchased > 0),
  CONSTRAINT contracts_amount_paid_positive_chk     CHECK (amount_paid IS NULL OR amount_paid > 0),
  CONSTRAINT contracts_monthly_fee_positive_chk     CHECK (monthly_fee IS NULL OR monthly_fee > 0),
  CONSTRAINT contracts_hours_per_month_positive_chk CHECK (hours_per_month IS NULL OR hours_per_month > 0)
);

CREATE INDEX IF NOT EXISTS contracts_customer_id_idx ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx      ON contracts(status);
CREATE INDEX IF NOT EXISTS contracts_created_at_idx  ON contracts(created_at DESC);

-- Only one active contract per customer/type
CREATE UNIQUE INDEX IF NOT EXISTS contracts_active_customer_type_uidx
  ON contracts (customer_id, type)
  WHERE status = 'active';

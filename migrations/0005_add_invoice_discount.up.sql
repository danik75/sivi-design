ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS discount_type  text CHECK (discount_type IN ('percentage', 'fixed')),
  ADD COLUMN IF NOT EXISTS discount_value numeric(14,2) CHECK (discount_value IS NULL OR discount_value >= 0),
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0;

ALTER TABLE invoices
  DROP COLUMN IF EXISTS discount_type,
  DROP COLUMN IF EXISTS discount_value,
  DROP COLUMN IF EXISTS discount_amount;

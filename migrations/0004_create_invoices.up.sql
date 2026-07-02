CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE DEFAULT ('INV-' || LPAD(nextval('invoice_number_seq')::text, 4, '0')),
  customer_id    uuid NOT NULL REFERENCES customers(id),
  contract_id    uuid NOT NULL REFERENCES contracts(id),
  status         invoice_status NOT NULL DEFAULT 'draft',
  issue_date     date NOT NULL,
  due_date       date NOT NULL,
  notes          text,
  currency       char(3) NOT NULL DEFAULT 'NIS',
  subtotal       numeric(14,2) NOT NULL DEFAULT 0,
  tax_rate       numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount     numeric(14,2) NOT NULL DEFAULT 0,
  total          numeric(14,2) NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_due_date_chk CHECK (due_date >= issue_date)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sort_order   integer NOT NULL DEFAULT 0,
  description  text NOT NULL,
  quantity     numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  amount       numeric(14,2) NOT NULL,
  source_type  text CHECK (source_type IN ('task','expense','contract','manual')),
  source_id    uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx  ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS invoices_contract_id_idx  ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx       ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx   ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS receipts (
  id             SERIAL PRIMARY KEY,
  receipt_number VARCHAR(100)   NOT NULL,
  invoice_id     UUID           NOT NULL REFERENCES invoices(id),
  paid_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  file_data      TEXT,
  file_name      VARCHAR(255),
  file_mime_type VARCHAR(100),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipts_invoice_id_idx ON receipts(invoice_id);

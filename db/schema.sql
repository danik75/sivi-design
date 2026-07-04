-- db/schema.sql
-- Full schema for sivi-design. Consolidated from migrations/0001–0010.
-- Idempotent (safe to re-run). Run this against a blank database to stand up
-- the complete schema in one shot (e.g. for staging on Supabase).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username   TEXT        NOT NULL UNIQUE,
  password   TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Customers & contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  company_number TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL CHECK (char_length(trim(name)) > 0),
  description      TEXT,
  start_date       DATE        NOT NULL,
  end_date         DATE        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','in_progress','done','cancelled')),
  customer_id      UUID        REFERENCES customers(id) ON DELETE SET NULL,
  start_time       TIME,
  end_time         TIME,
  estimated_hours  NUMERIC(6,2),
  actual_hours     NUMERIC(6,2) CHECK (actual_hours IS NULL OR actual_hours >= 0),
  percent_complete INTEGER     NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  color            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_dates_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date  ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM (
    'lump_sum', 'time_and_materials', 'prepaid_hours', 'monthly_retainer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS contracts (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID            NOT NULL REFERENCES customers(id),
  type            contract_type   NOT NULL,
  status          contract_status NOT NULL DEFAULT 'active',
  description     TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,

  -- Lump Sum
  total_amount    NUMERIC(14,2),
  -- Time & Materials
  hourly_rate     NUMERIC(10,2),
  -- Prepaid Hours Block
  hours_purchased NUMERIC(10,2),
  amount_paid     NUMERIC(14,2),
  -- Monthly Retainer
  monthly_fee     NUMERIC(14,2),
  hours_per_month NUMERIC(10,2),

  currency        CHAR(3),

  CONSTRAINT contracts_total_amount_positive_chk    CHECK (total_amount    IS NULL OR total_amount    > 0),
  CONSTRAINT contracts_hourly_rate_positive_chk     CHECK (hourly_rate     IS NULL OR hourly_rate     > 0),
  CONSTRAINT contracts_hours_purchased_positive_chk CHECK (hours_purchased IS NULL OR hours_purchased > 0),
  CONSTRAINT contracts_amount_paid_positive_chk     CHECK (amount_paid     IS NULL OR amount_paid     > 0),
  CONSTRAINT contracts_monthly_fee_positive_chk     CHECK (monthly_fee     IS NULL OR monthly_fee     > 0),
  CONSTRAINT contracts_hours_per_month_positive_chk CHECK (hours_per_month IS NULL OR hours_per_month > 0)
);

CREATE INDEX IF NOT EXISTS contracts_customer_id_idx ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx      ON contracts(status);
CREATE INDEX IF NOT EXISTS contracts_created_at_idx  ON contracts(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS contracts_active_customer_type_uidx
  ON contracts (customer_id, type)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'software', 'hardware', 'subcontractor', 'travel', 'office', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor      TEXT             NOT NULL,
  amount      NUMERIC(14,2)    NOT NULL CHECK (amount > 0),
  currency    CHAR(3)          NOT NULL DEFAULT 'NIS',
  date        DATE             NOT NULL,
  category    expense_category NOT NULL,
  description TEXT,
  customer_id UUID             REFERENCES customers(id) ON DELETE SET NULL,
  status      expense_status   NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_customer_id_idx ON expenses(customer_id);
CREATE INDEX IF NOT EXISTS expenses_status_idx      ON expenses(status);
CREATE INDEX IF NOT EXISTS expenses_date_idx        ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx    ON expenses(category);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS invoices (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   TEXT           NOT NULL UNIQUE
                                  DEFAULT ('INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0')),
  customer_id      UUID           NOT NULL REFERENCES customers(id),
  contract_id      UUID           NOT NULL REFERENCES contracts(id),
  status           invoice_status NOT NULL DEFAULT 'draft',
  issue_date       DATE           NOT NULL,
  due_date         DATE           NOT NULL,
  notes            TEXT,
  currency         CHAR(3)        NOT NULL DEFAULT 'NIS',
  subtotal         NUMERIC(14,2)  NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5,2)   NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(14,2)  NOT NULL DEFAULT 0,
  total            NUMERIC(14,2)  NOT NULL DEFAULT 0,
  discount_type    TEXT           CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value   NUMERIC(14,2)  CHECK (discount_value IS NULL OR discount_value >= 0),
  discount_amount  NUMERIC(14,2)  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT invoices_due_date_chk CHECK (due_date >= issue_date)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sort_order  INTEGER       NOT NULL DEFAULT 0,
  description TEXT          NOT NULL,
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  amount      NUMERIC(14,2) NOT NULL,
  source_type TEXT          CHECK (source_type IN ('task','expense','contract','manual')),
  source_id   UUID,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx  ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS invoices_contract_id_idx  ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx       ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx   ON invoices(issue_date DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_line_items(invoice_id);

-- ---------------------------------------------------------------------------
-- Business Proposals
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('queued', 'in_progress', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_language AS ENUM ('en', 'he');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_pricing_model AS ENUM (
    'fixed_fee', 'time_and_materials', 'capped_hours_bundle', 'monthly_retainer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_lifecycle_status AS ENUM ('sent', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS business_proposals (
  id                    UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID                     NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  business_requirement  TEXT                     NOT NULL,
  pricing_model         proposal_pricing_model   NOT NULL,
  estimated_hours       NUMERIC(10,2),
  hourly_rate           NUMERIC(12,2),
  currency              CHAR(3)                  NOT NULL DEFAULT 'NIS',
  payment_distribution  TEXT                     NOT NULL,
  requested_language    proposal_language        NOT NULL DEFAULT 'en',
  status                proposal_status          NOT NULL DEFAULT 'queued',
  lifecycle_status      proposal_lifecycle_status NOT NULL DEFAULT 'sent',
  content_json          JSONB,
  english_html          TEXT,
  hebrew_html           TEXT,
  generation_error      TEXT,
  context_snapshot      JSONB,
  llm_model             TEXT,
  llm_response          JSONB,
  created_by            UUID,
  created_at            TIMESTAMPTZ              NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS business_proposals_customer_id_idx ON business_proposals(customer_id);
CREATE INDEX IF NOT EXISTS business_proposals_status_idx      ON business_proposals(status);
CREATE INDEX IF NOT EXISTS business_proposals_created_at_idx  ON business_proposals(created_at DESC);

-- ---------------------------------------------------------------------------
-- Business Targets (single-row config)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_targets (
  id                      INTEGER       PRIMARY KEY DEFAULT 1,
  target_hours_per_month  NUMERIC(10,2) NOT NULL DEFAULT 0,
  target_income_per_month NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency                CHAR(3)       NOT NULL DEFAULT 'USD',
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT business_targets_single_row CHECK (id = 1)
);

INSERT INTO business_targets (id, target_hours_per_month, target_income_per_month, currency)
VALUES (1, 0, 0, 'USD')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Receipts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  id             SERIAL        PRIMARY KEY,
  receipt_number VARCHAR(100)  NOT NULL,
  invoice_id     UUID          NOT NULL REFERENCES invoices(id),
  paid_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  file_data      TEXT,
  file_name      VARCHAR(255),
  file_mime_type VARCHAR(100),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipts_invoice_id_idx ON receipts(invoice_id);

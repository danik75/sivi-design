-- db/schema.sql
-- Schema for Login PRD
-- Creates pgcrypto extension and users table

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE CHECK (char_length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description  TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  start_time       TIME,
  end_time         TIME,
  estimated_hours  NUMERIC(6,2),
  percent_complete INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  color            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_dates_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

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

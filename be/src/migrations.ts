import pool from './db';

/**
 * Lightweight, idempotent startup migrations.
 *
 * `db/schema.sql` is the source of truth for a *fresh* database, but its
 * `CREATE TABLE IF NOT EXISTS` statements are no-ops on an already-existing
 * table — so columns added later never reach hosted DBs (Supabase) on deploy.
 * These statements use `ADD COLUMN IF NOT EXISTS`, are safe to run on every
 * boot, and keep existing databases in sync without a manual step.
 *
 * Rules:
 *  - Every statement MUST be idempotent (IF NOT EXISTS / guarded).
 *  - Append new column additions here as the schema evolves; never edit/remove
 *    past entries (they are cheap no-ops once applied).
 */
const MIGRATIONS: Array<{ name: string; sql: string }> = [
  {
    name: 'business_proposals.content_json',
    sql: `ALTER TABLE business_proposals ADD COLUMN IF NOT EXISTS content_json JSONB`,
  },
  {
    name: 'tasks.actual_hours',
    sql: `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(6,2)`,
  },
  {
    name: 'customers.company_number',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_number TEXT`,
  },
  {
    name: 'invoice_line_items.source_date',
    sql: `ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS source_date DATE`,
  },
  {
    name: 'customers.company_name',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT`,
  },
  {
    name: 'customers.address',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT`,
  },
  {
    name: 'contacts.first_name',
    sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT`,
  },
  {
    name: 'contacts.last_name',
    sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT`,
  },
  {
    name: 'tasks.contract_id',
    sql: `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL`,
  },
  {
    name: 'customers.title',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS title TEXT`,
  },
  {
    name: 'customers.company_phone',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_phone TEXT`,
  },
  {
    name: 'customers.company_email',
    sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_email TEXT`,
  },
  {
    name: 'contacts.name',
    sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name TEXT`,
  },
  {
    name: 'contacts.title',
    sql: `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title TEXT`,
  },
  {
    name: 'subscriptions.table',
    sql: `CREATE TABLE IF NOT EXISTS subscriptions (
      id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      name           TEXT          NOT NULL CHECK (char_length(trim(name)) > 0),
      start_date     DATE          NOT NULL,
      monthly_amount NUMERIC(14,2) NOT NULL CHECK (monthly_amount > 0),
      currency       CHAR(3)       NOT NULL DEFAULT 'NIS',
      renewal_day    INTEGER       NOT NULL CHECK (renewal_day BETWEEN 1 AND 31),
      category       expense_category,
      description    TEXT,
      customer_id    UUID          REFERENCES customers(id) ON DELETE SET NULL,
      status         expense_status NOT NULL DEFAULT 'active',
      created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
    )`,
  },
  {
    name: 'invoice_attachments.table',
    sql: `CREATE TABLE IF NOT EXISTS invoice_attachments (
      id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id     UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      file_data      TEXT          NOT NULL,
      file_name      VARCHAR(255)  NOT NULL,
      file_mime_type VARCHAR(100),
      file_size      INTEGER,
      created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
    )`,
  },
  {
    name: 'invoice_attachments.invoice_id_idx',
    sql: `CREATE INDEX IF NOT EXISTS invoice_attachments_invoice_id_idx ON invoice_attachments(invoice_id)`,
  },
];

export async function runMigrations(): Promise<void> {
  for (const { name, sql } of MIGRATIONS) {
    try {
      await pool.query(sql);
    } catch (err) {
      // Log and continue — a failed additive migration shouldn't block boot;
      // dependent queries will surface the problem clearly if a column is missing.
      // eslint-disable-next-line no-console
      console.error(`[migrations] "${name}" failed:`, (err as Error).message);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[migrations] applied ${MIGRATIONS.length} idempotent migration(s)`);
}

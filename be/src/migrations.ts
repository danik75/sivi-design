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

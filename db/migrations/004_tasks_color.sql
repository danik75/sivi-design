-- Migration: 004_tasks_new_fields
-- Adds all new task columns. Safe to re-run.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_time       TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_time         TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours  NUMERIC(6,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color            TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'percent_complete'
  ) THEN
    ALTER TABLE tasks
      ADD COLUMN percent_complete INTEGER NOT NULL DEFAULT 0
        CHECK (percent_complete BETWEEN 0 AND 100);
  END IF;
END
$$;

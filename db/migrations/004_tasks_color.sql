-- Migration: 004_tasks_color
-- Add optional color column to tasks table

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT;

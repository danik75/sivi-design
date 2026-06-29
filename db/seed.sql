-- db/seed.sql
-- DEV ONLY: quick seed for local development. Do NOT run in production.
-- This file intentionally inserts a cleartext password for fast dev testing.

-- Usage (example):
-- psql "postgresql://cv_user:cv_pass@localhost:5432/cv_db" -f db/seed.sql

BEGIN;

-- DEV ONLY: cleartext password for fast dev testing. Do NOT use in production.
INSERT INTO users (username, password, role) VALUES ('cv', 'cv', 'admin')
ON CONFLICT (username) DO NOTHING;

COMMIT;

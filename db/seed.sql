-- db/seed.sql
-- Minimal seed: creates the admin user.
-- Password is bcrypt-hashed via pgcrypto — safe to run in staging.
-- Change 'sivi' to a strong password before running in any shared environment.
--
-- Usage:
--   psql "postgresql://sivi_user:sivi_pass@localhost:5432/sivi_db" -f db/seed.sql

BEGIN;

INSERT INTO users (username, password, role)
VALUES ('sivi', crypt('sivi', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;

COMMIT;

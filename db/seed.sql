-- db/seed.sql
-- DEV ONLY: quick seed for local development. Do NOT run in production.
-- This file intentionally inserts a cleartext password for fast dev testing.

-- Usage (example):
-- psql "postgresql://sivi_user:sivi_pass@localhost:5432/sivi_db" -f db/seed.sql

BEGIN;

-- DEV ONLY: cleartext password for fast dev testing. Do NOT use in production.
INSERT INTO users (username, password, role) VALUES ('cv', 'cv', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Sample customers (DEV only)
INSERT INTO customers (name) VALUES ('Acme Corp'), ('Globex Inc'), ('Initech Ltd')
ON CONFLICT (name) DO NOTHING;

INSERT INTO contacts (customer_id, email, phone, address, is_primary)
SELECT id, 'alice@acme.com', '+1-555-0100', '1 Main St, Springfield', TRUE
FROM customers WHERE name = 'Acme Corp'
ON CONFLICT DO NOTHING;

INSERT INTO contacts (customer_id, email, phone, is_primary)
SELECT id, 'bob@globex.com', '+1-555-0200', TRUE
FROM customers WHERE name = 'Globex Inc'
ON CONFLICT DO NOTHING;

INSERT INTO contacts (customer_id, email, phone, is_primary)
SELECT id, 'carol@initech.com', '+1-555-0300', TRUE
FROM customers WHERE name = 'Initech Ltd'
ON CONFLICT DO NOTHING;

-- Sample tasks (DEV only)
INSERT INTO tasks (name, description, start_date, end_date, status, customer_id)
SELECT 'Initial onboarding', 'Get Acme Corp set up in the system', '2026-07-01', '2026-07-05', 'pending', id FROM customers WHERE name = 'Acme Corp'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (name, description, start_date, end_date, status, customer_id)
SELECT 'Contract renewal', 'Renew annual service contract', '2026-07-10', '2026-07-15', 'in_progress', id FROM customers WHERE name = 'Globex Inc'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (name, description, start_date, end_date, status)
VALUES ('Internal review', 'Quarterly internal process review', '2026-07-20', '2026-07-22', 'pending')
ON CONFLICT DO NOTHING;

COMMIT;

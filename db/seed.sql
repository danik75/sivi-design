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

COMMIT;

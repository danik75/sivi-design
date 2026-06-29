# Migrations (lightweight conventions)

This project uses simple SQL-based migrations. Recommended tool: golang-migrate (https://github.com/golang-migrate/migrate) or any tool that reads versioned SQL files.

Convention:
- migrations/ contains files named: {version}_{description}.up.sql and {version}_{description}.down.sql
- Version is a zero-padded integer (e.g. 0001_create_users)

Example stub (migrations/0001_create_users.up.sql):

-- create pgcrypto extension and users table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

To apply with migrate CLI:
  migrate -path migrations -database "postgresql://cv_user:cv_pass@localhost:5432/cv_db?sslmode=disable" up

Alternatively use psql for ad-hoc / dev application of SQL files (see project README for scripts).

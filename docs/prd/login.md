# Login feature - PRD

Owner: pm (Product Manager)
Date: 2026-06-29

Overview

Provide a simple, secure Login feature for local development and an easy path to production. This document contains runnable snippets (docker-compose, SQL), env var names, seed instructions, acceptance criteria, and migration notes.

1) Local Postgres setup

docker-compose snippet (place in repo root as docker-compose.postgres.yml or docs for reference):

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    container_name: sivi_design_db_container
    restart: unless-stopped
    environment:
      POSTGRES_USER: sivi_user
      POSTGRES_PASSWORD: sivi_pass
      POSTGRES_DB: sivi_db
    volumes:
      - sivi_design_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  sivi_design_data:
    name: sivi_design_data
```

Notes:
- Data is persisted in the named Docker volume `sivi_design_data`. The actual data directory on the host is managed by Docker; use `docker volume inspect sivi_design_data` to find the mountpoint.

Start/stop commands:
- Start: docker compose -f docker-compose.postgres.yml up -d
- Stop: docker compose -f docker-compose.postgres.yml down
- Remove volume (destroys data): docker volume rm sivi_design_data

2) Schema for user/password persistence

SQL schema (Postgres):

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

Env vars (BE will read these from environment):
- JWT_SECRET — secret used to sign JWTs (example: "${JWT_SECRET}")
- DB_ENCRYPTION_KEY — optional key used by the BE to encrypt sensitive DB fields if implemented (example: "${DB_ENCRYPTION_KEY}")
- JWT_EXPIRATION_MINUTES — token lifetime in minutes (default: 30)

Seed data instructions (development only):

```sql
-- DEV ONLY: cleartext password for fast dev testing. Do NOT use in production.
INSERT INTO users (username, password, role) VALUES ('cv', 'cv', 'admin')
ON CONFLICT (username) DO NOTHING;
```

Suggested seed workflow:
1. Start Postgres via docker compose
2. Run: psql "postgresql://sivi_user:sivi_pass@localhost:5432/sivi_db" -c "<seed SQL above>"

3) Authentication behavior

Endpoint: POST /login
- Request: { "username": "<username>", "password": "<password>" }
- Behavior: Verify credentials against users table.
  - For dev only: compare cleartext password when seeded as cleartext.
  - For production: verify hashed password (bcrypt) — see Security notes.
- On success: return HTTP 200 and JSON: { "token": "<JWT>" }

JWT signing and format:
- Signed using secret from env var JWT_SECRET.
- Expiration controlled by JWT_EXPIRATION_MINUTES (default 30).
- Recommended algorithm: HS256.

Token claims (example):
```
{
  "sub": "<user id>",
  "username": "cv",
  "role": "admin",
  "iat": 1610000000,
  "exp": 1610000000 + (JWT_EXPIRATION_MINUTES * 60)
}
```

Server-side configuration (env vars):
- JWT_SECRET (required)
- JWT_EXPIRATION_MINUTES (optional, default 30)
- DB_ENCRYPTION_KEY (optional)

4) Security and operational notes

Passwords:
- Production: always store passwords hashed with a proven algorithm (bcrypt with cost >= 12 or Argon2). Do not store cleartext.
- Local dev seed: cleartext OK for quick dev only, but mark clearly in code and PRD.

Secrets handling:
- Never commit secrets. Use environment variables (JWT_SECRET, DB_ENCRYPTION_KEY).
- For local development, provide a .env.example with placeholders (do NOT commit actual secrets):
  - JWT_SECRET="${JWT_SECRET}"
  - DB_ENCRYPTION_KEY="${DB_ENCRYPTION_KEY}"
  - JWT_EXPIRATION_MINUTES=30

Backup/restore (local):
- Export: docker exec -t sivi_design_db_container pg_dump -U sivi_user sivi_db > sivi_db_dump.sql
- Import: psql "postgresql://sivi_user:sivi_pass@localhost:5432/sivi_db" -f sivi_db_dump.sql
- Inspect volume: docker volume inspect cv_design_data

Migrating to managed cloud Postgres (notes):
- Export local: pg_dump --format=custom -f dumpfile
- Create managed DB instance and apply schema first
- Use pg_restore to import data
- Update app configuration with managed DB connection string and rotate secrets

5) Acceptance criteria / tests

- Dev can run: docker compose -f docker-compose.postgres.yml up -d and the DB is reachable on localhost:5432
- Dev can run seed SQL and create initial user 'cv' with password 'cv'
- POST /login with credentials cv/cv returns 200 and JSON containing a token
- JWT token includes claim role: "admin" and verifies successfully using JWT_SECRET and expires per JWT_EXPIRATION_MINUTES

Test hints:
- Unit/integration test should:
  1. Start DB (or use test DB)
  2. Run seed
  3. POST /login
  4. Verify response 200 and token
  5. Decode token with JWT_SECRET and assert claims and exp

6) Migration planning (high level)

Steps to move to cloud-managed Postgres:
1. Choose provider (AWS RDS / AWS Aurora / Google Cloud SQL / Neon / Supabase) — provider decision TBD.
2. Add migration tooling (Flyway, golang-migrate, Alembic, Knex migrations) and check migrations into repo.
3. Freeze writes and take logical export (pg_dump) of production/local DB if migrating real data.
4. Provision managed DB, apply schema via migration tooling, import data via pg_restore.
5. Update app config with new connection string and rotate secrets.
6. Run smoke tests and promote new DB to production.

Backlog (created separately in project backlog):
- create-postgres-docker-compose
- create-schema-and-migrations
- seed-initial-user
- implement-login-endpoint-and-jwt
- add-jwt-config-and-secret-handling
- add-tests-for-login-flow

Branch & commit

Suggested branch name: feature/prd-login
Suggested commit message: "Add PRD for Login feature and backlog todos\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

Follow-up questions / decisions needed

- Provider choice for managed Postgres (AWS/GCP/Neon/Supabase)?
- Which migration tooling should the team standardize on (Flyway / golang-migrate / Knex / Alembic)?

---

Notes: Do NOT commit secrets. Use placeholders like "${JWT_SECRET}" in examples.
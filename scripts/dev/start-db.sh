#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.postgres.yml"

usage() {
  cat <<EOF
Usage: $0 {up|down|seed|help}

Commands:
  up     Start Postgres in background (docker compose -f $COMPOSE_FILE up -d)
  down   Stop Postgres (docker compose -f $COMPOSE_FILE down)
  seed   Create users table (if missing) and insert dev user 'cv'/'cv'
  help   Show this message

Examples:
  $0 up
  $0 seed
  # Run server (from repo root):
  #  cp .env.example .env && edit .env to add JWT_SECRET
  #  cd be && npm run start:dev
EOF
}

cmd=${1:-help}

case "$cmd" in
  up)
    echo "Starting Postgres (docker compose -f $COMPOSE_FILE up -d)"
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Postgres started on localhost:5432 (container: sivi_design_db_container)"}
    ;;
  down)
    echo "Stopping Postgres (docker compose -f $COMPOSE_FILE down)"
    docker compose -f "$COMPOSE_FILE" down
    ;;
  seed)
    echo "Seeding database cv_db on localhost:5432"
    SEED_SQL="CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";\nCREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username text NOT NULL UNIQUE, password text NOT NULL, role text NOT NULL DEFAULT 'user', created_at timestamp with time zone NOT NULL DEFAULT now());\nINSERT INTO users (username, password, role) VALUES ('cv', 'cv', 'admin') ON CONFLICT (username) DO NOTHING;"

    psql "postgresql://sivi_user:sivi_pass@localhost:5432/sivi_db" -c "$SEED_SQL"
    echo "Seed complete."
    ;;
  help|*)
    usage
    ;;
esac

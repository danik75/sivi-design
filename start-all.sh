#!/usr/bin/env bash
set -euo pipefail

# start-all.sh — Start Docker (if needed), DB, seed, frontend (React/Vite) and backend (Nest) for local development.
# Place at repo root and run: ./start-all.sh

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Repository root: $REPO_ROOT"

START_LOG="/tmp/sivi_start_all.log"
: > "$START_LOG"
exec > >(tee -a "$START_LOG") 2>&1

echo "=== start-all.sh $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Helper: wait for docker to respond
wait_for_docker() {
  local timeout=${1:-60}
  local waited=0
  until docker info >/dev/null 2>&1; do
    if [ "$waited" -ge "$timeout" ]; then
      echo "Timed out waiting for Docker (waited ${timeout}s)" >&2
      return 1
    fi
    sleep 2
    waited=$((waited+2))
  done
  return 0
}

# Ensure docker daemon is running (attempt macOS Docker.app launch, or systemctl on Linux)
if docker info >/dev/null 2>&1; then
  echo "Docker daemon already responding"
else
  echo "Docker daemon not responding — attempting to start"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "/Applications/Docker.app" ]; then
      echo "Opening Docker.app..."
      open -a Docker || true
      echo "Waiting up to 60s for Docker to become ready..."
      if wait_for_docker 60; then
        echo "Docker is ready"
      else
        echo "Docker did not become ready in time; please start Docker manually and re-run this script" >&2
      fi
    else
      echo "Docker.app not found at /Applications/Docker.app; please start Docker manually" >&2
    fi
  else
    if command -v systemctl >/dev/null 2>&1; then
      echo "Attempting: sudo systemctl start docker"
      sudo systemctl start docker || true
      echo "Waiting up to 60s for Docker to become ready..."
      if wait_for_docker 60; then
        echo "Docker is ready"
      else
        echo "Docker did not become ready; please start it manually" >&2
      fi
    else
      echo "Cannot auto-start Docker on this platform. Please start Docker manually and re-run." >&2
    fi
  fi
fi

# Start Postgres via docker-compose
COMPOSE_FILE="${REPO_ROOT}/docker-compose.postgres.yml"
if [ -f "$COMPOSE_FILE" ]; then
  echo "Starting Postgres with docker compose -f $COMPOSE_FILE up -d"
  docker compose -f "$COMPOSE_FILE" up -d
else
  echo "docker-compose.postgres.yml not found in repo root; please add it" >&2
  exit 1
fi

# Wait for DB port to be open in container
echo "Waiting for Postgres container 'sivi_design_db_container' to accept connections..."
# Wait up to 30s
for i in $(seq 1 30); do
  if docker exec -i sivi_design_db_container pg_isready -U sivi_user >/dev/null 2>&1; then
    echo "Postgres ready"
    break
  fi
  sleep 1
done

# Seed DB: copy db/schema.sql and db/seed.sql into container and apply (schema first)
if [ -f "$REPO_ROOT/db/schema.sql" ]; then
  echo "Copying db/schema.sql into container and applying"
  docker cp "$REPO_ROOT/db/schema.sql" sivi_design_db_container:/tmp/schema.sql || true
  docker exec -i sivi_design_db_container psql -U sivi_user -d sivi_db -f /tmp/schema.sql || echo "Schema applied (or schema command failed)"
else
  echo "No db/schema.sql found; skipping schema apply"
fi

if [ -f "$REPO_ROOT/db/seed.sql" ]; then
  echo "Copying db/seed.sql into container and applying"
  docker cp "$REPO_ROOT/db/seed.sql" sivi_design_db_container:/tmp/seed.sql || true
  docker exec -i sivi_design_db_container psql -U sivi_user -d sivi_db -f /tmp/seed.sql || echo "Seed applied (or seed command failed)"
else
  echo "No db/seed.sql found; skipping seed"
fi

# Start frontend (fe) — Vite React
FE_DIR="$REPO_ROOT/fe"
if [ -d "$FE_DIR" ]; then
  echo "Starting frontend (fe)"
  (cd "$FE_DIR" && npm install --no-audit --no-fund)
  # start detached with nohup, logs to /tmp/fe_server.log
  nohup sh -c "cd '$FE_DIR' && npm run dev" > /tmp/fe_server.log 2>&1 &
  echo "Frontend started (logs: /tmp/fe_server.log)"
else
  echo "Frontend directory not found at $FE_DIR; skipping frontend"
fi

# Start backend (be) — NestJS
BE_DIR="$REPO_ROOT/be"
if [ -d "$BE_DIR" ]; then
  echo "Starting backend (be)"
  (cd "$BE_DIR" && npm install --no-audit --no-fund)
  export PGHOST=${PGHOST:-localhost}
  export PGPORT=${PGPORT:-5432}
  export PGUSER=${PGUSER:-sivi_user}
  export PGPASSWORD=${PGPASSWORD:-sivi_pass}
  export PGDATABASE=${PGDATABASE:-sivi_db}
  export JWT_SECRET=${JWT_SECRET:-devsecret}
  export JWT_EXPIRATION_MINUTES=${JWT_EXPIRATION_MINUTES:-30}

  nohup sh -c "cd '$BE_DIR' && export PGHOST='$PGHOST' PGPORT='$PGPORT' PGUSER='$PGUSER' PGPASSWORD='$PGPASSWORD' PGDATABASE='$PGDATABASE' JWT_SECRET='$JWT_SECRET' JWT_EXPIRATION_MINUTES='$JWT_EXPIRATION_MINUTES' && npm run start:dev" > /tmp/be_server.log 2>&1 &
  echo "Backend started (logs: /tmp/be_server.log)"
else
  echo "Backend directory not found at $BE_DIR; skipping backend"
fi

# Show status summary
echo "\n=== Status summary ==="
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "backend not listening on 3000"
  lsof -nP -iTCP:5173 -sTCP:LISTEN || echo "frontend not listening on 5173"
fi

echo "Logs: /tmp/fe_server.log (frontend), /tmp/be_server.log (backend), $START_LOG (this run)"

echo "start-all.sh completed"

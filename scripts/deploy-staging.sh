#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RAILWAY_BE_URL="https://affectionate-hope-production-549d.up.railway.app"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[staging]${NC} $*"; }
warn() { echo -e "${YELLOW}[staging]${NC} $*"; }
fail() { echo -e "${RED}[staging] ERROR:${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------
command -v railway >/dev/null 2>&1 || fail "railway CLI not found. Run: npm install -g @railway/cli"
command -v vercel  >/dev/null 2>&1 || fail "vercel CLI not found.  Run: npm install -g vercel"

railway whoami >/dev/null 2>&1  || fail "Not logged in to Railway. Run: railway login"
vercel whoami  >/dev/null 2>&1  || fail "Not logged in to Vercel.  Run: vercel login"

# ---------------------------------------------------------------------------
# Backend — build & deploy to Railway
# ---------------------------------------------------------------------------
log "Building backend..."
cd "$REPO_ROOT/be"
npm ci --silent
npm run build

log "Deploying backend to Railway..."
railway up --detach --service 44900def-7551-41c5-b929-0bc4e4c2c0a6

log "Backend deployed → $RAILWAY_BE_URL"

# ---------------------------------------------------------------------------
# Frontend — build & deploy to Vercel
# ---------------------------------------------------------------------------
log "Deploying frontend to Vercel..."
cd "$REPO_ROOT/fe"
npm ci --silent

npx vercel --yes \
  --env VITE_API_BASE_URL="$RAILWAY_BE_URL" \
  --build-env VITE_API_BASE_URL="$RAILWAY_BE_URL"

log "Done. Staging is live:"
log "  FE → https://fe-six-teal.vercel.app"
log "  BE → $RAILWAY_BE_URL"

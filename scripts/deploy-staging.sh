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

# Required Railway env vars — set once via:
#   railway variables set --service 44900def-7551-41c5-b929-0bc4e4c2c0a6 "GROQ_API_KEY=<key>"
# The script does not set secrets — they are managed manually in Railway dashboard.
REQUIRED_SECRETS=(GROQ_API_KEY JWT_SECRET PGPASSWORD)
for secret in "${REQUIRED_SECRETS[@]}"; do
  railway variables --service 44900def-7551-41c5-b929-0bc4e4c2c0a6 2>/dev/null | grep -q "^║ $secret" || \
    warn "Railway variable '$secret' may not be set — check dashboard before deploying"
done

# ---------------------------------------------------------------------------
# Target selection:  ./deploy-staging.sh [be|fe|all]   (default: all)
# The two deploys are independent — a backend failure must NOT stop the
# frontend from shipping (that previously left the client un-refreshed).
# ---------------------------------------------------------------------------
TARGET="${1:-all}"
be_status="skipped"
fe_status="skipped"

# Note: `set -e` is suppressed inside a function invoked as an `if` condition,
# so each critical step guards itself with `|| return 1`.
deploy_be() {
  log "Building backend..."
  cd "$REPO_ROOT/be" || return 1
  npm ci --silent || return 1
  npm run build || return 1
  log "Deploying backend to Railway..."
  railway up --detach --service 44900def-7551-41c5-b929-0bc4e4c2c0a6 || return 1
  log "Backend deployed → $RAILWAY_BE_URL"
}

deploy_fe() {
  log "Deploying frontend to Vercel..."
  cd "$REPO_ROOT/fe" || return 1
  npm ci --silent || return 1
  npx vercel --prod --yes \
    --env VITE_API_BASE_URL="$RAILWAY_BE_URL" \
    --build-env VITE_API_BASE_URL="$RAILWAY_BE_URL" || return 1
  log "Frontend deployed → https://fe-six-teal.vercel.app"
}

if [[ "$TARGET" == "be" || "$TARGET" == "all" ]]; then
  if deploy_be; then be_status="ok"; else be_status="FAILED"; warn "Backend deploy failed — continuing to frontend."; fi
fi

if [[ "$TARGET" == "fe" || "$TARGET" == "all" ]]; then
  if deploy_fe; then fe_status="ok"; else fe_status="FAILED"; warn "Frontend deploy failed."; fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
log "Deploy summary:"
log "  BE ($RAILWAY_BE_URL) → $be_status"
log "  FE (https://fe-six-teal.vercel.app) → $fe_status"

if [[ "$be_status" == "FAILED" || "$fe_status" == "FAILED" ]]; then
  fail "One or more deploys failed (see summary above)."
fi

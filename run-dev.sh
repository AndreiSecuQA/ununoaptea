#!/usr/bin/env bash
# ------------------------------------------------------------------------
# run-dev.sh — local dev runner (fără docker).
#
# Pornește backend + frontend pe localhost folosind SQLite pentru persistență,
# ca să nu ai nevoie de PostgreSQL instalat ca să probezi UI-ul.
#
# Stripe/S3/Email sunt stubbed — flow-ul de plată real cere variabilele reale
# în .env (copiază din .env.example).
#
# Usage:
#   chmod +x run-dev.sh
#   ./run-dev.sh
#
# Ctrl+C oprește ambele procese curat.
# ------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# --- Backend venv ---
if [ ! -d "$BACKEND/.venv" ]; then
  echo ">> creez $BACKEND/.venv (Python 3.11+)"
  python3 -m venv "$BACKEND/.venv"
  "$BACKEND/.venv/bin/pip" install --upgrade pip
  "$BACKEND/.venv/bin/pip" install -r "$BACKEND/requirements-dev.txt"
fi

# --- Frontend deps ---
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo ">> npm install în $FRONTEND"
  (cd "$FRONTEND" && npm install)
fi

# --- Env pentru backend ---
export APP_ENV=development
export APP_SECRET_KEY="${APP_SECRET_KEY:-dev-local-secret-key-not-for-production-0123456789}"
export DATABASE_URL="${DATABASE_URL:-sqlite+aiosqlite:///./unu-noaptea.db}"
export EMAIL_PROVIDER="${EMAIL_PROVIDER:-console}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_dummy}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_dummy}"
export STRIPE_DIGITAL_PRICE_ID="${STRIPE_DIGITAL_PRICE_ID:-price_dummy}"
export S3_BUCKET="${S3_BUCKET:-unu-noaptea-local}"
export S3_REGION="${S3_REGION:-eu-central-1}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-andrei.s3cu@gmail.com}"
# bcrypt hash for "changeme123" — change în producție
export ADMIN_PASSWORD_HASH="${ADMIN_PASSWORD_HASH:-\$2b\$12\$KIXqH2tJAjf9zPg6h6T/meOtYyvyy0HKYqVEy5xGZjN1jH3hnbU6.}"

cleanup() {
  echo
  echo ">> opresc procesele..."
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ">> pornesc backend pe http://127.0.0.1:8000 (docs: /docs)"
(cd "$BACKEND" && "$BACKEND/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --reload) &

echo ">> pornesc frontend pe http://127.0.0.1:5173"
(cd "$FRONTEND" && npm run dev -- --host 127.0.0.1 --port 5173) &

echo
echo "================================================================"
echo "  Unu Noaptea Calendar — dev mode"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000/docs"
echo "  Ctrl+C pentru a opri."
echo "================================================================"

wait

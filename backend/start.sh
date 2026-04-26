#!/usr/bin/env sh
# Production entrypoint — runs DB migrations then starts uvicorn.
# Railway injects $PORT; default to 8000 locally.
set -e

: "${PORT:=8000}"

echo ">> environment"
echo "   PORT=${PORT}"
echo "   APP_ENV=${APP_ENV:-unset}"
echo "   DEMO_MODE=${DEMO_MODE:-unset}"
# Print only whether DATABASE_URL is set — not the credentials.
if [ -n "${DATABASE_URL}" ]; then
  echo "   DATABASE_URL=set (${#DATABASE_URL} chars)"
else
  echo "   DATABASE_URL=MISSING"
fi

# Detect the .env.example placeholder leaking into Railway config. Railway's
# "Suggested Variables" feature copies it verbatim if the user clicks Apply.
# We no longer fail on this — config.py falls back to SQLite — but we still
# print a loud warning so the operator can fix it for persistence.
SQLITE_FALLBACK=0
case "${DATABASE_URL}" in
  *"user:pass@db:5432"*|*"user:pass@localhost"*|"")
    SQLITE_FALLBACK=1
    echo ""
    echo "!! DATABASE_URL is missing or the .env.example placeholder."
    echo "!! Falling back to ephemeral SQLite so the demo can boot."
    echo "!! Data WILL be wiped on container restart."
    echo "!! For persistence: in Railway → backend service → Variables, set"
    echo "!!   DATABASE_URL=\${{Postgres.DATABASE_URL}}"
    echo "!! (reference variable, not a literal). Then redeploy."
    echo ""
    ;;
esac

if [ "${SQLITE_FALLBACK}" = "1" ]; then
  echo ">> skipping alembic — schema is auto-created from models on SQLite startup"
else
  echo ">> alembic upgrade head"
  if ! alembic upgrade head; then
    echo ""
    echo "!! alembic upgrade FAILED — starting uvicorn anyway so the"
    echo "!! healthcheck and /docs can report the error. Fix DATABASE_URL"
    echo "!! and redeploy. Missing migrations => 500 on /orders API calls."
    echo ""
  fi
fi

echo ">> starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --proxy-headers --forwarded-allow-ips='*'

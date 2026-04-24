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

echo ">> alembic upgrade head"
if ! alembic upgrade head; then
  echo ""
  echo "!! alembic upgrade FAILED — starting uvicorn anyway so the"
  echo "!! healthcheck and /docs can report the error. Fix DATABASE_URL"
  echo "!! and redeploy. Missing migrations => 500 on /orders API calls."
  echo ""
fi

echo ">> starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --proxy-headers --forwarded-allow-ips='*'

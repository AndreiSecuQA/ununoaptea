#!/usr/bin/env sh
# Production entrypoint — runs DB migrations then starts uvicorn.
# Railway injects $PORT; default to 8000 locally.
set -e

: "${PORT:=8000}"

echo ">> alembic upgrade head"
alembic upgrade head

echo ">> starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --proxy-headers --forwarded-allow-ips='*'

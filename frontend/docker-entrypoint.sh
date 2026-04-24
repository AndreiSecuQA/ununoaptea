#!/bin/sh
# Nginx entrypoint — substitutes $PORT into conf and execs nginx.
# Done by hand (not relying on the nginx:alpine template mechanism)
# so that nginx variables like $uri / $host are never touched.
set -e

: "${PORT:=8080}"

CONF_TMPL=/etc/nginx/templates/default.conf.template
CONF_OUT=/etc/nginx/conf.d/default.conf

if [ -f "$CONF_TMPL" ]; then
  # Only substitute the tokens we control (__PORT__). No envsubst, no risk
  # of clobbering nginx variables.
  sed "s|__PORT__|${PORT}|g" "$CONF_TMPL" > "$CONF_OUT"
fi

echo ">> nginx listening on port ${PORT}"
nginx -t
exec nginx -g 'daemon off;'

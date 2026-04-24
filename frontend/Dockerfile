# ============================================================
# Multi-stage production image: Vite build → nginx static serve.
# Railway injects $PORT at runtime; our entrypoint sed-substitutes
# the placeholder in the nginx config before starting nginx.
# ============================================================

# --- Stage 1: build the static bundle -----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_URL / VITE_DEMO_MODE are baked at build time. Railway passes them
# as build args via the service's variables (see RAILWAY_DEPLOY.md).
ARG VITE_API_URL
ARG VITE_DEMO_MODE
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve via nginx -------------------------------
FROM nginx:1.27-alpine

# Remove default config; ship our templated one + custom entrypoint.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint-railway.sh
RUN chmod +x /docker-entrypoint-railway.sh
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway provides $PORT; fall back to 8080 for local runs.
ENV PORT=8080
EXPOSE 8080
CMD ["/docker-entrypoint-railway.sh"]

# ============================================================
# Multi-stage production image: Vite build → nginx static serve.
# Railway injects $PORT at runtime; nginx config is templated
# so the listen port is rewritten on container start.
# ============================================================

# --- Stage 1: build the static bundle -----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_URL is baked at build time. Railway passes it as a build arg
# via the service's variables (see RAILWAY_DEPLOY.md).
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve via nginx -------------------------------
FROM nginx:1.27-alpine

# Remove default config; ship our templated one.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine's entrypoint auto-runs envsubst on /etc/nginx/templates/*
# and copies results into /etc/nginx/conf.d/. PORT is provided by Railway.
ENV PORT=8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for reportlab (fonts, image libs) + health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libjpeg-dev \
      libfreetype6-dev \
      libpng-dev \
      curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY start.sh .
RUN chmod +x start.sh

# Railway injects $PORT (commonly 8080). start.sh reads it with fallback 8000.
EXPOSE 8000
CMD ["./start.sh"]

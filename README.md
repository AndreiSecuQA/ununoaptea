# Calendar: Vorbim la UNU NOAPTEA

Full-stack web app pentru generarea de calendare filozofice personalizate de 365 de zile — brand **Unu Noaptea**.

## Arhitectură

- **Backend:** FastAPI + SQLAlchemy async + PostgreSQL + ReportLab + Stripe + S3/R2 + Resend
- **Frontend:** React 18 + Vite + TypeScript strict + Tailwind + Zustand + @dnd-kit
- **Deploy:** Docker Compose local, GitHub Actions CI/CD

## Structura

```
.
├── backend/                    # FastAPI app
│   ├── app/
│   │   ├── api/                # Endpoints (orders, webhooks, downloads, legal, admin)
│   │   ├── core/               # Config, logging, security
│   │   ├── db/                 # SQLAlchemy base, session
│   │   ├── models/             # Order, ProcessedStripeEvent, AdminUser
│   │   ├── schemas/            # Pydantic (CalendarConfig etc.)
│   │   ├── services/           # pdf_generator, stripe, email, s3
│   │   ├── workers/            # BackgroundTasks orchestration
│   │   ├── data/               # quotes.py, salutations.py, holidays.py
│   │   └── assets/             # fonts, backgrounds, icons, brand
│   ├── alembic/                # DB migrations
│   └── tests/                  # pytest
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── components/         # wizard, preview, ui, layout
│   │   ├── pages/              # Home, Wizard, OrderStatus, Download, legal
│   │   ├── hooks/              # useWizardState, useOrderStatus
│   │   ├── services/           # api, stripe, previewRenderer
│   │   ├── lib/                # dayClassifier, salutations, quotesSample
│   │   └── types/              # calendar.types.ts
│   └── public/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick start

```bash
# 1. Copiază env
cp .env.example .env
# completează STRIPE_*, S3_*, RESEND_API_KEY

# 2. Ridică stack-ul
docker compose up --build

# 3. Aplică migrațiile
docker compose exec api alembic upgrade head

# 4. Vezi:
#    Frontend:  http://localhost:5173
#    Backend:   http://localhost:8000/docs
```

## Decizii MVP

- **Digital-only** €15 (PDF). Livrare fizică amânată v2.
- **Un template A5** (`template1.png`) pentru toate cele 367 pagini.
- **Stripe Checkout** (hosted, redirect). Webhook cu idempotency.
- **FastAPI BackgroundTasks** pentru generare PDF (nu Celery — YAGNI).
- **Magic-link JWT** pentru download (90 zile).
- **GDPR complet:** Privacy, ToS, Cookies, `/delete-my-data` flow.
- **Preview client-side** (React). Fără endpoint `/calendar/preview`.

## Deploy

Pe Railway: `RAILWAY_DEPLOY.md` — ghid pas-cu-pas (3 servicii: backend + frontend + PostgreSQL).

Quick local (fără docker): `./run-dev.sh` — pornește backend pe SQLite și frontend cu hot-reload.

## Owner

Andrei — `andrei.s3cu@gmail.com`

## License

Proprietary. © Unu Noaptea.

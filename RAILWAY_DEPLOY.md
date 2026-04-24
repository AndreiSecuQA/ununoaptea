# Deploy pe Railway — Calendar Unu Noaptea

Ghid pas-cu-pas. Presupune că ai un cont Railway (free tier OK pentru teste) și codul într-un repo GitHub.

---

## ⚡ Quick start — Demo pentru fondator (fără plăți, ~15 min)

Dacă vrei să arăți produsul fondatorului Unu Noaptea înainte de a intra în Stripe / S3 / Resend:

**Servicii necesare:** doar `backend` + `frontend` + `PostgreSQL`. Nimic altceva.

**Backend — variabile minime:**

```env
APP_ENV=production
APP_SECRET_KEY=<openssl rand -hex 32>
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
DEMO_MODE=true
EMAIL_PROVIDER=console
ADMIN_EMAIL=andrei.s3cu@gmail.com
```

**Frontend — variabile minime:**

```env
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
VITE_DEMO_MODE=true
```

**Cum funcționează demo-ul:**

- Wizard-ul e identic cu versiunea finală (7 pași).
- La Step 7 butonul e **„Generează calendarul demo →"** (nu „Plătește €15").
- Backend-ul sare peste Stripe, marchează comanda ca plătită și generează PDF-ul imediat.
- PDF-ul e salvat pe disk-ul containerului (`/tmp/unu_noaptea_demo_pdfs/…`) — nu ai nevoie de S3.
- Pe pagina de status, când e gata, apare direct butonul **„Descarcă calendarul →"** (fără email).
- Emailurile sunt doar log-uite în console (fără Resend).

**Limitări demo:**

- PDF-urile se pierd la redeploy (sunt pe `/tmp`, nu persistente). OK pentru demo — folosești tokenul cât ține sesiunea.
- Niciun email real nu pleacă.
- Nu trece prin Stripe, deci flow-ul de plată nu e validat end-to-end.

**Când fondatorul acceptă:** setezi `DEMO_MODE=false` pe backend, `VITE_DEMO_MODE=false` pe frontend, adaugi `STRIPE_*`, `S3_*`, `RESEND_API_KEY` (vezi secțiunile 7-9 de mai jos), redeploy ambele servicii.

---

## Arhitectura pe Railway

Un singur **Railway project** cu **3 servicii**:

```
  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │   frontend   │  →    │   backend    │  →    │  PostgreSQL  │
  │   (nginx)    │       │  (FastAPI)   │       │   (Railway)  │
  └──────────────┘       └──────────────┘       └──────────────┘
        :443                   :443                   :5432
         ↓                       ↓
   public domain          public + internal
  `${frontend}.up         `${backend}.up
   .railway.app`           .railway.app`
```

Plus servicii externe (obligatorii pentru flow-ul complet):
- **Stripe** — checkout + webhook
- **AWS S3** sau **Cloudflare R2** — stocare PDF-uri
- **Resend** — email tranzacțional (sau SendGrid)

---

## Pasul 1 — Push la GitHub

```bash
cd "~/Side Hustle/Unu Noaptea Calendar"
git init                      # doar dacă nu există deja
git add .
git commit -m "Initial deploy-ready build"
# creează repo gol pe GitHub apoi:
git remote add origin git@github.com:<user>/unu-noaptea-calendar.git
git push -u origin main
```

Verifică că `.gitignore` exclude `.env`, `node_modules/`, `.venv*/`, `dist*/`. E deja configurat.

---

## Pasul 2 — Creează Railway project

1. Intră pe https://railway.com → **New Project** → **Deploy from GitHub repo**
2. Alege repo-ul.
3. Railway va propune auto un serviciu. Îl **ștergi** — noi adăugăm manual cele 3 servicii de mai jos ca să pointeze corect la subdirectoare.

---

## Pasul 3 — Adaugă PostgreSQL

1. În project → **+ New** → **Database** → **Add PostgreSQL**.
2. Railway provisionează un Postgres și expune variabilele:
   - `DATABASE_URL` (referențiabil ca `${{Postgres.DATABASE_URL}}`)
   - `DATABASE_PUBLIC_URL`, `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE`.

Noi folosim `DATABASE_URL`. Prefix-ul vine `postgresql://` — backend-ul îl coerce-ează automat la `postgresql+asyncpg://` (vezi `app/core/config.py`), deci nu trebuie să-l rescrii manual.

---

## Pasul 4 — Serviciul Backend

1. **+ New** → **GitHub Repo** → alege același repo.
2. Deschide service-ul nou creat → **Settings**:
   - **Service Name:** `backend`
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**` (ca să redeploy-uie doar la schimbări în backend)
   - **Builder:** Dockerfile (auto-detectat — `backend/Dockerfile`)
   - **Start Command:** lasă gol (preia din `railway.toml` → `./start.sh`)
3. În **Variables** adaugă (copiază valorile reale):

```env
APP_ENV=production
APP_SECRET_KEY=<openssl rand -hex 32>
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
CORS_EXTRA_ORIGINS=

# Stripe (live sau test — vezi Stripe dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # setat după ce configurezi webhook-ul la Pasul 7
STRIPE_DIGITAL_PRICE_ID=price_...

# S3 / R2
S3_ENDPOINT_URL=                   # gol pentru AWS; pentru R2: https://<acct>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=unu-noaptea-calendars
S3_REGION=eu-central-1

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=calendare@ununoaptea.com
EMAIL_FROM_NAME=Unu Noaptea

# Admin
ADMIN_EMAIL=andrei.s3cu@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt hash>  # vezi secțiunea "Generate admin hash" de mai jos

# Observability (opțional)
SENTRY_DSN=
LOG_LEVEL=INFO
```

4. **Settings → Networking → Generate Domain** → primești `backend-production-xxxx.up.railway.app`.
5. **Deploy**. Urmărește log-ul; ar trebui să vezi:
   ```
   >> alembic upgrade head
   INFO  [alembic.runtime.migration] Running upgrade  -> 0001_initial
   >> starting uvicorn on 0.0.0.0:8080
   INFO: Uvicorn running on http://0.0.0.0:8080
   ```
6. Smoke-test: `curl https://<backend-domain>/api/v1/health` → `{"status":"ok"}`.

### Generate admin hash

Rulează local:

```bash
python3 -c "from passlib.hash import bcrypt; print(bcrypt.hash('parola-ta-puternica'))"
```

Lipește rezultatul în `ADMIN_PASSWORD_HASH`.

---

## Pasul 5 — Serviciul Frontend

1. **+ New** → **GitHub Repo** → același repo.
2. **Settings:**
   - **Service Name:** `frontend`
   - **Root Directory:** `frontend`
   - **Watch Paths:** `frontend/**`
   - **Builder:** Dockerfile (auto)
3. **Variables:**

```env
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

> **Important:** `VITE_API_URL` e build-time (baked în bundle). Orice schimbare cere un redeploy.

4. **Settings → Networking → Generate Domain**.
5. **Deploy**. Vizitează domeniul — vezi landing-ul Unu Noaptea.

### Feedback loop CORS

După ce ambele servicii au domeniu public:
- Backend `FRONTEND_URL` → pointează la frontend domain.
- Frontend `VITE_API_URL` → pointează la backend domain.

Dacă folosești referințe `${{frontend.RAILWAY_PUBLIC_DOMAIN}}` / `${{backend.RAILWAY_PUBLIC_DOMAIN}}`, Railway le rezolvă automat.

---

## Pasul 6 — Custom domain (opțional, recomandat)

Recomandat să folosești domeniu real (ex: `calendar.ununoaptea.com`) ca să nu fii legat de `railway.app`.

1. Backend service → **Settings → Networking → Custom Domain** → `api.ununoaptea.com` → urmează instrucțiunile CNAME.
2. Frontend service → similar → `calendar.ununoaptea.com`.
3. Actualizează:
   - Backend `FRONTEND_URL=https://calendar.ununoaptea.com`
   - Frontend `VITE_API_URL=https://api.ununoaptea.com`
4. Redeploy frontend (pentru rebake).

---

## Pasul 7 — Configurează Stripe webhook

1. În Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://<backend-domain>/api/v1/webhooks/stripe`
3. **Events to send:** `checkout.session.completed`, `payment_intent.payment_failed`
4. Copiază **Signing secret** (`whsec_...`) → lipește în Railway backend `STRIPE_WEBHOOK_SECRET`.
5. Redeploy backend.

Test rapid din Stripe: **Send test webhook** → `checkout.session.completed`. Verifică în Railway logs că ajunge și e procesat.

---

## Pasul 8 — S3 bucket setup

### Opțiunea A: Cloudflare R2 (mai ieftin, fără egress fee)

1. Dashboard Cloudflare → **R2** → **Create bucket** `unu-noaptea-calendars`.
2. **API Tokens → Create API token** cu permission `Object Read & Write`.
3. În Railway backend:
   ```
   S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=<token access key>
   S3_SECRET_ACCESS_KEY=<token secret>
   S3_REGION=auto
   ```

### Opțiunea B: AWS S3

1. Creează bucket `unu-noaptea-calendars` în regiunea aleasă (`eu-central-1` default în config).
2. IAM user cu policy minimal:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::unu-noaptea-calendars/*"
       }
     ]
   }
   ```
3. Lipește `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`.
4. `S3_ENDPOINT_URL` rămâne gol (implicit `s3.<region>.amazonaws.com`).

---

## Pasul 9 — Resend setup (email)

1. https://resend.com → **API Keys** → creează cheie.
2. Verifică domeniul `ununoaptea.com` (DNS records TXT + DKIM).
3. În Railway: `RESEND_API_KEY=re_...`, `EMAIL_FROM=calendare@ununoaptea.com`.
4. Redeploy.

Pentru test fără domeniu custom: setează `EMAIL_FROM=onboarding@resend.dev` (adresă de test Resend).

---

## Pasul 10 — Verificare end-to-end

1. Vizitează frontend-ul → creează un calendar (Pași 1–7) cu Stripe **test card** `4242 4242 4242 4242`.
2. După redirect, ar trebui să vezi OrderStatus page cu polling.
3. În ~5–10s, status devine `ready` → CTA download.
4. Verifică:
   - Stripe Dashboard → Payments → comanda apare.
   - Railway backend logs → `pdf.generated pages=367`.
   - Email inbox → 2 emailuri (confirmation + ready cu link).
   - S3/R2 bucket → PDF-ul e acolo.

---

## Setup-ul scheletic în bash (cli, opțional)

Dacă preferi CLI în loc de UI-ul Railway:

```bash
npm i -g @railway/cli
railway login
railway link                          # leagă folderul de project
railway add --database postgres

# Deploy backend
cd backend
railway up --service backend

# Deploy frontend
cd ../frontend
railway up --service frontend

# Set variables (exemplu)
railway variables --service backend --set APP_SECRET_KEY="$(openssl rand -hex 32)"
railway variables --service backend --set STRIPE_SECRET_KEY="sk_..."
# ...etc
```

---

## Troubleshooting

| Simptom | Cauză | Fix |
|---|---|---|
| Backend crash la start cu `psycopg2.OperationalError` | DATABASE_URL lipsește sau nu e postgres | Verifică că variabila există și `${{Postgres.DATABASE_URL}}` e rezolvată |
| 502 pe frontend după deploy | nginx listen pe port greșit | Verifică că `PORT` env e setat (Railway o face automat) |
| CORS error în browser | FRONTEND_URL nu e setat sau e greșit | În backend vars: `FRONTEND_URL=https://<domain-frontend>` + redeploy |
| PDF gen → 500 | Lipsesc credentialele S3 / email | Testează separat `S3_*` și `RESEND_API_KEY` |
| Stripe webhook 400 signature invalid | `STRIPE_WEBHOOK_SECRET` e pentru alt endpoint | Re-copiază secret-ul din endpoint-ul Railway în Stripe |
| Migration failed | Alembic nu poate conecta la Postgres | Verifică variabila `DATABASE_URL` + că Postgres service e up |
| Frontend vede old API URL | `VITE_API_URL` e build-time; trebuie rebuild | **Redeploy frontend** după orice schimbare |

---

## Costuri estimate (free tier)

| Serviciu | Free tier | Estimat la 100 comenzi/lună |
|---|---|---|
| Railway Starter | $5 trial credit/lună | ~$5–10 (backend + frontend + Postgres) |
| Cloudflare R2 | 10 GB free, fără egress | $0 |
| Resend | 100 emails/zi free, 3000/lună free | $0 pentru MVP |
| Stripe | Fără fee lunar, 1.4% + 0.25 EUR per tranzacție UE | ~€1.75/tranzacție la €15 |

Total fix lunar: **~$5–10** la volume mici.

---

## Next steps după deploy reușit

1. **Sentry** — activează monitoring: creează proiect pe https://sentry.io, lipește DSN în `SENTRY_DSN`.
2. **Analytics** — Plausible sau Umami self-hosted (ambele GDPR-friendly, fără cookie banner).
3. **Domain email** — DKIM/SPF/DMARC pentru livrabilitate maximă.
4. **Backup Postgres** — Railway face snapshots automate; verifică retention-ul în **Data → Backups**.
5. **Staging environment** — duplică projectul în Railway (environment secundar) → deploy din branch `staging`.

Sources:
- [PROMPT_FINAL.md](PROMPT_FINAL.md)
- [backend/railway.toml](backend/railway.toml)
- [frontend/railway.toml](frontend/railway.toml)

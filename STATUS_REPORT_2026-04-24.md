# Raport de stare — Calendar Unu Noaptea

**Data rulării autonome:** 24 aprilie 2026
**Rezultat:** Build-ul trece complet pe ambele pachete. Proiectul e funcțional end-to-end la nivel de cod; lipsesc doar asset-urile binare pe care le furnizezi tu (fonts, preview images, logo brand).

---

## Verificări executate

### Backend (`backend/`)
- **Ruff (lint):** `All checks passed!`
- **Mypy strict:** `Success: no issues found in 34 source files`
- **Pytest:** `43 passed` în ~5s
- **Coverage:** **74%** (depășește targetul `>70%` din spec)
- **PDF smoke test:** 367 pagini, 759 KB, generate în **4.07s** (target `<45s p95` — cu margine foarte mare)
- Toate endpoint-urile din spec sunt implementate:
  - `POST /orders/create`, `GET /orders/{id}/status`, `GET /orders/{id}/download`
  - `POST /webhooks/stripe` (idempotency via `ProcessedStripeEvent`)
  - `POST /gdpr/delete-my-data`, `GET /gdpr/delete-my-data/confirm`
  - `GET /legal/{privacy,terms,cookies}`
  - `GET /admin/orders`, `orders.csv`, `/metrics`, `POST /orders/{id}/resend-email`, `/regenerate`
  - `GET /health`

### Frontend (`frontend/`)
- **Typecheck (tsc):** clean
- **ESLint:** clean (am corectat `eslint.config.js` — pattern-ul de ignore era `dist/`, `dist2/`, `dist3/`; l-am normalizat la `dist*/` ca să nu mai eșueze la fiecare build nou)
- **Vitest:** `14 passed` (dayClassifier + useWizardState)
- **Build (vite):** reușește — output 418 KB JS / 22 KB CSS (138 KB / 4.7 KB gzipped)
- Routing complet în `App.tsx`: `/`, `/wizard`, `/orders/:id/status`, `/orders/:id/download`, `/privacy`, `/terms`, `/cookies`, `/delete-my-data`, `/admin`
- Toți cei 7 pași din wizard sunt prezenți: `Step1_BasicInfo` → `Step7_Payment`, plus `WizardShell` și `WizardNav`

### CI
- `.github/workflows/ci.yml` configurat pentru backend (Python 3.11: ruff + mypy + pytest cu coverage) și frontend (Node 20: lint + typecheck + vitest + build)

---

## Modificări făcute în această rulare

Un singur fix punctual — **`frontend/eslint.config.js`**: pattern-urile `dist/`, `dist2/`, `dist3/` înlocuite cu `dist*/` ca să prindă orice director de build viitor. Fără asta, `npm run lint` eșua cu 401 erori de `no-undef` pe bundle-urile generate.

Restul verificărilor au fost no-op — codul era deja în stare de merge.

---

## Conținut vs spec (ce merită știut)

| Resource | Actual | Target spec | Observație |
|---|---|---|---|
| Quote total | **223** | 910 (minim worst-case) | Fișierul `quotes.py` e marcat explicit în docstring drept "substantial seed, expand in production". Sistemul are fallback pentru pool-uri mici (cycle-with-recent-window). |
| Quote styles | Toate 5 (stoic/modern/spiritual/romanian_authors/existentialist) | 5 | ✓ |
| Citate / (style × pool) | 40–50 per stil, 47–138 per pool | 150–200 per stil | MVP viabil dacă user-ul bifează ≥ 2 stiluri. Dacă vrei să acoperi "worst case: doar 1 stil existențialist" fără repetiții dese, trebuie extinse pool-urile. |
| Salutations | 20 per categorie × 8 categorii | 20 per cat | ✓ |
| Holidays | 19 total, 14 MD + 14 RO | 11 MD + 11 RO | ✓ peste |
| SVG icons | **30** | 30 | ✓ exact |
| Template1 PNG | prezent (300 KB) | 1 file | ✓ |

---

## Asset-uri care încă lipsesc (owner-provided, conform spec)

Sunt listate în PROMPT_FINAL.md la secțiunea "Assets necesare (tu le pregătești)":

1. **`backend/app/assets/fonts/`** — gol. Necesită EB Garamond (Regular/Bold/Italic) + Inter (Regular/Medium/Bold). Generator-ul PDF face fallback pe Helvetica/Times dacă lipsesc — funcționează, dar nu arată premium.
2. **`backend/app/assets/brand/`** — directorul nu există încă. Necesită `logo.svg`.
3. **`frontend/public/fonts/`** — gol. Aceleași familii de font ca mai sus, servite pentru preview-ul în browser.
4. **`frontend/public/preview/`** — gol. Mockup-uri PNG pentru landing page (carousel).

Pot fi adăugate fără modificări de cod — paths-urile sunt deja referite.

---

## Recomandări pentru următorul pas

1. **Adaugă asset-urile binare de mai sus** — e impactul vizual cel mai mare cu cel mai mic efort.
2. **Extinde `quotes.py`** de la ~220 la 400–500 citate minim. Cel mai sigur e de adăugat 50-100 per stil, cu accent pe `stoic` și `modern` (pool-urile cele mai des bifate statistic).
3. **Testare e2e Playwright** — nu am găsit `playwright.config.ts` / `tests/e2e/`. Spec-ul cere testare completă flow landing → plată test → download. Testele unit (pytest + vitest) acoperă foarte bine codul, dar un smoke e2e e încă absent.
4. **Dovada live** — am construit local, dar n-am pornit `docker compose up`. Când rulezi tu local, verifică că:
   - webhookul Stripe primește `checkout.session.completed` (stripe-listener container)
   - email-ul de confirmare chiar pleacă (setează `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`)
   - presigned URL-ul din S3 e valid 24h (setează `S3_*`)

---

## Artifacte generate în această rulare

- `/tmp/sample-calendar.pdf` — 367 pagini, ieșire reală a pipeline-ului (în sandbox-ul de execuție, nu pe computerul tău; o rulare ulterioară îl poate salva în folderul proiectului dacă vrei inspecție).

Sources:
- [PROMPT_FINAL.md](computer:///Users/andreisecu/Side Hustle/Unu Noaptea Calendar/PROMPT_FINAL.md)
- [README.md](computer:///Users/andreisecu/Side Hustle/Unu Noaptea Calendar/README.md)

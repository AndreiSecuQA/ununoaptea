# Review: Prompt Calendar Unu Noaptea

**TL;DR:** Prompt-ul e bine structurat și ambițios, dar are ~10 găuri critice care vor produce cod greșit sau produs ne-livrabil. Mai jos sunt problemele ordonate după impact, cu fix sugerat pentru fiecare.

---

## CRITICE — fără ele produsul nu funcționează

### 1. Email-ul userului nu e capturat niciodată în wizard
Schema `Order` are `email: str`, dar nicăieri în Step 1–7 nu e cerut. Fără email:
- Nu poți trimite PDF-ul
- Nu poți valida "order ownership" la download
- Nu poți trimite confirmări

**Fix:** Adaugă câmp `email` la Step 1 (sau Step 7 înainte de checkout). Alternativ: folosește email-ul returnat de Stripe Checkout din sesiune (dar atunci ai dependență hard de Stripe).

### 2. Cum se autentifică userul la download?
Spec zice "Validate order ownership (by email token)" dar nu definește mecanismul. Fără asta, oricine cu `order_id` descarcă PDF-ul altcuiva.

**Fix:** Magic link pattern — la finalul plății trimiți email cu URL `https://.../download/{order_id}?token={signed_jwt}`. JWT semnat cu `SECRET_KEY`, expiră în 30 zile, conține `order_id` + `email`.

### 3. Emoji-uri în ReportLab NU se randează default
Secțiunea "Icons pool" listează emoji Unicode (🚀 🎯 🌙 etc.). ReportLab nu randează emoji color fără font special (NotoColorEmoji + configurare complicată). Va apărea chenar gol sau glyph alb-negru urât.

**Fix:** Folosește **SVG line-art icons** (Lucide, Heroicons, Phosphor) convertite la PNG/vectorial. În UI poți arăta emoji pentru rapiditate, dar pe PDF randezi SVG-urile corespondente. Maparea emoji→SVG trebuie definită explicit.

### 4. Stripe: Checkout SAU PaymentIntent — alege unul
Endpoint-ul `POST /orders/create` zice "Create Stripe PaymentIntent **or** Checkout Session". Apoi UI zice "Stripe Checkout (redirect)". Inconsistent.

**Fix:** Pentru MVP → **Stripe Checkout** (hosted). Simplu, capturează email, gestionează 3DS automat, compliant PCI. PaymentIntent doar dacă vrei UI custom (nu e cazul aici).

### 5. Webhook Stripe — idempotency lipsește
Stripe retrimite webhook-uri. Fără check de `event.id` deja procesat, vei genera același PDF de 3 ori, trimite 3 emailuri, încasa taxe de storage inutile.

**Fix:** Tabel `ProcessedStripeEvent(event_id PRIMARY KEY, processed_at)`. La începutul handler-ului, `INSERT ... ON CONFLICT DO NOTHING` și dacă n-a inserat → return 200 fără procesare.

### 6. "Other" category n-are quote pool
Step 5 are 5 categorii de iconițe (productive/rest/reflection/celebration/**other**). Dar PDF generator zice doar 4 quote pools. `DayType.HOLIDAY` și `DayType.MIXED` nu au sursă de citate definită.

**Fix:** Adaugă explicit: `general_quotes` pool (min 60 citate) folosit pentru `MIXED`. `HOLIDAY` → folosește `celebration_quotes`. Mapează fiecare `DayType` la exact un pool.

### 7. Cantitatea de citate e insuficientă
Pool-uri: 100+ productive, 80+ rest, etc. Într-un an, ~200 zile sunt productive. 100 citate = fiecare repetat de 2 ori. Nu e "unique quotes per day" cum cere criteriul de succes.

**Fix:** Pool-uri minime: productive 250, rest 120, reflection 80, celebration 50, general 80. SAU relaxează criteriul de succes ("no quote repeats within same week").

### 8. `hash()` în Python 3.3+ e randomizat între runs
`seed = hash(first_name + start_date)` → user comandă de 2 ori, primește calendare diferite. Nu e reproducible.

**Fix:** `seed = int(hashlib.sha256(f"{first_name}{start_date}".encode()).hexdigest()[:8], 16)`.

### 9. Livrarea fizică (€40) nu are pipeline definit
Spec zice că se plătește, dar nu spune cum ajunge produsul la user:
- Cine tipărește? (imprimantă partner? DTP local?)
- Cine expediază?
- Admin vede comenzile fizice unde?
- Workflow între "paid" și "shipped"?

**Fix:** Definește minim: admin dashboard (chiar și basic list) + email automat către tine/partener cu PDF + shipping address la fiecare comandă fizică. Adaugă stări `status: paid → printing → shipped → delivered`.

### 10. GDPR / ToS / Privacy Policy lipsesc complet
Produs EU, colectezi: nume, zile de naștere (date personale), adresă fizică, email, date de plată. Fără Privacy Policy + Terms + cookie consent:
- Stripe te poate bloca
- Amenzi GDPR până la 20M€
- User-ii nu pot cere ștergere date

**Fix:** Adaugă în deliverables: pagini `/privacy`, `/terms`, `/cookies` + banner consent + endpoint `DELETE /api/v1/orders/{id}/data` pentru GDPR right-to-erasure.

---

## IMPORTANTE — bug-uri sau decizii proaste de arhitectură

### 11. localStorage + endpoint `/session` — duplicare
Spec zice "Progress is saved in localStorage" DAR are și `POST /session` + `GET /session/{id}`. De ce ambele?

**Recomandare:** Doar localStorage până la Step 7. La checkout, trimiți tot payload-ul o singură dată. Scapă de modelul `Session` din DB (mai puțin schema, GDPR, housekeeping).

### 12. Celery e overkill pentru PDF < 30s
Celery + Redis + worker container adaugă complexitate mare. Pentru un job care rulează <30s, **FastAPI BackgroundTasks** sau un job queue in-process (arq, dramatiq) fac treaba cu 1/3 din stack.

**Recomandare:** Începe cu `BackgroundTasks`. Dacă ai >50 orders/zi, migrezi la Celery. YAGNI.

### 13. Preview endpoint e expensiv + expus public
`POST /calendar/preview` generează 3 pagini PDF la fiecare apăsare. Fără rate-limit, cineva spamuiește = servere moarte.

**Recomandare:** **Randare client-side** a preview-ului (ai deja componenta `CalendarPagePreview.tsx` în React cu aceeași logică). Elimini endpoint-ul, elimini și costul server.

### 14. React DnD are suport slab pe mobile
Pentru Step 5 (drag iconițe), `react-dnd` cu `TouchBackend` e flaky.

**Recomandare:** `@dnd-kit/core` — suport mobile nativ, modern, mai mic. Sau pattern simplu tap-to-select (cum deja menționezi pentru mobile — unifică pe toate platformele).

### 15. A5 page size cu numere greșite
Spec zice A5 = 419.5 × 595.3 points. Corect: **419.53 × 595.28** (sau folosește `reportlab.lib.pagesizes.A5` și n-ai probleme).

### 16. Holidays list incompletă
Lipsesc: 24 Ian (Unirea Principatelor - RO), 15 Aug (Adormirea Maicii Domnului - ambele), Rusalii/Pentecost (ambele), 30 Nov (Sf. Andrei - RO). Moldova: 9 mai e azi doar **Europa** (Victory Day a fost separată în 2023). Verifică lista actualizată.

### 17. Fonts: DejaVu e funcțional, nu premium
Produs "luxury, minimalist, premium" + DejaVu Sans = inconsistent.

**Recomandare:** **EB Garamond** (serif, elegant, gratis OFL, diacritice OK) + **Inter** sau **Montserrat** (sans). Bundle TTF-urile în `app/assets/fonts/` și înregistrează în ReportLab.

### 18. Contradicție productive_days + rest_days
Q1 cere multi-select "zile productive". Q2 cere multi-select "zile de odihnă". User poate selecta luni în ambele. Step 4 logic nu zice cine câștigă.

**Fix:** Validation: `productive_days ∩ rest_days = ∅`. Sau în UI: dezactivează opțiunea în Q2 dacă e selectată în Q1.

### 19. Reflection_day e single-select, dar e și zi productivă sau rest
Dacă user alege Duminică ca reflecție și Duminică e și în rest_days → conflict. Clasificarea zice `REST` check e înaintea lui `REFLECTION` → nu apare niciodată.

**Fix:** Ordine în `classify_day`: celebration → holiday → reflection → rest → productive → mixed. SAU exclude reflection_day din rest_days la input.

### 20. Shipping cost hardcoded nu e viabil
MD = €5 flat pentru o carte A5 de 367 pagini (~500-800g) e probabil sub cost real. Verifică Posta Moldovei / curier înainte.

---

## NICE-TO-HAVE — calitate & mentenabilitate

### 21. Zero strategie de testing
Plătești cu bani reali → ai nevoie de teste. Adaugă:
- `pytest` pentru backend: unit pe PDF generator, integrare pe webhook Stripe (cu `stripe-mock`)
- `vitest` + Playwright pe frontend
- Secțiune "Testing" în deliverables

### 22. Zero CI/CD
GitHub Actions basic: lint + test pe PR + deploy pe merge main. 1h de setup, economisește zile de debug în prod.

### 23. Accessibility nemenționat
EU Accessibility Act (iunie 2025) e obligatoriu pentru e-commerce. Form labels, ARIA, keyboard nav, screen reader. Lighthouse Accessibility > 90 în criterii de succes.

### 24. Refund policy — digital
Digital products în EU: user are 14-zile withdrawal right DAR renunță la el explicit pre-download. Adaugă checkbox "Renunț la dreptul de retragere și accept livrarea imediată" la Step 7.

### 25. Admin dashboard lipsește total
Cum vezi comenzile? Cum re-trimiți PDF dacă emailul eșuează? Cum ștergi date la cerere GDPR? Minim: `/admin` auth-protected cu listă orders + acțiuni basic.

### 26. Closing message 300 char e tight
Utilizatorul poate vrea mesaj mai personal. Propun 1000 chars cu counter UI.

### 27. "Ni ha ha" joke — confirmă că nu apare
Spec spune "do not expose to users". Verifică să nu apară accidental în quotes.py sau salutations.

### 28. Logging & observability
JSON logs e mentionat dar nimic despre Sentry / error tracking. Pentru payment flow, e esențial.

---

## Verdict

Prompt-ul e 80% acolo. Cu fix-urile de la **1–10** devine producible. **11–20** sunt calitative dar majore. Restul e polish.

**Recomandare concretă:**
1. Rezolvă criticele 1–10 direct în prompt (adaug secțiuni noi / corectez existente)
2. Decizii deliberate pe 11–20 (pot să simplific stack-ul dacă vrei MVP rapid)
3. Amână 21–28 după MVP funcțional

Dacă vrei, fac update direct la prompt cu toate fix-urile aplicate.

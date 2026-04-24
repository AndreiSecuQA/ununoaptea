# Claude Code Prompt — "Calendar: Vorbim la UNU NOAPTEA"

> **Versiune:** v2 (revizuit & extins)
> **Scop MVP:** Digital-only (€15 PDF). Opțiunea fizică amânată pentru v2.

---

## CONTEXT & VIZIUNE

Construiește o aplicație web full-stack pentru brandul **Unu Noaptea** — un brand românesc de podcast. Produsul se numește **"Calendar: Vorbim la UNU NOAPTEA"** — un generator de calendar filozofic personalizat pe 365 de zile.

Produsul permite utilizatorilor să creeze un PDF calendar complet personalizat (similar unui calendar de birou cu foi), personalizat cu numele lor, date importante, preferințe de stil de viață, citate în stilul lor preferat și iconițe pe tip de zi.

**Design language:** minimalist, warm, elegant, premium. Paletă crem/alb/negru. Brandul are deja assets vizuale (backgrounds cu gradient footer, ilustrații vulpițe, iconițe heart). Produsul trebuie să se simtă ca o experiență digitală de lux, nu ca un formular generic.

---

## DECIZII DE PRODUS (v2)

1. **MVP = doar PDF digital €15.** Fără livrare fizică în v1.
2. **MVP = 1 singur template A5** (`template1`) aplicat TUTUROR celor 367 pagini. User-ul NU alege template în MVP.
   - Fișier: `backend/app/assets/backgrounds/template1.png` (furnizat de owner)
   - Arhitectura codului trebuie să fie **template-agnostic** (const `ACTIVE_TEMPLATE = "template1"`, dar cu suport în schema pentru alte template-uri viitoare)
   - În v2: adăugăm Step 0 cu alegere între multiple template-uri
3. **User alege stilul citatelor** (Step 4): Stoici, Moderni, Spirituali, Autori români, Existențialiști. Multi-select (minim 1).
4. **Preview hibrid:** thumbnail mic live în colțul wizard-ului (se actualizează real-time cu template + nume) + preview complet 3-pagini la Step 6.
5. **Email captat la Step 7** (pre-plată). Magic-link pentru download.
6. **GDPR & legal:** Privacy Policy, ToS, cookie consent, endpoint DELETE pentru right-to-erasure.
7. **Payment:** Stripe Checkout (hosted, redirect).
8. **PDF gen:** FastAPI BackgroundTasks (simplu) — nu Celery. Dacă >50 comenzi/zi, migrăm la Celery.

---

## TECH STACK

### Backend
- **Python 3.11+** cu **FastAPI**
- **ReportLab** pentru generare PDF (A5, 367 pagini: copertă + 365 zile + pagină închidere)
- **PostgreSQL** via **SQLAlchemy async** pentru orders + magic-link tokens
- **FastAPI BackgroundTasks** pentru job de generare PDF (simplu, în-process)
- **Stripe** (Checkout) pentru plăți (€15 digital)
- **AWS S3** (sau Cloudflare R2) pentru stocare PDF-uri generate
- **Resend** sau **SendGrid** pentru email tranzacțional
- **Pydantic v2** pentru toată validarea
- **python-dotenv** pentru config
- **structlog** pentru logging JSON
- **Sentry SDK** pentru error tracking
- **slowapi** pentru rate-limiting

### Frontend
- **React 18** cu **Vite**
- **TypeScript strict mode**
- **Tailwind CSS** — mobile-first, complet responsive
- **Framer Motion** pentru tranziții între pași
- **React Hook Form + Zod** pentru validare form
- **@dnd-kit/core** pentru drag-and-drop iconițe (mobile-friendly, nu react-dnd)
- **Axios** pentru API
- **@tanstack/react-query** pentru server state
- **react-datepicker** sau similar pentru date picker custom
- Hosted ca static build (Vercel recomandat)

### Infrastructure
- Docker + Docker Compose pentru dev local
- GitHub Actions: lint + test pe PR, deploy pe merge la `main`
- `.env` based config
- CORS configurat pentru domeniul frontend

---

## FLUX APLICAȚIE (7 PAȘI)

UX = wizard multi-step, un pas per ecran, progress bar sticky sus. Mobile-first. Fiecare pas are buton "Continuă →". User poate merge înapoi. **Progresul e salvat în localStorage** — nu se pierd datele la refresh. Nici o sesiune server-side până la checkout (GDPR-friendly, mai puțin de gestionat).

**Thumbnail live** (sidebar desktop / sticky footer mobile) — card mic proporții A5 care arată: template1 background, numele user-ului, prima dată, prima iconiță. Se actualizează la fiecare change cu debounce 300ms.

> **MVP:** Nu există Step 0 (alegere template). `template = "template1"` e hardcoded. În v2 adăugăm Step 0 cu selecție.

---

### STEP 1 — PERSONALIZARE DE BAZĂ

**UI:** Ecran curat, logo Unu Noaptea sus-centru, headline warm.

**Fields:**
- `first_name` (required, 1-40 chars) — "Cum te numești?" — text input mare, centrat
  - Validation: doar litere (inclusiv diacritice ă,â,î,ș,ț) + spații + cratimă
- `start_date` (required) — "Când vrei să înceapă calendarul tău?" — date picker
  - Chips sugestii: "Ziua mea de naștere", "1 Ianuarie [anul următor]", "Azi", "Altă dată"
  - Constraint: start_date între azi și azi + 18 luni

**Logic:**
- Calendarul acoperă exact 365 de zile de la `start_date`
- `end_date = start_date + 364 days`
- Thumbnail live se actualizează cu numele introdus

---

### STEP 2 — EVENIMENTE IMPORTANTE

**UI:** Title: "Zilele tale speciale". Descriere: "Adaugă zilele importante din viața ta — ziua unui prieten, o aniversare, un moment de celebrat. Pe aceste zile calendarul tău va avea un salut special."

**Fields:**
Listă dinamică. Fiecare eveniment:
- `label` (required, 1-60 chars) — ex: "Ziua fratelui meu", "Aniversare relație"
- `date` (required) — date picker compact (doar lună + zi, se repetă anual)
- `event_type` (required) — select: `birthday | anniversary | celebration | reminder | other`
- Buton delete per rând (iconiță trash)
- Drag handle pentru reordonare (folosim @dnd-kit)

**Buttons:**
- "+ Adaugă eveniment" (max 20)
- "Sari peste acest pas" (link subtil) — acest pas e opțional

**Logic:**
- Pentru fiecare dată specială în range, pagina respectivă primește:
  - Salut special: "Azi e [label]! 🎉"
  - Citat din pool `celebration`
  - Fără iconiță override — rămâne stilul template-ului

---

### STEP 3 — SĂRBĂTORI NAȚIONALE

**UI:** "Ce sărbători vrei să incluzi?" + sub-titlu "Pe aceste zile calendarul tău va avea un salut festiv."

**Display:** Două tab-uri: "Moldova" (default selectat) și "România". Fiecare tab — checklist cu toate sărbătorile. Pre-bifate toate din tab-ul selectat.

**Lista sărbători (hardcoded pentru 2026+, actualizează anual):**

**Moldova:**
- 1 Ian — Anul Nou
- 7-8 Ian — Crăciun (rit vechi)
- 8 Mar — Ziua Internațională a Femeii
- Paștele Ortodox (calculat dinamic via algoritm Meeus Julian)
- Lunea Paștelui
- 1 Mai — Ziua Muncii
- 9 Mai — Ziua Europei
- Rusaliile (50 zile după Paște)
- 1 Iun — Ziua Ocrotirii Copilului
- 27 Aug — Ziua Independenței
- 31 Aug — Limba Noastră
- 25 Dec — Crăciun (rit nou)

**România:**
- 1 Ian — Anul Nou
- 24 Ian — Ziua Unirii Principatelor
- 8 Mar — Ziua Femeii
- Paștele Ortodox + Lunea Paștelui
- 1 Mai — Ziua Muncii
- 1 Iun — Ziua Copilului
- Rusaliile + Lunea Rusaliilor
- 15 Aug — Adormirea Maicii Domnului
- 30 Nov — Sf. Andrei
- 1 Dec — Ziua Națională
- 25-26 Dec — Crăciunul

**Logic:**
- Paștele Ortodox: algoritm Meeus pentru calendar Julian, apoi +13 zile pentru conversie Gregorian
- Sărbătorile selectate sunt taggate în data zilei
- Generator folosește salutări și citate specifice (pool `celebration`)
- **Buton "Sari peste"** — pas opțional

---

### STEP 4 — PROFIL ENERGIE & STIL CITATE

**UI:** Title: "Hai să te cunoaștem mai bine." Sub: "Răspunsurile tale vor personaliza citatele și energia fiecărei zile."

**Întrebări:**

**Q1:** "Care zile ale săptămânii ești cel mai activ/productiv?" — Multi-select (min 1): L/Ma/Mi/J/V/S/D

**Q2:** "Care zile îți oferi pentru odihnă și reîncărcare?" — Multi-select (min 1): L/Ma/Mi/J/V/S/D
- **Validare UI:** opțiunile bifate la Q1 sunt disabled aici (evită overlap)

**Q3:** "Ce zi e potrivită pentru reflecție și introspecție?" — Single select
- **Validare:** nu poate fi în `productive_days` SAU `rest_days` — dacă e, arată warning și cere recitire

**Q4:** "Cum îți începi dimineața?" — Single select:
- Cu energie și acțiune imediată
- Lent, cu o cafea și liniște
- Variabil, depinde de zi
- Nu am o rutină clară

**Q5:** "Care e stilul tău de motivație?" — Single select:
- Îmi place să fiu provocat/ă și împins/ă
- Prefer să fiu încurajat/ă blând
- Combinație între cele două
- Prefer să mă motivez singur/ă

**Q6:** "Ce aspect al vieții tale vrei să lucrezi cel mai mult în acest an?" — Multi-select (max 3):
- Cariera și afacerile
- Sănătatea și energia
- Relațiile cu cei dragi
- Creativitatea și proiectele personale
- Pacea interioară și mindfulness
- Finanțele și independența
- Cunoașterea de sine

**Q7 (NOU):** "Ce stil de citate rezonează cu tine?" — Multi-select (min 1):
- **Stoici** — Seneca, Marc Aureliu, Epictet
- **Moderni** — Steve Jobs, Brené Brown, Maya Angelou, James Clear
- **Spirituali** — Rumi, Lao Tzu, Thich Nhat Hanh
- **Autori români** — Cioran, Eliade, Blaga, Nichita Stănescu, Marin Preda
- **Existențialiști** — Camus, Sartre, Nietzsche, Kierkegaard

Fiecare opțiune are un exemplu mic de citat dedesubt pe hover/tap ca preview al "stilului".

**Logic — `user_profile` object:**
```python
{
  "productive_days": [0, 1, 2, 3, 4],   # Mon-Fri by index
  "rest_days": [5, 6],
  "reflection_day": 6,
  "morning_style": "slow",
  "motivation_style": "gentle",
  "focus_areas": ["career", "health", "creativity"],
  "quote_styles": ["stoic", "romanian_authors"]   # NOU
}
```

Algoritmul de selecție citate trage DOAR din stilurile bifate. Dacă user bifează unul singur (ex: doar "Stoici"), pool-ul e mai mic dar tot suficient pentru 365 zile (vezi `quotes.py`).

---

### STEP 5 — ICONIȚELE TALE

**UI:** Title: "Alege iconițele care te reprezintă." Sub: "Aceste iconițe vor apărea în colțul paginilor calendarului tău."

**IMPORTANT:** Nu folosim emoji-uri în PDF (ReportLab nu le randează). Folosim **SVG line-art icons** (set Lucide sau Phosphor custom). În UI arătăm icon-ul rendat ca SVG React component — identic cu ce apare pe PDF.

**Layout:** Două coloane (stacked pe mobile):
- **Stânga: Pool iconițe disponibile** — grid 6×5, 30 SVG icons organizate pe tematici (muncă/odihnă/reflecție/celebrare/natură/altele)
- **Dreapta: 5 sloturi de categorie**:
  - 🟠 Zile productive / de muncă
  - 🔵 Zile de odihnă
  - 🟣 Zile de reflecție
  - 🟡 Zile speciale / celebrare
  - 🟢 Alte zile (fallback)

**Pool-ul de SVG icons** (minim 30, set custom desenat în stil line-art, 1px stroke):
- **Work:** rocket, target, lightbulb, lightning, flame, trending-up, briefcase, trophy, pen, brain
- **Rest:** moon, cloud, leaf, teacup, book, bath, wave, butterfly, flower, star
- **Reflection:** crystal-ball, spiral, mirror, meditation, thought, candle, galaxy, notebook, key, feather
- **Celebration:** party-popper, cake, champagne, sparkle, confetti, gift, rainbow, heart, balloon, fireworks
- **Nature:** sun, fox, mountain, wheat, compass, bird, tree, flower-field, planet, eye

**Comportament:**
- Desktop: drag din pool → drop în slot (max 2 iconițe per categorie)
- Mobile: tap pe iconiță (highlight) → tap pe slot destinație
- Click pe iconiță deja asignată → o scoate
- **Fiecare categorie trebuie să aibă minim 1 iconiță** (validare la Continuă)
- **Auto-suggest:** buton "Umple automat" — alege 1 iconiță potrivită în fiecare slot bazat pe focus_areas

---

### STEP 6 — PREVIEW & MESAJE PERSONALE

**UI:** Title: "Gata! Iată cum arată calendarul tău."

**Preview:** 3 card-uri A5 proporții, rendate client-side cu exact aceeași logică ca PDF-ul:
1. **Prima zi** (start_date) — cu salut special de început
2. **O zi productivă tipică** (sample din productive_days)
3. **O duminică de odihnă** (sau prima zi rest)

Fiecare card:
- Background-ul template-ului ales
- Număr mare data
- Salut italic
- Citat + autor
- Iconiță footer

Card-urile sunt swipeable pe mobile (carousel).

**Fields editabile:**
- `calendar_name` (required, 3-60 chars) — default: "Calendarul lui/ei [first_name]" — editabil
- `cover_message` (optional, max 500 chars) — "Vrei să adaugi un mesaj personal pe copertă?" — textarea cu counter
- `closing_message` (optional, max 1000 chars) — "Vrei un mesaj pentru ultima pagină a calendarului?" — textarea cu counter

**Re-roll preview:** buton mic "🎲 Alt sample" care regenerează cele 3 pagini cu alte citate (folosind alt seed). User vede variația.

**CTA:** "Generează Calendarul Meu →"

---

### STEP 7 — EMAIL, CONSIMȚĂMÂNT & PLATĂ

**UI:** Title: "Un ultim pas înainte de magie."

**Fields:**
- `email` (required, validat) — "La ce email îți trimitem calendarul?" — input mare, cu hint "Verifică atent — aici primești PDF-ul."
- `gdpr_consent` (required checkbox) — "Sunt de acord cu [Termenii] și [Politica de confidențialitate]" — link-urile deschid în modal
- `marketing_consent` (optional checkbox) — "Vreau să primesc ocazional noutăți și oferte de la Unu Noaptea" — pre-unbifat (opt-in explicit)
- `withdrawal_waiver` (required checkbox) — "Înțeleg că îmi primesc calendarul imediat după plată și **renunț la dreptul de retragere** pentru produs digital." — legal cerință EU

**Summary card** (sticky pe mobile):
- "Calendar digital PDF — €15"
- "Livrare: instant, în email"

**CTA:** "Plătește €15 și generează →" — redirect la Stripe Checkout

**Post-Stripe success:** redirect la `/orders/{order_id}/status` (pagină de status cu polling)

---

### PAGINA ORDER STATUS

Ruta: `/orders/{order_id}/status`

**UI:** 
- Dacă status = "generating": spinner + text "Calendarul tău se pregătește... (estimare: 30-45 secunde). Poți închide pagina — îți trimitem email când e gata."
- Dacă status = "ready": CTA mare "Descarcă calendarul →" + "L-am trimis și pe email la [email]."
- Dacă status = "failed": "Ceva n-a mers bine. Te-am contactat pe email — răspundem-ți." + link support

**Polling:** GET `/api/v1/orders/{id}/status` la 3 secunde, max 2 minute, apoi stop și afișare fallback "Îți trimitem email când e gata."

---

## BACKEND — ARHITECTURĂ

### API Endpoints (FastAPI)

```
POST /api/v1/orders/create
  → Body: {calendar_config: CalendarConfig, email: str, gdpr_consent: bool, 
           marketing_consent: bool, withdrawal_waiver: bool}
  → Creează Order cu status="pending_payment"
  → Creează Stripe Checkout Session cu metadata {order_id}
  → Returns: {checkout_url: str, order_id: str}

POST /api/v1/webhooks/stripe
  → Verifică signature
  → Idempotency: tabel ProcessedStripeEvent cu PK event.id
  → Pe checkout.session.completed:
    → Marchează Order status="generating"
    → Trigger background task generate_calendar(order_id)
  → Pe payment failed: Order status="failed"

GET /api/v1/orders/{order_id}/status
  → Rate-limit: 20/min per IP
  → Returns: {status, download_url?}

GET /api/v1/orders/{order_id}/download?token={jwt}
  → Validează JWT (conține order_id + email, expiră 90 zile)
  → Redirect la S3 presigned URL (valid 24h)
  → Log download pentru analytics

POST /api/v1/gdpr/delete-my-data
  → Body: {email, order_id}
  → Trimite email cu magic link de confirmare
  
GET /api/v1/gdpr/delete-my-data/confirm?token=
  → Șterge Order + PDF din S3 + email din marketing list
  → Returnează confirmare

GET /api/v1/legal/privacy-policy    → HTML/Markdown static
GET /api/v1/legal/terms             → HTML/Markdown static
GET /api/v1/legal/cookies           → HTML/Markdown static

GET /api/v1/health  → {status: "ok"}
```

**NOTĂ:** Nu există endpoint `/session` — toată state-ul wizard-ului e în localStorage până la checkout.

### Modele (SQLAlchemy async)

```python
class Order(Base):
    id: UUID (PK)
    email: str (indexed)
    first_name: str
    status: enum("pending_payment", "generating", "ready", "failed", "deleted")
    stripe_session_id: str (unique)
    stripe_payment_intent_id: str | None
    amount_eur: float
    currency: str = "EUR"
    calendar_config: JSONB                # full CalendarConfig
    pdf_s3_key: str | None
    marketing_consent: bool
    ip_hash: str                          # for fraud detection (SHA256)
    created_at, updated_at, paid_at, generated_at, deleted_at: timestamps

class ProcessedStripeEvent(Base):
    event_id: str (PK)                    # idempotency
    processed_at: timestamp

class AdminUser(Base):                    # single admin for now
    id: UUID
    email: str (unique)
    password_hash: str
    created_at: timestamp
```

### Schema Pydantic

```python
class SpecialEvent(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    event_type: Literal["birthday", "anniversary", "celebration", "reminder", "other"]

class UserProfile(BaseModel):
    productive_days: list[int] = Field(min_length=1, max_length=7)
    rest_days: list[int] = Field(min_length=1, max_length=7)
    reflection_day: int = Field(ge=0, le=6)
    morning_style: Literal["energetic", "slow", "variable", "no_routine"]
    motivation_style: Literal["challenging", "gentle", "mixed", "self"]
    focus_areas: list[str] = Field(min_length=1, max_length=3)
    quote_styles: list[Literal["stoic", "modern", "spiritual", 
                               "romanian_authors", "existentialist"]] = Field(min_length=1)
    
    @validator("rest_days")
    def no_overlap(cls, v, values):
        if set(v) & set(values.get("productive_days", [])):
            raise ValueError("rest_days și productive_days nu se pot suprapune")
        return v

class IconMapping(BaseModel):
    productive: list[str] = Field(min_length=1, max_length=2)  # SVG icon IDs
    rest: list[str] = Field(min_length=1, max_length=2)
    reflection: list[str] = Field(min_length=1, max_length=2)
    celebration: list[str] = Field(min_length=1, max_length=2)
    other: list[str] = Field(min_length=1, max_length=2)

class CalendarConfig(BaseModel):
    template: str = "template1"   # MVP: hardcoded; v2: Literal["template1", "template2", ...]
    first_name: str = Field(min_length=1, max_length=40)
    start_date: date
    special_events: list[SpecialEvent] = Field(max_length=20)
    selected_holidays: list[str]                # holiday ID-uri
    user_profile: UserProfile
    icon_mapping: IconMapping
    cover_message: str | None = Field(None, max_length=500)
    closing_message: str | None = Field(None, max_length=1000)
    calendar_name: str = Field(min_length=3, max_length=60)
    
    @validator("start_date")
    def start_date_in_range(cls, v):
        today = date.today()
        if v < today or v > today + timedelta(days=540):
            raise ValueError("start_date trebuie între azi și azi+18 luni")
        return v
```

---

## PDF GENERATION ENGINE

### Fișier: `app/services/pdf_generator.py`

**Page size:** A5 — folosește `reportlab.lib.pagesizes.A5` (419.53 × 595.28 pt, să nu facem math greșit).

**Fonts (bundlate în `app/assets/fonts/`):**
- **EB Garamond** (Regular, Bold, Italic) — serif pentru citate, nume, feeling premium
- **Inter** (Regular, Medium, Bold) — sans-serif pentru date, labels, salut
- Ambele free OFL, diacritice românești OK
- Înregistrare: `pdfmetrics.registerFont(TTFont('EBGaramond', 'path.ttf'))`

**Template (MVP: 1 fișier în `app/assets/backgrounds/`):**
- `template1.png` (A5, 300dpi = 1240×1748 px) — furnizat de owner
- Cod arhitectat template-agnostic: `BACKGROUNDS = {"template1": ImageReader("template1.png")}` — ușor de extins la v2

Pre-încărcate ca `ImageReader` o singură dată înainte de loop.

**Iconițe (SVG convertite la PDF via svglib):**
- Folder `app/assets/icons/` cu toate cele 30 SVG-uri
- La generare, le convertim on-the-fly cu `svglib.svglib.svg2rlg()` apoi desenăm ca `Drawing`
- Cache în memorie pe durata job-ului

**Layout constants:**
```python
from reportlab.lib.pagesizes import A5
W, H = A5
GLUE_MARGIN = 70           # top, pentru legare
BOTTOM_MARGIN = 50
ICON_SIZE = 36             # pt
ICON_FOOTER_Y = 80
DATE_NUMBER_SIZE = 96      # pt, foarte mare
```

**Render page:**
```python
def render_page(c: Canvas, config: CalendarConfig, ctx: DayContext):
    c.drawImage(backgrounds[config.template], 0, 0, W, H)
    
    # Top: weekday name + month/year
    c.setFont("Inter-Medium", 11)
    c.drawString(left_margin, H - GLUE_MARGIN, ctx.weekday_name_ro.upper())
    c.drawRightString(W - right_margin, H - GLUE_MARGIN, ctx.month_year_ro)
    
    # Center: data number
    c.setFont("EBGaramond-Bold", DATE_NUMBER_SIZE)
    c.drawCentredString(W/2, H*0.6, str(ctx.day_number))
    
    # Separator
    c.line(W*0.35, H*0.52, W*0.65, H*0.52)
    
    # Salutation
    c.setFont("EBGaramond-Italic", 14)
    wrap_and_draw(c, ctx.salutation, W/2, H*0.44, max_width=W*0.8)
    
    # Quote (center)
    c.setFont("EBGaramond-Regular", 13)
    wrap_and_draw_multiline(c, ctx.quote_text, W/2, H*0.3, max_width=W*0.78)
    
    # Separator mic
    c.line(W*0.45, H*0.18, W*0.55, H*0.18)
    
    # Author
    c.setFont("Inter-Regular", 10)
    c.drawCentredString(W/2, H*0.15, f"— {ctx.quote_author}")
    
    # Footer icon
    icon_drawing = get_icon_drawing(ctx.icon_id, ICON_SIZE)
    renderPDF.draw(icon_drawing, c, W/2 - ICON_SIZE/2, ICON_FOOTER_Y)
```

**Day classification (ordine corectată):**
```python
def classify_day(d: date, config) -> DayType:
    if is_first_day(d, config): return DayType.FIRST
    if is_last_day(d, config): return DayType.LAST
    if is_special_event(d, config.special_events): return DayType.CELEBRATION
    if is_holiday(d, config.selected_holidays): return DayType.HOLIDAY
    weekday = d.weekday()
    if weekday == config.user_profile.reflection_day: return DayType.REFLECTION
    if weekday in config.user_profile.rest_days: return DayType.REST
    if weekday in config.user_profile.productive_days: return DayType.PRODUCTIVE
    return DayType.GENERAL
```

**DayType → (quote_pool, icon_category) mapping:**
```python
DAY_TYPE_TO_POOL = {
    FIRST: "celebration",
    LAST: "celebration",
    CELEBRATION: "celebration",
    HOLIDAY: "celebration",
    REFLECTION: "reflection",
    REST: "rest",
    PRODUCTIVE: "productive",
    GENERAL: "general",
}
DAY_TYPE_TO_ICON_CAT = {
    FIRST: "celebration", LAST: "celebration", CELEBRATION: "celebration",
    HOLIDAY: "celebration", REFLECTION: "reflection", REST: "rest",
    PRODUCTIVE: "productive", GENERAL: "other",
}
```

**Quote selection (REPRODUCIBIL):**
```python
import hashlib, random

def get_seed(config) -> int:
    raw = f"{config.first_name}|{config.start_date.isoformat()}|{'+'.join(sorted(config.user_profile.quote_styles))}"
    return int(hashlib.sha256(raw.encode()).hexdigest()[:16], 16)

def build_quote_sequence(config, all_quotes):
    seed = get_seed(config)
    rng = random.Random(seed)
    
    # Filtrează pe stilurile selectate
    styles = set(config.user_profile.quote_styles)
    
    pools = {}
    for pool_name in ["productive", "rest", "reflection", "celebration", "general"]:
        filtered = [q for q in all_quotes[pool_name] if q["style"] in styles]
        rng.shuffle(filtered)
        pools[pool_name] = cycle_without_recent(filtered)  # nu repeta în fereastra 14 zile
    return pools
```

**Salutări (pool dedicate, nu ChatGPT):**
```python
# salutations.py
FIRST_DAY = ["La mulți ani, {name}!", "Începe drumul, {name}!", "O nouă călătorie, {name}!"]
LAST_DAY  = ["Ai reușit, {name}!", "Un an întreg dus la capăt, {name}!", ...]
REST      = ["Respiră adânc, {name}.", "Odihnă liniștită, {name}.", ...]
PRODUCTIVE = ["Hai la treabă, {name}!", "Azi e al tău, {name}.", ...]
REFLECTION = ["Oprește-te o clipă, {name}.", "Ascultă-te, {name}.", ...]
CELEBRATION = ["Bucură-te, {name}!", "Azi merită sărbătorit, {name}!", ...]
HOLIDAY_<slug> = specific per sărbătoare (ex: "Crăciun fericit, {name}!")
GENERAL = [...]  # fallback neutre
```

Minim 20 salutări per categorie, selectate seedat.

**Cover page:**
- Background alb simplu (sau gradient subtle dacă template = cream)
- Logo Unu Noaptea (SVG → PDF) — sus-centru
- `calendar_name` — serif mare, centru
- Sub: interval date (ex: "15 mai 2026 — 14 mai 2027")
- Dacă `cover_message`: în tipo mai mică, pe 2-4 linii
- Nume user în dreapta-jos mic ("pentru {first_name}")

**Closing page:**
- Background full template
- Mesaj default: "Aici se încheie călătoria de 365 de zile. Sperăm că a fost plină de momente de reflecție, odihnă și curaj."
- Dacă `closing_message`: insert după default, separator
- Promo code: "Pentru calendarul de anul viitor, cod: {env.PROMO_CODE_NEXT_YEAR}"
- Signature Unu Noaptea

**Performance:**
- Target: <30s pentru 367 pagini
- Pre-load: backgrounds, fonts, icon cache
- Compute toate `DayContext` înainte de render loop
- Upload S3 după `save()` în stream, nu save la disk
- Log timing per fază pentru optimizare

---

## QUOTES DATABASE

### Fișier: `app/data/quotes.py`

Structura fiecărui citat:
```python
{
    "text": "...",
    "author": "Seneca",
    "style": "stoic",        # unul din: stoic|modern|spiritual|romanian_authors|existentialist
    "pools": ["productive", "general"],  # pool-uri compatibile
    "source": "Scrisori către Lucilius",  # optional
}
```

### Volume MINIM (pentru a garanta 365 zile unice chiar și cu un singur stil selectat):

| Stil | Total citate | Productive | Rest | Reflection | Celebration | General |
|---|---|---|---|---|---|---|
| Stoic | 200 | 80 | 30 | 60 | 10 | 20 |
| Modern | 200 | 100 | 30 | 30 | 20 | 20 |
| Spiritual | 180 | 30 | 70 | 60 | 10 | 10 |
| Romanian_authors | 180 | 40 | 50 | 60 | 10 | 20 |
| Existentialist | 150 | 40 | 20 | 70 | 5 | 15 |
| **TOTAL** | **910** | **290** | **200** | **280** | **55** | **85** |

**Matematică de acoperire:**
Worst case: user bifează DOAR "existentialist" (cel mai mic pool) + are ~200 zile productive → are 40 citate productive existențialiste → repetate de 5x. Nu e ideal.

**Soluție:** Dacă pool-ul filtrat e <365, la epuizare reîncepem shuffle-ul cu seed alternativ — user tot are variație. Adaugăm notă la Step 4: "Sfat: bifează minim 2 stiluri pentru varietate maximă."

### Autori per stil (listă minimă, extindeți):

**Stoic:** Seneca, Marc Aureliu, Epictet, Cato cel Bătrân, Musonius Rufus, Ryan Holiday (modern stoic)

**Modern:** Steve Jobs, Brené Brown, Maya Angelou, James Clear, Tim Ferriss, Simon Sinek, Seth Godin, Naval Ravikant, Derek Sivers, Cal Newport, Anne Lamott, Elizabeth Gilbert

**Spiritual:** Rumi, Lao Tzu, Thich Nhat Hanh, Confucius, Buddha, Pema Chödrön, Eckhart Tolle, Ram Dass, Jiddu Krishnamurti, Alan Watts

**Romanian_authors:** Emil Cioran, Mircea Eliade, Lucian Blaga, Nichita Stănescu, Marin Preda, Mircea Cărtărescu, Gabriel Liiceanu, Andrei Pleșu, Tudor Arghezi, Octavian Paler, Nicolae Steinhardt, Ana Blandiana

**Existentialist:** Albert Camus, Jean-Paul Sartre, Friedrich Nietzsche, Søren Kierkegaard, Simone de Beauvoir, Viktor Frankl, Fyodor Dostoievski, Franz Kafka, Martin Heidegger, Hannah Arendt

**Validare calitate:**
- Claude Code să NU inventeze citate false atribuite real oamenilor
- Doar citate real verificabile; pentru Romanian_authors pot fi parafrazări clar marcate `[parafrazare]`
- NICIODATĂ "ni ha ha" sau alte glume interne

---

## FRONTEND — ARHITECTURĂ

### Structură:
```
src/
  components/
    wizard/
      Step1_BasicInfo.tsx
      Step2_SpecialEvents.tsx
      Step3_Holidays.tsx
      Step4_EnergyProfile.tsx
      Step5_Icons.tsx
      Step6_Preview.tsx
      Step7_Payment.tsx
      WizardShell.tsx          # progress bar + nav + thumbnail
      LivePreviewThumbnail.tsx  # mini preview sticky
    preview/
      CalendarPageCard.tsx      # render A5 page (identic cu PDF)
      TemplateBackground.tsx
      IconRenderer.tsx          # SVG inline pe baza icon ID
    ui/
      ProgressBar.tsx
      DatePickerCustom.tsx
      ChipSelector.tsx
      CheckboxList.tsx
      LegalModal.tsx
    layout/
      Header.tsx
      Footer.tsx
  hooks/
    useWizardState.ts           # localStorage sync, Zustand store
    useOrderStatus.ts           # polling
  services/
    api.ts
    stripe.ts
    previewRenderer.ts          # logic de generare preview client-side
  lib/
    dayClassifier.ts            # mirror al Python-ului
    salutations.ts              # copii de salutări pentru preview
    quotesSample.ts             # ~50 citate mostră pentru preview (nu toate)
    iconRegistry.tsx            # { id: SVGComponent }
  types/
    calendar.types.ts           # sync cu Pydantic
  pages/
    Home.tsx
    Wizard.tsx
    OrderStatus.tsx
    Download.tsx
    Privacy.tsx, Terms.tsx, Cookies.tsx, DeleteMyData.tsx
```

### State management (Zustand + localStorage):
```typescript
interface WizardState {
  currentStep: number;          // 0-7
  data: Partial<CalendarConfig> & { email?: string };
  consents: { gdpr?: bool, marketing?: bool, withdrawal?: bool };
  
  setField: <K extends keyof CalendarConfig>(k: K, v: CalendarConfig[K]) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  validate: (step: number) => string[];  // error messages ro
}
```

Auto-save la fiecare schimbare cu debounce 500ms → localStorage cheie `unu-noaptea-wizard-v1`.

### Preview client-side:
- Componenta `CalendarPageCard` folosește CSS pentru a mima EXACT layout-ul PDF-ului
- Background: `<img>` cu template selectat
- Font-face: EB Garamond + Inter via @font-face din `/public/fonts/`
- Layout: poziționare absolută, unități % pentru a scala la orice container
- Quote selection client-side: `previewRenderer.selectSampleQuote(dayType, styles, seed)` — folosește `quotesSample.ts` (subset de ~50 per pool)

### Micro-UX details:
- Tranziții între pași: slide-in/out 200ms (Framer Motion)
- Loading states: skeleton loaders niciodată spinnere goale
- Error messages: în română, warm (nu "Error 400" ci "Hopa, am nevoie de un email valid")
- Validation: real-time pe blur, nu doar la submit
- Keyboard: Enter = next (când form valid), Escape = back
- Focus management: primul input din pas focus automat
- Accessibility: aria-labels, focus visible, screen reader compatible
- Thumbnail live: apare după Step 1, dispare la Step 7
- Back button: păstrează datele (nu reset)
- "Salvare automată" indicator discret sus

---

## LANDING PAGE

Ruta: `/`

### Secțiuni:

**1. Hero**
- H1: "Calendarul tău de 365 de zile."
- Sub: "Personalizat cu numele tău, citatele tale preferate, și zilele care contează pentru tine."
- CTA primar: "Creează calendarul tău →" (ancoră la wizard)
- Visual: mockup animat A5 care răsfoiește pagini (CSS animation)

**2. Cum funcționează**
4 pași cu iconițe:
1. Alegi un template
2. Răspunzi la câteva întrebări
3. Vezi preview-ul
4. Primești PDF-ul pe email

**3. Ce primești**
- 367 pagini PDF (copertă + 365 zile + închidere)
- Format A5, pregătit pentru print acasă
- Citate din stilul tău preferat
- Salut personal zilnic
- Sărbători naționale marcate
- Zilele tale speciale incluse

**4. Preview carousel**
3-4 mockup-uri paginii reale (imagini statice)

**5. Preț**
- Un singur plan: **€15 — PDF digital livrat în email**
- Sub: "Livrare fizică (carte tipărită) va fi disponibilă în curând."

**6. FAQ** (6 întrebări, collapsible):
- Pot comanda calendar pentru altcineva ca cadou?
- Ce limbi e disponibil? (Doar română momentan)
- Pot modifica după plată? (Nu, dar suport contact)
- Pot printa acasă? (Da, PDF e pregătit A5)
- Cum am rambursare? (Produs digital, fără rambursare după download conform legii EU, dar contact support dacă apare problemă)
- Cum îmi șterg datele? (Link la `/delete-my-data`)

**7. Brand story** (scurt, warm)
Paragraf despre Unu Noaptea ca brand & viziunea podcast-ului. Nu copywriting generic.

**8. Footer**
Logo + social + email contact + linkuri legal (Privacy, Terms, Cookies, Delete My Data)

**Design:**
- Fundal crem off-white (#FAFAF8)
- Tipografie neagră
- EB Garamond pentru H1/H2, Inter pentru body
- Mobil: single column, spacing generos
- **Lighthouse Mobile target: Performance >85, Accessibility >90, SEO >90**

---

## LEGAL & GDPR

### Pagini obligatorii:

**Privacy Policy (`/privacy`):**
- Date colectate: nume, email, dată naștere (opțional), zile speciale, IP (hash), date de plată (via Stripe)
- Legal basis: execuția contractului (GDPR Art 6.1.b) + consent (marketing)
- Retention: 3 ani de la generare PDF (pentru suport), apoi ștergere automată
- Share: Stripe (plată), S3 (stocare), SendGrid (email) — cu DPA semnat
- Rights: access, rectify, erasure, portability — link la `/delete-my-data`
- DPO contact: email dedicat

**Terms of Service (`/terms`):**
- Produs: calendar digital PDF
- Preț: €15 + TVA conform reglementare EU pentru digital goods
- Livrare: instant post-plată
- Refund: conform Art 16(m) Directive 2011/83/EU — user renunță la retragere prin checkbox explicit
- IP: template-uri + citate = proprietate Unu Noaptea; user deține personalizarea
- Jurisdicție: legea română / moldovenească

**Cookie Policy (`/cookies`):**
- Strict necesare: session, CSRF (consent nu e necesar)
- Analytics: Plausible sau Umami (GDPR-friendly, fără cookies personale) — recomandat vs GA4
- Stripe: cookies tranzacționale

**Cookie banner:**
- Apare doar dacă se folosesc cookies non-esențiale
- Dacă mergem Plausible/Umami, nu e nevoie de banner

**Delete My Data (`/delete-my-data`):**
- Form: email + order_id (optional)
- Trimite magic link de confirmare
- La confirm: soft-delete order (status="deleted"), șterge PDF din S3, scoate din marketing list, păstrează minimal log de audit (hash email + timp)

---

## ENV VARIABLES

```env
# App
APP_ENV=development
APP_SECRET_KEY=<random-64-chars>
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/unu_noaptea

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DIGITAL_PRICE_ID=price_...   # €15 price object

# S3 (AWS sau Cloudflare R2)
S3_ENDPOINT_URL=            # gol pentru AWS, custom pentru R2
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=unu-noaptea-calendars
S3_REGION=eu-central-1

# Email (Resend sau SendGrid)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=calendare@ununoaptea.com
EMAIL_FROM_NAME="Unu Noaptea"

# Admin (pentru dashboard)
ADMIN_EMAIL=andrei.s3cu@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt>

# Observability
SENTRY_DSN=
LOG_LEVEL=INFO

# Business
PROMO_CODE_NEXT_YEAR=VU1P3
JWT_DOWNLOAD_TOKEN_EXPIRE_DAYS=90
PDF_S3_PRESIGNED_URL_EXPIRE_HOURS=24

# Rate limiting
RATE_LIMIT_CREATE_ORDER=5/minute
RATE_LIMIT_ORDER_STATUS=20/minute
```

---

## DOCKER COMPOSE

```yaml
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    env_file: .env
    volumes:
      - ./backend/app/assets:/app/app/assets:ro

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://localhost:8000

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: unu_noaptea
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - db_data:/var/lib/postgresql/data

  stripe-listener:                      # for webhook testing local
    image: stripe/stripe-cli:latest
    command: listen --forward-to api:8000/api/v1/webhooks/stripe
    env_file: .env.stripe

volumes:
  db_data:
```

**Notă:** Fără Redis, fără Celery — MVP digital-only cu BackgroundTasks e suficient.

---

## ADMIN DASHBOARD (minimal)

Ruta: `/admin` (Basic Auth sau simple login)

**Funcții:**
- Listă comenzi (paginat, filtru status, search email)
- Detalii comandă: config, status, timeline, download PDF
- Re-trimite email cu link download
- Re-generează PDF (pe cerere)
- Trigger manual șterge date (GDPR)
- Export CSV comenzi (pentru contabilitate)
- Metrics dashboard simplu: # comenzi/zi, revenue, failure rate

Construim cu componente basic Tailwind — fără framework admin complex.

---

## EMAIL TEMPLATES

**Subiecte & body, HTML + plain-text fallback:**

**1. Order confirmation** (imediat post-plată)
- Subject: "Calendarul tău Unu Noaptea e în lucru! 🦊"
- Body: confirmare + estimate 1-2 minute + link status page

**2. Calendar ready** (post-generation)
- Subject: "Calendarul tău e gata, {first_name} ✨"
- Body: preview thumbnail + CTA download + note "Link-ul expiră în 90 zile"

**3. Generation failed** (la eroare)
- Subject: "Ceva n-a mers bine cu calendarul tău"
- Body: scuze + "Te contactăm în maxim 24h" + support email

**4. GDPR deletion confirmation**
- Subject: "Confirmă ștergerea datelor tale"
- Body: link magic + ce se șterge

Design email: simplu, brand-consistent, inline CSS, testat pe Gmail/Outlook/Apple Mail.

---

## CODE QUALITY

- **Python:** type hints pe tot, no `Any` fără justificare, pydantic v2, ruff + mypy strict
- **TS:** strict mode, no `any`, ESLint + Prettier
- **API responses:** mereu response_model Pydantic, never raw dict
- **Errors:** HTTP status corect, mesaje user-facing în română cu tone warm
- **Logging:** structlog JSON, `order_id` propagat
- **DB:** async peste tot, alembic migrations, indexuri pe email/status/created_at
- **Secrets:** env-only, niciodată hard-coded
- **Testing:**
  - `pytest` backend: unit PDF, integration webhook (stripe-mock)
  - `vitest` frontend: utils + hooks
  - `playwright` e2e: flow complet landing → plată test → download
  - Coverage target: >70%
- **CI:** GitHub Actions — lint + test + build pe PR; deploy la merge main
- **Security:**
  - CSRF pentru form-uri
  - CORS strict pe FRONTEND_URL
  - Rate limit pe endpoints publice
  - Input sanitization (ex: first_name nu accept HTML)
  - S3 presigned URL, nu public
  - JWT HS256 cu SECRET_KEY rotabil

---

## DELIVERABLES CLAUDE CODE

**Backend:**
- FastAPI app completă cu toate endpoint-urile
- SQLAlchemy models + Alembic migrations
- PDF generator (ReportLab)
- Stripe webhook handler cu idempotency
- Email service (Resend)
- S3 service cu presigned URLs
- Admin dashboard minimal
- Tests pytest (unit + integration)

**Frontend:**
- React app complet cu toți 7 pași
- Preview live (thumbnail + full)
- Landing page
- Pagini legal (Privacy, Terms, Cookies, DeleteMyData)
- Order status & download pages
- Tests vitest + Playwright e2e

**Assets necesare (tu le pregătești, Claude Code le referenciază):**
- `backend/app/assets/backgrounds/template1.png` (MVP — 1 singur template)
- `backend/app/assets/fonts/EBGaramond-Regular.ttf` (+ Bold, Italic)
- `backend/app/assets/fonts/Inter-Regular.ttf` (+ Medium, Bold)
- `backend/app/assets/icons/*.svg` (30 icons, set unitar)
- `backend/app/assets/brand/logo.svg`
- `frontend/public/preview/*.png` (mockup-uri pentru landing)

**Code content (Claude Code generează):**
- `backend/app/data/quotes.py` — min 910 citate structurate, multe real-atribuite
- `backend/app/data/salutations.py` — 20+ per categorie × 8 categorii
- `backend/app/data/holidays.py` — hardcoded MD + RO cu calcul Paște Ortodox

**Setup:**
- Docker Compose funcțional local
- GitHub Actions workflows
- README.md cu pași setup + env vars docs
- `.env.example` complet

---

## BRAND & TONE

- Nume brand: **Unu Noaptea** — nu schimba capitalizare, nu traduce
- Produs: **Calendar: Vorbim la UNU NOAPTEA**
- Limbă UI: română pe tot (labels, butoane, erori, emails)
- Tone: warm, încurajator, premium — nu corporate, nu cringe, nu forced
- Vulpea = mascota brandului (apare în backgrounds, nu ca emoji)
- "ni ha ha" = glumă internă — NU apare în produs
- Copertă calendar: logo + calendar_name

---

## SUCCESS CRITERIA

- Wizard complet sub 10 min pe mobile
- PDF generat sub 45s (p95)
- Stripe test flow end-to-end funcțional
- PDF: 367 pagini A5, citate unice minim în fereastră 14 zile, clasificare corectă
- Email livrat sub 2 minute post-plată
- Funcționează pe: iOS Safari 16+, Android Chrome, desktop Chrome/Firefox/Safari curente
- Lighthouse Mobile: Perf >85, A11y >90, SEO >90
- Coverage teste: >70%
- Zero citate inventate fals atribuite

---

## ORDINE DE BUILD RECOMANDATĂ

1. Setup repo + Docker Compose + CI
2. Backend core: models + migrations + endpoint create/status
3. PDF generator (cel mai riscant — validează early)
4. `quotes.py` + `salutations.py` (content heavy)
5. Stripe integration + webhook
6. Email service
7. Frontend shell + state management + Step 1
8. Step 2-5 + preview thumbnail
9. Step 6-7 + Stripe checkout redirect
10. Order status + download pages
11. Landing page
12. Pagini legal + GDPR delete flow
13. Admin dashboard
14. Tests e2e + CI polish
15. Deploy staging → prod

---

*End of prompt v2. Build the complete product. Respect the architecture. Nu simplifica și nu sări peste GDPR / testing / idempotency.*

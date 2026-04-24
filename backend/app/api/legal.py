"""Serves the static legal pages as Markdown-over-JSON.

Actual pretty rendering happens in the frontend. The backend just owns the
canonical source of truth.
"""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

PRIVACY_MD = """# Politica de Confidențialitate

**Ultima actualizare:** 22 aprilie 2026

## 1. Cine suntem
Unu Noaptea, înregistrat în Republica Moldova/România, operează calendarul digital
"Vorbim la UNU NOAPTEA". Operator de date: Unu Noaptea.

## 2. Ce date colectăm
- **Date de identificare:** nume (prenume), email
- **Conținut personalizat:** zile speciale, preferințe de stil, mesaje cover/closing
- **Date tehnice:** hash SHA256 al IP-ului (pentru detecția fraudelor)
- **Date de plată:** procesate direct de Stripe — noi nu stocăm date de card

## 3. Baza legală (GDPR Art. 6)
- Art. 6(1)(b) — executarea contractului (livrarea PDF-ului)
- Art. 6(1)(a) — consimțământ explicit (marketing, cookies non-esențiale)

## 4. Perioada de retenție
- Date comandă: 3 ani de la generare (pentru suport + obligații contabile)
- PDF generat: stocat cât timp comanda nu e ștearsă
- La cererea ta prin `/delete-my-data`: ștergere în maxim 7 zile

## 5. Cui partajăm datele
- **Stripe** — procesare plăți (EU Data Processing Addendum semnat)
- **AWS / Cloudflare R2** — stocare PDF (EU regiune)
- **Resend** — trimitere email

## 6. Drepturile tale
- Acces, rectificare, ștergere, portabilitate, obiecție
- Contact: calendare@ununoaptea.com sau `/delete-my-data`

## 7. Contact DPO
calendare@ununoaptea.com
"""

TERMS_MD = """# Termeni și Condiții

**Ultima actualizare:** 22 aprilie 2026

## 1. Produs
"Calendar: Vorbim la UNU NOAPTEA" — calendar digital personalizat PDF, 367 pagini A5.

## 2. Preț
€15 + TVA (conform reglementărilor EU pentru bunuri digitale, aplicat automat în funcție de țara ta).

## 3. Livrare
Instant după plată. În maxim 5 minute primești email cu link de descărcare (valid 90 de zile).

## 4. Dreptul de retragere
Conform Art. 16(m) din Directiva 2011/83/EU, **renunți explicit** la dreptul de retragere
la checkout prin bifarea casetei "Înțeleg că îmi primesc calendarul imediat după plată..."

## 5. Proprietate intelectuală
- Template-uri, citate, cod: proprietate Unu Noaptea.
- Personalizarea ta (nume, mesaje) îți aparține.

## 6. Utilizare
Produsul e pentru uz personal. Nu-l redistribui comercial.

## 7. Limitare de răspundere
Livrăm PDF-ul. Nu suntem responsabili pentru cum îl printezi sau distribui.

## 8. Jurisdicție
Litigii: legea română/moldovenească, competența instanțelor din Chișinău / București.

## 9. Contact
calendare@ununoaptea.com
"""

COOKIES_MD = """# Politica de Cookies

**Ultima actualizare:** 22 aprilie 2026

## Ce folosim
- **Strict necesare:** sesiune, CSRF — fără opt-in, obligatorii tehnic.
- **Analytics:** Plausible (fără cookies personale, fără fingerprinting, GDPR-friendly).
  Nu există tracking cross-site și nu avem nevoie de banner de consent pentru analytics.
- **Stripe:** cookies tranzacționale pe pagina de checkout (externă).

## Cum refuzi
Browserul tău permite blocarea tuturor cookies. Dacă blochezi cele strict necesare,
wizard-ul nu va funcționa (localStorage e folosit pentru a salva progresul).

## Contact
calendare@ununoaptea.com
"""


@router.get("/privacy", response_class=PlainTextResponse)
async def privacy() -> str:
    return PRIVACY_MD


@router.get("/terms", response_class=PlainTextResponse)
async def terms() -> str:
    return TERMS_MD


@router.get("/cookies", response_class=PlainTextResponse)
async def cookies() -> str:
    return COOKIES_MD

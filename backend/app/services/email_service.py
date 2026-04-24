"""Email sender — Resend / SendGrid / Console (dev)."""

from __future__ import annotations

import asyncio

import httpx

from app.core.config import settings
from app.core.logging import log

# --- Templates ---

def _order_confirmation_html(first_name: str, status_url: str) -> str:
    return f"""<html><body style="font-family: -apple-system, Arial, sans-serif; color:#1a1a1a; padding:24px;">
<p>Salut, {first_name}!</p>
<p>Mulțumim pentru comandă. <strong>Calendarul tău Unu Noaptea se pregătește.</strong>
Îți trimitem PDF-ul pe email imediat ce e gata (estimare: 1–2 minute).</p>
<p>Între timp poți urmări statusul aici:<br>
<a href="{status_url}">{status_url}</a></p>
<p style="color:#6b6b6b; font-size:13px; margin-top:32px;">
Unu Noaptea — ne auzim la unu noaptea.
</p></body></html>"""


def _calendar_ready_html(first_name: str, download_url: str) -> str:
    return f"""<html><body style="font-family: -apple-system, Arial, sans-serif; color:#1a1a1a; padding:24px;">
<p>{first_name}, calendarul tău e gata. ✨</p>
<p><a href="{download_url}" style="background:#1a1a1a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Descarcă PDF-ul</a></p>
<p style="color:#6b6b6b;font-size:13px;">Link-ul e valabil 90 de zile. Salvează fișierul local.</p>
<p style="color:#6b6b6b;font-size:13px;margin-top:32px;">Unu Noaptea</p>
</body></html>"""


def _gdpr_delete_confirm_html(confirm_url: str) -> str:
    return f"""<html><body style="font-family:-apple-system,Arial,sans-serif;color:#1a1a1a;padding:24px;">
<p>Ai cerut ștergerea datelor tale.</p>
<p>Apasă butonul pentru a confirma ștergerea definitivă (comenzi + PDF + unsubscribe marketing):</p>
<p><a href="{confirm_url}" style="background:#c0392b;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Confirmă ștergerea</a></p>
<p style="color:#6b6b6b;font-size:13px;">Linkul expiră în 24h. Dacă nu ai cerut asta, ignoră acest email.</p>
</body></html>"""


def _generation_failed_html(first_name: str) -> str:
    return f"""<html><body style="font-family:-apple-system,Arial,sans-serif;color:#1a1a1a;padding:24px;">
<p>Salut, {first_name}.</p>
<p>Ceva n-a mers bine la generarea calendarului tău. Te-am contactat — răspundem în maxim 24h
și îți trimitem PDF-ul manual. Îți mulțumim pentru răbdare.</p>
<p style="color:#6b6b6b;font-size:13px;margin-top:32px;">Unu Noaptea — support@ununoaptea.com</p>
</body></html>"""


# --- Senders ---


async def _send_resend(to: str, subject: str, html: str) -> None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                "to": [to],
                "subject": subject,
                "html": html,
            },
        )
        resp.raise_for_status()


async def _send_sendgrid(to: str, subject: str, html: str) -> None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {
                    "email": settings.EMAIL_FROM,
                    "name": settings.EMAIL_FROM_NAME,
                },
                "subject": subject,
                "content": [{"type": "text/html", "value": html}],
            },
        )
        resp.raise_for_status()


async def _send(to: str, subject: str, html: str) -> None:
    provider = settings.EMAIL_PROVIDER
    if provider == "resend" and settings.RESEND_API_KEY:
        await _send_resend(to, subject, html)
    elif provider == "sendgrid" and settings.SENDGRID_API_KEY:
        await _send_sendgrid(to, subject, html)
    else:
        # Dev fallback — log to stdout.
        log.info("email.sent_console", to=to, subject=subject, body_preview=html[:200])
    await asyncio.sleep(0)  # yield


# --- Public API ---


async def send_order_confirmation(to: str, first_name: str, status_url: str) -> None:
    await _send(
        to,
        "Calendarul tău Unu Noaptea e în lucru",
        _order_confirmation_html(first_name, status_url),
    )


async def send_calendar_ready(to: str, first_name: str, download_url: str) -> None:
    await _send(
        to,
        f"Calendarul tău e gata, {first_name}",
        _calendar_ready_html(first_name, download_url),
    )


async def send_generation_failed(to: str, first_name: str) -> None:
    await _send(
        to,
        "Ceva n-a mers bine cu calendarul tău",
        _generation_failed_html(first_name),
    )


async def send_gdpr_confirm(to: str, confirm_url: str) -> None:
    await _send(to, "Confirmă ștergerea datelor tale", _gdpr_delete_confirm_html(confirm_url))

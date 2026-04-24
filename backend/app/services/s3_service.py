"""S3 / Cloudflare R2 object storage wrapper.

Uses boto3 with async offloaded to threadpool (aioboto3 optional).
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import boto3
from botocore.client import Config

from app.core.config import settings
from app.core.logging import log

# ---------------------------------------------------------------------------
# Demo-mode local storage
# ---------------------------------------------------------------------------
# In DEMO_MODE the platform may not have S3/R2 configured at all. We fall
# back to writing PDFs under a local directory and serving them directly
# from the download endpoint. The `key` is still an S3-shaped path, e.g.
# `orders/<uuid>/calendar.pdf`.

_DEMO_ROOT = Path("/tmp/unu_noaptea_demo_pdfs")


def demo_local_path(key: str) -> Path:
    return _DEMO_ROOT / key


def _demo_write(key: str, body: bytes) -> str:
    path = demo_local_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return key


def _build_client() -> Any:
    kwargs = {
        "aws_access_key_id": settings.S3_ACCESS_KEY_ID or None,
        "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY or None,
        "region_name": settings.S3_REGION,
        "config": Config(signature_version="s3v4"),
    }
    if settings.S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


_client = None


def get_client() -> Any:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


async def upload_pdf(key: str, body: bytes) -> str:
    """Upload bytes as `application/pdf` and return the key.

    In DEMO_MODE the bytes are written to a local dir instead of S3.
    """
    if settings.DEMO_MODE:
        result = await asyncio.to_thread(_demo_write, key, body)
        log.info("s3.pdf_written_local_demo", key=key, bytes=len(body))
        return result

    def _sync_upload() -> str:
        client = get_client()
        client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=body,
            ContentType="application/pdf",
            CacheControl="private, max-age=3600",
        )
        return key

    result = await asyncio.to_thread(_sync_upload)
    log.info("s3.pdf_uploaded", bucket=settings.S3_BUCKET, key=key, bytes=len(body))
    return result


async def create_presigned_url(key: str) -> str:
    def _sync_sign() -> str:
        client = get_client()
        url: str = client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=settings.PDF_S3_PRESIGNED_URL_EXPIRE_HOURS * 3600,
        )
        return url

    return await asyncio.to_thread(_sync_sign)


async def delete_pdf(key: str) -> None:
    def _sync_delete() -> None:
        client = get_client()
        client.delete_object(Bucket=settings.S3_BUCKET, Key=key)

    await asyncio.to_thread(_sync_delete)
    log.info("s3.pdf_deleted", key=key)

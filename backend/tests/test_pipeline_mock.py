"""End-to-end pipeline tests in MOCK mode (no API keys required)."""

from __future__ import annotations

import base64
import io
import os

from fastapi.testclient import TestClient
from PIL import Image

# Scrub provider keys so the pipeline always runs the MockProvider.
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("GOOGLE_API_KEY", None)

from app.config import get_settings  # noqa: E402  (import after env scrub)
from app.main import app  # noqa: E402
from app.services.pipeline import run_staging  # noqa: E402

get_settings.cache_clear()

client = TestClient(app)


def _sample_png_bytes(size: tuple[int, int] = (256, 192)) -> bytes:
    """Return the raw bytes of a small solid-color PNG for testing."""
    image = Image.new("RGB", size, (200, 210, 220))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _assert_is_png_data_url(data_url: str) -> None:
    """Assert that ``data_url`` is a base64 PNG data URL that decodes."""
    assert data_url.startswith("data:image/")
    header, _, payload = data_url.partition(",")
    assert "base64" in header
    raw = base64.b64decode(payload)
    # Must decode back into a real image.
    Image.open(io.BytesIO(raw)).verify()


def test_run_staging_mock_returns_base64_image() -> None:
    """The pipeline returns a decodable base64 image and a non-empty prompt."""
    result = run_staging(
        image_bytes=_sample_png_bytes(),
        mode="furnish",
        style="modern",
        instruction="cozy reading nook by the window",
        enhance=True,
    )

    assert result.mock is True
    assert result.id
    assert result.prompt_used.strip()
    _assert_is_png_data_url(result.result_image)
    _assert_is_png_data_url(result.original_image)


def test_stage_endpoint_mock_end_to_end() -> None:
    """POST /api/stage returns 200 with a mock base64 result image."""
    files = {"image": ("room.png", _sample_png_bytes(), "image/png")}
    data = {"mode": "furnish", "style": "scandinavian", "enhance": "true"}

    response = client.post("/api/stage", files=files, data=data)

    assert response.status_code == 200, response.text
    body = response.json()

    assert body["mock"] is True
    assert body["id"]
    assert body["promptUsed"].strip()
    _assert_is_png_data_url(body["resultImage"])
    _assert_is_png_data_url(body["originalImage"])


def test_stage_endpoint_rejects_unknown_mode() -> None:
    """An unrecognised mode yields HTTP 422 per the contract."""
    files = {"image": ("room.png", _sample_png_bytes(), "image/png")}
    data = {"mode": "not-a-real-mode"}

    response = client.post("/api/stage", files=files, data=data)
    assert response.status_code == 422


def test_stage_endpoint_rejects_invalid_image() -> None:
    """Non-image upload bytes yield HTTP 422."""
    files = {"image": ("broken.png", b"this is not an image", "image/png")}
    data = {"mode": "declutter"}

    response = client.post("/api/stage", files=files, data=data)
    assert response.status_code == 422

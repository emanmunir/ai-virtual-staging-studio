"""Tests for the optional edit-mask (targeted-edit) feature, in MOCK mode."""

from __future__ import annotations

import io
import os

from fastapi.testclient import TestClient
from PIL import Image

# Scrub provider keys so the pipeline always runs the MockProvider.
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("GOOGLE_API_KEY", None)

from app.config import get_settings  # noqa: E402  (import after env scrub)
from app.main import app  # noqa: E402
from app.services.pipeline import ImageDecodeError, run_staging  # noqa: E402

get_settings.cache_clear()

client = TestClient(app)

_SIZE = (256, 192)


def _sample_png_bytes(size: tuple[int, int] = _SIZE, color=(200, 210, 220)) -> bytes:
    """Return the raw bytes of a small solid-color PNG for testing."""
    image = Image.new("RGB", size, color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _sample_mask_bytes(size: tuple[int, int] = _SIZE) -> bytes:
    """Return a black mask PNG with a white rectangle in the top-left quadrant."""
    mask = Image.new("L", size, 0)
    half_w, half_h = size[0] // 2, size[1] // 2
    for y in range(half_h):
        for x in range(half_w):
            mask.putpixel((x, y), 255)
    buffer = io.BytesIO()
    mask.save(buffer, format="PNG")
    return buffer.getvalue()


def test_run_staging_without_mask_edits_whole_image() -> None:
    """With no mask, mask_applied is False and the whole image may change."""
    result = run_staging(
        image_bytes=_sample_png_bytes(),
        mode="furnish",
        style="modern",
        enhance=False,
    )
    assert result.mask_applied is False


def test_run_staging_with_mask_marks_mask_applied() -> None:
    """Supplying mask_bytes flags the result as a masked (targeted) edit."""
    result = run_staging(
        image_bytes=_sample_png_bytes(),
        mode="furnish",
        style="modern",
        enhance=False,
        mask_bytes=_sample_mask_bytes(),
    )
    assert result.mask_applied is True


def test_mock_provider_confines_edit_to_masked_region() -> None:
    """The mock provider's watermark must not touch pixels outside the mask."""
    original_bytes = _sample_png_bytes()
    result = run_staging(
        image_bytes=original_bytes,
        mode="declutter",
        enhance=False,
        mask_bytes=_sample_mask_bytes(),
    )

    original = Image.open(io.BytesIO(original_bytes)).convert("RGBA")
    header, _, payload = result.result_image.partition(",")
    import base64

    staged = Image.open(io.BytesIO(base64.b64decode(payload))).convert("RGBA")

    # Bottom-right corner sits entirely outside the masked (top-left) quadrant
    # and must be pixel-identical to the source image.
    w, h = original.size
    probe = (w - 5, h - 5)
    assert staged.getpixel(probe) == original.getpixel(probe)


def test_run_staging_rejects_invalid_mask_bytes() -> None:
    """Garbage mask bytes raise ImageDecodeError, mirroring image validation."""
    try:
        run_staging(
            image_bytes=_sample_png_bytes(),
            mode="furnish",
            enhance=False,
            mask_bytes=b"not a real image",
        )
    except ImageDecodeError:
        pass
    else:
        raise AssertionError("Expected ImageDecodeError for invalid mask bytes.")


def test_stage_endpoint_accepts_optional_mask_upload() -> None:
    """POST /api/stage accepts an optional `mask` file and reports maskApplied."""
    files = {
        "image": ("room.png", _sample_png_bytes(), "image/png"),
        "mask": ("mask.png", _sample_mask_bytes(), "image/png"),
    }
    data = {"mode": "furnish", "style": "modern", "enhance": "false"}

    response = client.post("/api/stage", files=files, data=data)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["maskApplied"] is True


def test_stage_endpoint_without_mask_reports_mask_applied_false() -> None:
    """POST /api/stage without a mask reports maskApplied: false."""
    files = {"image": ("room.png", _sample_png_bytes(), "image/png")}
    data = {"mode": "furnish", "style": "modern", "enhance": "false"}

    response = client.post("/api/stage", files=files, data=data)

    assert response.status_code == 200, response.text
    assert response.json()["maskApplied"] is False

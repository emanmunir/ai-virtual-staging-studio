"""End-to-end staging pipeline.

Ties the pieces together: decode the uploaded image, build and optionally
enhance the prompt, run the selected provider, and encode both the original and
the staged image as base64 data URLs for the frontend.
"""

from __future__ import annotations

import base64
import io
import uuid
from dataclasses import dataclass
from typing import Optional

from PIL import Image, UnidentifiedImageError

from ..config import Settings, get_settings
from . import presets
from .prompt_enhancer import enhance_prompt
from .provider import BaseProvider, ProviderError, get_provider


class ImageDecodeError(ValueError):
    """Raised when the uploaded bytes cannot be decoded as an image."""


@dataclass(frozen=True)
class StageResult:
    """Structured result of a staging run, ready for serialization."""

    id: str
    result_image: str  # base64 data URL
    original_image: str  # base64 data URL
    prompt_used: str
    mock: bool
    mask_applied: bool = False


def _load_image(raw: bytes) -> Image.Image:
    """Decode raw upload bytes into a Pillow image.

    Raises:
        ImageDecodeError: If the bytes are empty or not a valid image.
    """
    if not raw:
        raise ImageDecodeError("Uploaded file is empty.")
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageDecodeError("Uploaded file is not a valid image.") from exc
    return image


def _load_mask(raw: bytes, target_size: tuple[int, int]) -> Image.Image:
    """Decode raw mask bytes into a single-channel (``"L"``) Pillow image.

    The mask is resized to ``target_size`` (the source image's dimensions) so
    callers never have to worry about mismatched upload dimensions. White
    (255) pixels mark the region a provider is allowed to edit; black (0)
    pixels mark the region that must be left untouched.

    Raises:
        ImageDecodeError: If the bytes are empty or not a valid image.
    """
    if not raw:
        raise ImageDecodeError("Uploaded mask is empty.")
    try:
        mask = Image.open(io.BytesIO(raw))
        mask.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageDecodeError("Uploaded mask is not a valid image.") from exc
    return mask.convert("L").resize(target_size)


def _to_data_url(image: Image.Image, fmt: str = "PNG") -> str:
    """Encode a Pillow image as a base64 ``data:`` URL."""
    buffer = io.BytesIO()
    # PNG needs RGBA/RGB; normalise palette or transparency-bearing modes.
    to_save = image
    if fmt.upper() == "PNG" and image.mode not in {"RGB", "RGBA"}:
        to_save = image.convert("RGBA")
    to_save.save(buffer, format=fmt)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    mime = f"image/{fmt.lower()}"
    return f"data:{mime};base64,{encoded}"


def run_staging(
    *,
    image_bytes: bytes,
    mode: str,
    style: Optional[str] = None,
    instruction: Optional[str] = None,
    enhance: bool = True,
    mask_bytes: Optional[bytes] = None,
    provider: Optional[BaseProvider] = None,
    settings: Optional[Settings] = None,
) -> StageResult:
    """Run the full staging pipeline and return a :class:`StageResult`.

    Args:
        image_bytes: Raw bytes of the uploaded source image.
        mode: A valid staging mode id.
        style: Optional valid style id.
        instruction: Optional free-text refinement.
        enhance: Whether to run best-effort LLM prompt enhancement.
        mask_bytes: Optional raw bytes of an edit mask (white = editable
            region, black = untouched region). When omitted, the whole image
            is eligible for editing, matching prior behaviour.
        provider: Optional provider override (defaults to the key-based factory).
        settings: Optional settings override (defaults to the cached instance).

    Returns:
        A populated :class:`StageResult`.

    Raises:
        ImageDecodeError: If the upload (or mask) is not a valid image.
        ValueError: If ``mode``/``style`` are invalid.
        ProviderError: If the image provider fails.
    """
    settings = settings or get_settings()
    provider = provider or get_provider(settings)

    # 1) Decode the upload (raises ImageDecodeError on bad input).
    original = _load_image(image_bytes)

    # 1b) Decode the optional mask, resized to match the source image.
    mask = _load_mask(mask_bytes, original.size) if mask_bytes else None

    # 2) Build the deterministic base prompt (raises ValueError if invalid).
    base_prompt = presets.build_base_prompt(mode, style, instruction)

    # 3) Optionally enhance the prompt via the text model (best-effort).
    final_prompt = enhance_prompt(base_prompt, enhance=enhance, settings=settings)

    # 4) Run the provider (raises ProviderError on failure).
    staged = provider.edit_image(original, final_prompt, mask=mask)

    # 5) Encode both images as data URLs for the frontend.
    return StageResult(
        id=uuid.uuid4().hex,
        result_image=_to_data_url(staged, "PNG"),
        original_image=_to_data_url(original, "PNG"),
        prompt_used=final_prompt,
        mock=provider.is_mock,
        mask_applied=mask is not None,
    )


__all__ = [
    "ImageDecodeError",
    "ProviderError",
    "StageResult",
    "run_staging",
]

"""Pillow-based watermarking used by the mock provider.

The mock provider echoes the original image back with a light, unobtrusive
``PREVIEW (mock)`` watermark so it is visually obvious that no real staging was
performed while still keeping the app fully functional without API keys.
"""

from __future__ import annotations

from typing import Optional

from PIL import Image, ImageDraw, ImageFont

_WATERMARK_TEXT = "PREVIEW (mock)"
_MASKED_WATERMARK_TEXT = "PREVIEW (masked)"


def _load_font(size: int) -> ImageFont.ImageFont:
    """Load a truetype font, falling back to Pillow's bitmap default.

    Pillow does not always ship with truetype fonts available; the default
    bitmap font guarantees this never raises on a fresh install.
    """
    for candidate in ("DejaVuSans-Bold.ttf", "Arial.ttf", "Helvetica.ttf"):
        try:
            return ImageFont.truetype(candidate, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _text_size(
    draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont
) -> tuple[int, int]:
    """Return the (width, height) of ``text`` in pixels, cross-Pillow-version."""
    # ``textbbox`` is available on modern Pillow; fall back gracefully if not.
    if hasattr(draw, "textbbox"):
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        return right - left, bottom - top
    return draw.textsize(text, font=font)  # type: ignore[attr-defined]


def apply_preview_watermark(
    image: Image.Image,
    text: Optional[str] = None,
    mask: Optional[Image.Image] = None,
) -> Image.Image:
    """Return a copy of ``image`` with a semi-transparent watermark banner.

    Args:
        image: The source image to watermark.
        text: Watermark caption to draw. Defaults to ``"PREVIEW (mock)"``, or
            ``"PREVIEW (masked)"`` when ``mask`` is provided.
        mask: Optional single-channel (``"L"``) mask, the same size as
            ``image``, where white (255) marks the region to "edit" and black
            (0) marks the region to leave untouched. When provided, the
            watermark banner is confined to the masked region so the mock
            provider still demonstrates targeted, mask-limited edits offline.

    Returns:
        A new ``RGBA`` image with the watermark composited on top. The original
        image is not modified.
    """
    base = image.convert("RGBA")
    width, height = base.size
    caption = text or (_MASKED_WATERMARK_TEXT if mask is not None else _WATERMARK_TEXT)

    # Scale the font relative to the image so the banner is legible on any size.
    font_size = max(16, width // 22)
    font = _load_font(font_size)

    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    text_w, text_h = _text_size(draw, caption, font)
    pad_x = max(12, font_size // 2)
    pad_y = max(8, font_size // 3)

    # Center the banner on the image (or on the masked region's centroid, when
    # a mask is supplied and has any non-zero pixels).
    box_w = text_w + pad_x * 2
    box_h = text_h + pad_y * 2
    center_x, center_y = width // 2, height // 2
    if mask is not None:
        bbox = mask.getbbox()
        if bbox is not None:
            left, top, right, bottom = bbox
            center_x = (left + right) // 2
            center_y = (top + bottom) // 2
    box_x = min(max(0, center_x - box_w // 2), max(0, width - box_w))
    box_y = min(max(0, center_y - box_h // 2), max(0, height - box_h))

    # Light translucent background so the caption reads on any photo.
    draw.rectangle(
        [box_x, box_y, box_x + box_w, box_y + box_h],
        fill=(0, 0, 0, 110),
    )
    draw.text(
        (box_x + pad_x, box_y + pad_y),
        caption,
        font=font,
        fill=(255, 255, 255, 220),
    )

    if mask is None:
        return Image.alpha_composite(base, overlay)

    # Restrict the overlay to the masked region: outside the mask, the result
    # is pixel-identical to the source image, mirroring what a real masked
    # inpainting edit should guarantee.
    watermarked = Image.alpha_composite(base, overlay)
    region_mask = mask.convert("L").resize(base.size)
    return Image.composite(watermarked, base, region_mask)

"""Pillow-based watermarking used by the mock provider.

The mock provider echoes the original image back with a light, unobtrusive
``PREVIEW (mock)`` watermark so it is visually obvious that no real staging was
performed while still keeping the app fully functional without API keys.
"""

from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont

_WATERMARK_TEXT = "PREVIEW (mock)"


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


def apply_preview_watermark(image: Image.Image, text: str = _WATERMARK_TEXT) -> Image.Image:
    """Return a copy of ``image`` with a semi-transparent watermark banner.

    Args:
        image: The source image to watermark.
        text: Watermark caption to draw (defaults to ``"PREVIEW (mock)"``).

    Returns:
        A new ``RGBA`` image with the watermark composited on top. The original
        image is not modified.
    """
    base = image.convert("RGBA")
    width, height = base.size

    # Scale the font relative to the image so the banner is legible on any size.
    font_size = max(16, width // 22)
    font = _load_font(font_size)

    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    text_w, text_h = _text_size(draw, text, font)
    pad_x = max(12, font_size // 2)
    pad_y = max(8, font_size // 3)

    # Center the banner on the image.
    box_w = text_w + pad_x * 2
    box_h = text_h + pad_y * 2
    box_x = (width - box_w) // 2
    box_y = (height - box_h) // 2

    # Light translucent background so the caption reads on any photo.
    draw.rectangle(
        [box_x, box_y, box_x + box_w, box_y + box_h],
        fill=(0, 0, 0, 110),
    )
    draw.text(
        (box_x + pad_x, box_y + pad_y),
        text,
        font=font,
        fill=(255, 255, 255, 220),
    )

    return Image.alpha_composite(base, overlay)

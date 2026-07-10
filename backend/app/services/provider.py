"""Image staging providers and a factory that selects one by key presence.

Two providers are supported:

* :class:`GeminiProvider` — calls Google's ``gemini-2.5-flash-image`` model
  (a.k.a. "nano-banana") to perform real virtual staging.
* :class:`MockProvider` — returns the original image with a light preview
  watermark so the app runs and the test-suite passes with zero API keys.

Use :func:`get_provider` to obtain the right provider for the current config.
"""

from __future__ import annotations

import abc
import io
from typing import Optional

from PIL import Image

from ..config import Settings, get_settings
from .watermark import apply_preview_watermark


class ProviderError(RuntimeError):
    """Raised when an image provider fails to produce a staged image.

    The pipeline translates this into an HTTP 502 with the message as detail.
    """


class BaseProvider(abc.ABC):
    """Common interface shared by all staging providers."""

    #: ``True`` for the mock provider, ``False`` for real providers.
    is_mock: bool = False

    #: Short provider identifier surfaced in the health endpoint.
    name: str = "base"

    @abc.abstractmethod
    def edit_image(
        self,
        image: Image.Image,
        prompt: str,
        mask: Optional[Image.Image] = None,
    ) -> Image.Image:
        """Return a staged version of ``image`` guided by ``prompt``.

        Args:
            image: The source room/exterior photo as a Pillow image.
            prompt: The staging instruction to apply.
            mask: Optional single-channel (``"L"``) mask the same size as
                ``image``. White (255) marks the region the edit should be
                confined to; black (0) marks the region that must stay
                pixel-identical to the source. ``None`` means "edit the whole
                image", the existing (unmasked) behaviour.

        Returns:
            The staged image as a new Pillow image.

        Raises:
            ProviderError: If the provider fails to produce an image.
        """
        raise NotImplementedError


class MockProvider(BaseProvider):
    """Offline provider that echoes the input with a preview watermark."""

    is_mock = True
    name = "mock"

    def edit_image(
        self,
        image: Image.Image,
        prompt: str,
        mask: Optional[Image.Image] = None,
    ) -> Image.Image:
        """Return the original image with a ``PREVIEW (mock)`` watermark.

        When ``mask`` is provided, the watermark is confined to the masked
        region so the mock provider still demonstrates targeted, mask-limited
        edits without any external API call.
        """
        # ``prompt`` is intentionally unused: the mock does not stage anything,
        # it only demonstrates the round-trip so the UI and tests work offline.
        return apply_preview_watermark(image, mask=mask)


class GeminiProvider(BaseProvider):
    """Real provider backed by Google Gemini's image model (nano-banana)."""

    is_mock = False
    name = "gemini"

    def __init__(self, settings: Settings) -> None:
        """Create the provider and lazily import the Google GenAI SDK.

        The SDK import is deferred to construction time so that mock-mode users
        (and the test-suite) never need ``google-genai`` installed just to run.
        """
        # Imported here so importing this module never hard-requires the SDK.
        from google import genai  # noqa: WPS433 (intentional local import)

        self._settings = settings
        self._image_model = settings.gemini_image_model
        self._client = genai.Client(api_key=settings.gemini_api_key)

    #: Appended to the prompt whenever a mask is supplied, so the model treats
    #: the second image as a region selector rather than staging material.
    _MASK_INSTRUCTION = (
        " A second image is provided as an edit mask, the same size as the "
        "source photo: white areas mark the only region you may change; black "
        "areas must remain pixel-identical to the source photo (same colors, "
        "objects, and lighting). Blend the edges of the edit seamlessly with "
        "the untouched area."
    )

    def edit_image(
        self,
        image: Image.Image,
        prompt: str,
        mask: Optional[Image.Image] = None,
    ) -> Image.Image:
        """Stage ``image`` with Gemini and return the produced image.

        When ``mask`` is supplied, it is sent alongside the source image as a
        region selector, and the prompt is extended with an explicit
        instruction to confine edits to the masked (white) area.

        Raises:
            ProviderError: On any SDK/transport failure, or if the model
                returns no image part.
        """
        contents: list = [prompt, image]
        if mask is not None:
            contents[0] = prompt + self._MASK_INSTRUCTION
            contents.append(mask.convert("L").resize(image.size))

        try:
            response = self._client.models.generate_content(
                model=self._image_model,
                contents=contents,
            )
        except Exception as exc:  # noqa: BLE001 (surface any SDK error uniformly)
            raise ProviderError(f"Gemini image request failed: {exc}") from exc

        produced = self._extract_image(response)
        if produced is None:
            raise ProviderError(
                "Gemini returned no image data for the staging request."
            )
        return produced

    @staticmethod
    def _extract_image(response: object) -> Optional[Image.Image]:
        """Pull the first inline image out of a Gemini response, if any.

        Parts may be either text or image; this walks them defensively and
        returns the first decodable image, or ``None`` when none is present.
        """
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            for part in parts:
                inline = getattr(part, "inline_data", None)
                data = getattr(inline, "data", None) if inline else None
                if not data:
                    continue
                try:
                    return Image.open(io.BytesIO(data)).convert("RGBA")
                except Exception as exc:  # noqa: BLE001
                    raise ProviderError(
                        f"Failed to decode image returned by Gemini: {exc}"
                    ) from exc
        return None


def get_provider(settings: Optional[Settings] = None) -> BaseProvider:
    """Return the appropriate provider based on API-key presence.

    A real :class:`GeminiProvider` is returned when a Gemini/Google API key is
    configured; otherwise a :class:`MockProvider` is returned so the app is
    fully functional offline.

    Args:
        settings: Optional settings override (defaults to the cached instance).

    Returns:
        A ready-to-use provider instance.
    """
    settings = settings or get_settings()
    if settings.has_gemini_key:
        return GeminiProvider(settings)
    return MockProvider()

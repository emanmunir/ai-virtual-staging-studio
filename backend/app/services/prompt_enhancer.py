"""Optional LLM prompt expansion.

When a real Gemini key is configured and the caller opts in (``enhance=True``),
the base staging prompt is rewritten by a lightweight text model into a richer,
more descriptive instruction. In mock mode (or when enhancement is disabled),
the base prompt is returned unchanged.
"""

from __future__ import annotations

from typing import Optional

from ..config import Settings, get_settings

# Meta-prompt that instructs the text model how to expand a staging prompt.
_ENHANCER_SYSTEM = (
    "You are a prompt engineer for a photorealistic interior/exterior image "
    "editing model used for real-estate virtual staging. Rewrite the user's "
    "staging instruction into a single, vivid, self-contained prompt. Preserve "
    "the original intent and any hard constraints (keep architecture, "
    "perspective, and lighting realistic). Do not add commentary, headings, or "
    "quotes — return only the improved prompt text."
)


def enhance_prompt(
    base_prompt: str,
    *,
    enhance: bool = True,
    settings: Optional[Settings] = None,
) -> str:
    """Return an enhanced staging prompt, or the base prompt unchanged.

    The base prompt is returned verbatim when any of the following hold:

    * ``enhance`` is ``False``;
    * no Gemini/Google API key is configured (mock mode);
    * the text model call fails for any reason (enhancement is best-effort and
      must never break the staging pipeline).

    Args:
        base_prompt: The deterministic prompt assembled from mode/style/etc.
        enhance: Whether the caller requested enhancement.
        settings: Optional settings override (defaults to the cached instance).

    Returns:
        The (possibly enhanced) prompt string.
    """
    settings = settings or get_settings()

    if not enhance or not settings.has_gemini_key:
        return base_prompt

    try:
        from google import genai  # noqa: WPS433 (intentional local import)

        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_text_model,
            contents=[f"{_ENHANCER_SYSTEM}\n\nStaging instruction:\n{base_prompt}"],
        )
        text = getattr(response, "text", None)
    except Exception:  # noqa: BLE001 (enhancement is strictly best-effort)
        return base_prompt

    if text and text.strip():
        return text.strip()
    return base_prompt

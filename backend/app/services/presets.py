"""Mode + style catalogue and prompt-template construction.

This module is the single source of truth for the staging *modes* (what kind of
transformation to apply) and design *styles* (the aesthetic). It also assembles
a clear, provider-agnostic base prompt from a mode/style/instruction triple.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass(frozen=True)
class Mode:
    """A staging transformation option."""

    id: str
    name: str
    description: str
    #: Instruction fragment describing the transformation for the image model.
    directive: str


@dataclass(frozen=True)
class Style:
    """A design aesthetic that furniture/finishes should follow."""

    id: str
    name: str
    description: str
    #: Descriptive fragment injected into the prompt to steer the aesthetic.
    directive: str


# --- Modes -------------------------------------------------------------------

MODES: Dict[str, Mode] = {
    "furnish": Mode(
        id="furnish",
        name="Furnish",
        description="Add tasteful furniture and decor to an empty room.",
        directive=(
            "Virtually stage this empty room by adding realistic, tasteful "
            "furniture, rugs, lighting, and decor appropriate for the space. "
            "Keep the existing architecture, windows, flooring, walls, and "
            "camera perspective exactly as they are."
        ),
    ),
    "declutter": Mode(
        id="declutter",
        name="Declutter",
        description="Remove clutter and depersonalize the space.",
        directive=(
            "Declutter and depersonalize this room. Remove personal items, "
            "excess clutter, cables, and distractions to present a clean, "
            "neutral, market-ready space. Preserve the room's structure, "
            "existing furniture layout, and camera perspective."
        ),
    ),
    "repaint": Mode(
        id="repaint",
        name="Repaint",
        description="Recolor the walls while keeping everything else intact.",
        directive=(
            "Repaint the walls of this room with a fresh, appealing color while "
            "keeping trim, ceiling, flooring, furniture, fixtures, and camera "
            "perspective unchanged. Ensure realistic, even wall coverage."
        ),
    ),
    "dusk": Mode(
        id="dusk",
        name="Day to Dusk",
        description="Convert a daytime exterior photo into a warm dusk scene.",
        directive=(
            "Convert this daytime exterior photograph into a warm, inviting "
            "dusk scene. Add a soft twilight sky, warm interior and exterior "
            "lighting glowing from windows and fixtures, and gentle ambient "
            "shadows. Keep the building, landscaping, and composition intact."
        ),
    ),
}


# --- Styles ------------------------------------------------------------------

STYLES: Dict[str, Style] = {
    "modern": Style(
        id="modern",
        name="Modern",
        description="Clean lines, neutral palette, minimal ornamentation.",
        directive=(
            "in a modern style with clean lines, a neutral palette, sleek "
            "materials, and minimal, purposeful decor"
        ),
    ),
    "scandinavian": Style(
        id="scandinavian",
        name="Scandinavian",
        description="Light woods, soft textiles, airy and bright.",
        directive=(
            "in a Scandinavian style with light woods, soft neutral textiles, "
            "cozy minimalism, and an airy, bright feel"
        ),
    ),
    "industrial": Style(
        id="industrial",
        name="Industrial",
        description="Raw materials, metal accents, exposed textures.",
        directive=(
            "in an industrial style with raw materials, matte metal accents, "
            "leather, reclaimed wood, and exposed, textured surfaces"
        ),
    ),
    "midcentury": Style(
        id="midcentury",
        name="Mid-Century Modern",
        description="Warm woods, organic curves, retro-inspired forms.",
        directive=(
            "in a mid-century modern style with warm walnut tones, tapered "
            "legs, organic curves, and retro-inspired accent colors"
        ),
    ),
    "coastal": Style(
        id="coastal",
        name="Coastal",
        description="Breezy blues and whites, natural fibers, relaxed feel.",
        directive=(
            "in a coastal style with breezy blues and whites, natural fibers, "
            "light linens, and a relaxed, sunlit atmosphere"
        ),
    ),
    "farmhouse": Style(
        id="farmhouse",
        name="Farmhouse",
        description="Rustic warmth, shiplap, cozy traditional charm.",
        directive=(
            "in a modern farmhouse style with rustic warmth, shiplap accents, "
            "distressed woods, and cozy, traditional charm"
        ),
    ),
}


def list_modes() -> List[Dict[str, str]]:
    """Return all modes as plain dicts for the ``/api/modes`` response."""
    return [
        {"id": m.id, "name": m.name, "description": m.description}
        for m in MODES.values()
    ]


def list_styles() -> List[Dict[str, str]]:
    """Return all styles as plain dicts for the ``/api/modes`` response."""
    return [
        {"id": s.id, "name": s.name, "description": s.description}
        for s in STYLES.values()
    ]


def is_valid_mode(mode_id: str) -> bool:
    """Whether ``mode_id`` is a recognised staging mode."""
    return mode_id in MODES


def is_valid_style(style_id: Optional[str]) -> bool:
    """Whether ``style_id`` is a recognised style (``None`` is allowed)."""
    return style_id is None or style_id in STYLES


def build_base_prompt(
    mode: str,
    style: Optional[str] = None,
    instruction: Optional[str] = None,
) -> str:
    """Assemble a base staging prompt from a mode/style/instruction triple.

    Args:
        mode: A valid mode id (see :data:`MODES`).
        style: An optional valid style id (see :data:`STYLES`). Ignored for
            modes where an aesthetic style is not meaningful (e.g. ``dusk``).
        instruction: Optional free-text refinement from the user.

    Returns:
        A single, well-formed English prompt string.

    Raises:
        ValueError: If ``mode`` or ``style`` is not recognised.
    """
    if not is_valid_mode(mode):
        raise ValueError(f"Unknown mode: {mode!r}")
    if not is_valid_style(style):
        raise ValueError(f"Unknown style: {style!r}")

    parts: List[str] = [MODES[mode].directive]

    # A style only makes sense for modes that introduce/re-style furnishings.
    style_applies = mode in {"furnish", "repaint"}
    if style and style_applies:
        parts.append(f"Design the space {STYLES[style].directive}.")

    if instruction and instruction.strip():
        parts.append(f"Additional request: {instruction.strip()}.")

    parts.append(
        "Produce a single photorealistic image. Preserve correct perspective, "
        "lighting, scale, and shadows so the result looks like a real "
        "photograph."
    )

    return " ".join(parts)

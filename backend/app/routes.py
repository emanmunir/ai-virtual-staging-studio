"""HTTP routes implementing the AI Virtual Staging Studio API contract."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from .config import get_settings
from .schemas import (
    HealthResponse,
    ModesResponse,
    StageResponse,
)
from .services import presets
from .services.pipeline import ImageDecodeError, ProviderError, run_staging

router = APIRouter(prefix="/api", tags=["staging"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe reporting which provider is active."""
    settings = get_settings()
    return HealthResponse(status="ok", provider=settings.provider_name)


@router.get("/modes", response_model=ModesResponse)
def modes() -> ModesResponse:
    """Return the available staging modes and design styles."""
    return ModesResponse(
        modes=presets.list_modes(),
        styles=presets.list_styles(),
    )


@router.post(
    "/stage",
    response_model=StageResponse,
    responses={502: {"description": "Image provider failure."}},
)
async def stage(
    image: UploadFile = File(..., description="Source room/exterior photo."),
    mode: str = Form(..., description="Staging mode id (e.g. 'furnish')."),
    style: Optional[str] = Form(None, description="Optional design style id."),
    instruction: Optional[str] = Form(
        None, description="Optional free-text refinement."
    ),
    enhance: bool = Form(True, description="Run best-effort prompt enhancement."),
    mask: Optional[UploadFile] = File(
        None,
        description=(
            "Optional edit mask, same aspect as `image`. White marks the "
            "region to edit; black marks the region to leave untouched. When "
            "omitted, the whole image is eligible for editing."
        ),
    ),
) -> StageResponse:
    """Stage an uploaded image according to ``mode``/``style``/``instruction``.

    Returns a base64 result image alongside the original. Invalid mode/style
    values yield HTTP 422; provider failures yield HTTP 502.
    """
    # Validate discrete options up front so bad input maps to 422 (per contract).
    if not presets.is_valid_mode(mode):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown mode '{mode}'.",
        )
    # Treat empty-string form fields as "not provided".
    style = style or None
    if not presets.is_valid_style(style):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown style '{style}'.",
        )

    raw = await image.read()
    mask_raw = await mask.read() if mask is not None else None

    try:
        result = run_staging(
            image_bytes=raw,
            mode=mode,
            style=style,
            instruction=instruction,
            enhance=enhance,
            mask_bytes=mask_raw,
        )
    except ImageDecodeError as exc:
        # Bad image/mask payload -> 422 (client error).
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except ProviderError as exc:
        # Upstream provider failure -> 502 (per contract).
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return StageResponse(
        id=result.id,
        resultImage=result.result_image,
        originalImage=result.original_image,
        promptUsed=result.prompt_used,
        mock=result.mock,
        maskApplied=result.mask_applied,
    )

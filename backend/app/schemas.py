"""Pydantic request/response models matching the HTTP API contract."""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

# The provider is either the real Gemini integration or the local mock.
ProviderName = Literal["gemini", "mock"]


class HealthResponse(BaseModel):
    """Response body for ``GET /api/health``."""

    status: Literal["ok"] = "ok"
    provider: ProviderName


class ModeInfo(BaseModel):
    """A single staging mode option."""

    id: str = Field(..., examples=["furnish"])
    name: str = Field(..., examples=["Furnish"])
    description: str = Field(..., examples=["Add furniture to an empty room."])


class StyleInfo(BaseModel):
    """A single design style option."""

    id: str = Field(..., examples=["modern"])
    name: str = Field(..., examples=["Modern"])
    description: str = Field(..., examples=["Clean lines and neutral palette."])


class ModesResponse(BaseModel):
    """Response body for ``GET /api/modes``."""

    modes: List[ModeInfo]
    styles: List[StyleInfo]


class StageResponse(BaseModel):
    """Response body for a successful ``POST /api/stage`` request.

    ``resultImage`` and ``originalImage`` are data URLs (base64-encoded) so the
    frontend can render them directly in ``<img>`` tags.
    """

    id: str = Field(..., description="Unique identifier for this staging job.")
    resultImage: str = Field(
        ..., description="Staged image as a base64 data URL (image/png)."
    )
    originalImage: str = Field(
        ..., description="Uploaded source image as a base64 data URL."
    )
    promptUsed: str = Field(
        ..., description="The final prompt sent to the image provider."
    )
    mock: bool = Field(
        ..., description="True when produced by the mock provider (no API key)."
    )


class ErrorResponse(BaseModel):
    """Standard error envelope (mirrors FastAPI's ``{"detail": ...}``)."""

    detail: str

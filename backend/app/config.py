"""Application configuration loaded from environment variables / a `.env` file.

All settings are surfaced through a single cached :class:`Settings` instance so
the rest of the app can depend on it without re-parsing the environment.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings.

    Values are read (in order of precedence) from process environment variables
    and a local ``.env`` file. Missing values fall back to the defaults below.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Provider credentials ------------------------------------------------
    # Either GEMINI_API_KEY or GOOGLE_API_KEY may be supplied. `gemini_api_key`
    # below resolves the effective key with GEMINI_API_KEY taking precedence.
    gemini_api_key_env: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    google_api_key_env: Optional[str] = Field(default=None, alias="GOOGLE_API_KEY")

    # --- Model selection -----------------------------------------------------
    gemini_image_model: str = Field(
        default="gemini-2.5-flash-image", alias="GEMINI_IMAGE_MODEL"
    )
    gemini_text_model: str = Field(
        default="gemini-2.5-flash", alias="GEMINI_TEXT_MODEL"
    )

    # --- CORS ----------------------------------------------------------------
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173"], alias="CORS_ORIGINS"
    )

    # --- Server --------------------------------------------------------------
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow CORS origins to be provided as a comma-separated string."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def gemini_api_key(self) -> Optional[str]:
        """Return the effective API key, preferring GEMINI_API_KEY.

        Empty strings are normalised to ``None`` so that a blank env var in a
        ``.env`` file correctly triggers mock mode.
        """
        for candidate in (self.gemini_api_key_env, self.google_api_key_env):
            if candidate and candidate.strip():
                return candidate.strip()
        return None

    @property
    def has_gemini_key(self) -> bool:
        """Whether a usable Gemini/Google API key is configured."""
        return self.gemini_api_key is not None

    @property
    def provider_name(self) -> str:
        """Human-readable name of the active provider ("gemini" or "mock")."""
        return "gemini" if self.has_gemini_key else "mock"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance.

    Cached so configuration is parsed once per process. Tests that need to
    change the environment can call ``get_settings.cache_clear()``.
    """
    return Settings()

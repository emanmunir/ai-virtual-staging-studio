"""FastAPI application entrypoint for the AI Virtual Staging Studio backend.

Wires up CORS for the frontend dev origin and mounts the API router. Run with::

    uvicorn app.main:app --reload

or directly::

    python -m app.main
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import router

settings = get_settings()

app = FastAPI(
    title="AI Virtual Staging Studio",
    description=(
        "Backend API for AI-powered real-estate virtual staging. Furnish empty "
        "rooms, declutter, repaint walls, and convert day exteriors to dusk — "
        "powered by Google Gemini, with a zero-key mock mode for local dev."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["meta"], include_in_schema=False)
def root() -> dict[str, str]:
    """Friendly root pointing at the interactive docs."""
    return {
        "name": "AI Virtual Staging Studio",
        "docs": "/docs",
        "health": "/api/health",
    }


def main() -> None:
    """Launch the app with uvicorn using host/port from settings."""
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )


if __name__ == "__main__":
    main()

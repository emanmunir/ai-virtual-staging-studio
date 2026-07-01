"""Tests for the health and modes endpoints (mock mode, no API keys)."""

from __future__ import annotations

import os

from fastapi.testclient import TestClient

# Ensure no provider keys leak in from the developer's environment so the
# test-suite is deterministic and always exercises mock mode.
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("GOOGLE_API_KEY", None)

from app.config import get_settings  # noqa: E402  (import after env scrub)
from app.main import app  # noqa: E402

get_settings.cache_clear()

client = TestClient(app)


def test_health_ok_in_mock_mode() -> None:
    """/api/health returns 200 and reports the mock provider with no keys."""
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider"] == "mock"


def test_modes_lists_all_modes_and_styles() -> None:
    """/api/modes returns the full mode and style catalogue."""
    response = client.get("/api/modes")
    assert response.status_code == 200
    body = response.json()

    mode_ids = {m["id"] for m in body["modes"]}
    style_ids = {s["id"] for s in body["styles"]}

    assert mode_ids == {"furnish", "declutter", "repaint", "dusk"}
    assert style_ids == {
        "modern",
        "scandinavian",
        "industrial",
        "midcentury",
        "coastal",
        "farmhouse",
    }

    # Each entry must carry id/name/description.
    for entry in body["modes"] + body["styles"]:
        assert entry["id"] and entry["name"] and entry["description"]

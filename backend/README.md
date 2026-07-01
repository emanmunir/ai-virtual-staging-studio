# AI Virtual Staging Studio — Backend

FastAPI service that powers AI real-estate virtual staging. Upload a photo of a
room or exterior and get back a photorealistic, staged version:

- **Furnish** — add tasteful furniture and decor to an empty room
- **Declutter** — remove clutter and depersonalize the space
- **Repaint** — recolor walls while keeping everything else intact
- **Day to Dusk** — convert a daytime exterior into a warm twilight scene

Six design styles are supported: `modern`, `scandinavian`, `industrial`,
`midcentury`, `coastal`, and `farmhouse`.

Image generation is powered by Google Gemini's `gemini-2.5-flash-image` model
(a.k.a. "nano-banana"). **No API key? No problem** — the backend automatically
runs in **mock mode**, echoing your image back with a light `PREVIEW (mock)`
watermark so the whole app (and the test-suite) runs with zero keys.

---

## Quickstart

```bash
cd ai-virtual-staging-studio/backend

# 1) Create a virtualenv and install deps
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2) (Optional) Configure a real Gemini key — otherwise mock mode is used
cp .env.example .env
# edit .env and set GEMINI_API_KEY=... (or GOOGLE_API_KEY=...)

# 3) Run the API (http://localhost:8000, docs at /docs)
uvicorn app.main:app --reload
```

Run the tests (they pass with **no** API keys):

```bash
pytest
```

---

## Configuration

All configuration comes from environment variables or a gitignored `.env` file.
See [`.env.example`](./.env.example) for the full list.

| Variable             | Default                   | Description                                        |
| -------------------- | ------------------------- | -------------------------------------------------- |
| `GEMINI_API_KEY`     | _(unset)_                 | Gemini key. If unset, mock mode is used.           |
| `GOOGLE_API_KEY`     | _(unset)_                 | Alternative key name (used if `GEMINI_API_KEY` unset). |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image`  | Image editing / staging model.                     |
| `GEMINI_TEXT_MODEL`  | `gemini-2.5-flash`        | Text model used for prompt enhancement.            |
| `CORS_ORIGINS`       | `http://localhost:5173`   | Comma-separated allowed frontend origins.          |
| `HOST` / `PORT`      | `0.0.0.0` / `8000`        | Bind address when launched via `python -m app.main`. |

> Secrets are **never** hardcoded. They are read only from the environment /
> `.env`, and `.env` is gitignored.

---

## API

CORS is enabled for the frontend dev origin (`http://localhost:5173`).

### `GET /api/health`

```json
{ "status": "ok", "provider": "gemini" }
```

`provider` is `"gemini"` when a key is configured, otherwise `"mock"`.

### `GET /api/modes`

```json
{
  "modes":  [{ "id": "furnish", "name": "Furnish", "description": "..." }, ...],
  "styles": [{ "id": "modern",  "name": "Modern",  "description": "..." }, ...]
}
```

### `POST /api/stage`

`multipart/form-data`:

| Field         | Type   | Required | Notes                                 |
| ------------- | ------ | -------- | ------------------------------------- |
| `image`       | file   | yes      | Source room/exterior photo.           |
| `mode`        | string | yes      | One of the mode ids from `/api/modes`.|
| `style`       | string | no       | One of the style ids from `/api/modes`.|
| `instruction` | string | no       | Free-text refinement.                 |
| `enhance`     | bool   | no       | Default `true`. Best-effort prompt expansion. |

**200** response:

```json
{
  "id": "…",
  "resultImage": "data:image/png;base64,…",
  "originalImage": "data:image/png;base64,…",
  "promptUsed": "…",
  "mock": false
}
```

Errors:

- **422** — invalid input (unknown mode/style, missing/invalid image).
- **502** — image provider failure (`{"detail": "…"}`).

Example:

```bash
curl -s http://localhost:8000/api/stage \
  -F image=@data/samples/empty-room.jpg \
  -F mode=furnish \
  -F style=scandinavian \
  -F 'instruction=cozy reading nook by the window' \
  | jq '{id, mock, promptUsed}'
```

---

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mounting
│   ├── config.py            # pydantic-settings configuration
│   ├── schemas.py           # request/response models
│   ├── routes.py            # /api/health, /api/modes, /api/stage
│   └── services/
│       ├── provider.py      # GeminiProvider + MockProvider + factory
│       ├── presets.py       # modes/styles + prompt templates
│       ├── prompt_enhancer.py  # optional LLM prompt expansion
│       ├── pipeline.py      # load → prompt → provider → base64
│       └── watermark.py     # Pillow mock watermark
├── tests/
│   ├── test_health.py
│   └── test_pipeline_mock.py
├── data/                    # local scratch (gitignored, keep README)
├── requirements.txt
├── .env.example
└── README.md
```

## Design notes

- **Provider factory** (`services/provider.py`) selects Gemini vs. mock purely
  by API-key presence, so the same code path runs online and offline.
- **Prompt enhancement is best-effort**: if the text model call fails it falls
  back to the deterministic base prompt — enhancement never breaks staging.
- **Provider failures** surface as HTTP `502`; bad client input as `422`.
- The Google GenAI SDK is imported lazily, so mock-mode users don't need it to
  run the server or the tests.

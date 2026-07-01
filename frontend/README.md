# AI Virtual Staging Studio — Frontend

A polished single-page app for AI-powered real-estate photo staging. Upload a
room or exterior photo, choose a transformation mode and design style, and get
back an interactive before/after comparison.

Built with **Vite + React 18 + TypeScript (strict) + Tailwind CSS**.

## Features

- Drag-and-drop (and click) upload with client-side validation and preview
- Four staging modes: **Furnish**, **Declutter**, **Repaint**, **Day-to-Dusk**
- Six interior styles (shown for style-aware modes): Modern, Scandinavian,
  Industrial, Mid-century, Coastal, Farmhouse
- Optional free-text instructions and an "enhance prompt" toggle
- Interactive, keyboard-accessible **before/after slider**
- Download the staged image and inspect the exact prompt used
- Loading skeletons, empty states, and graceful error banners
- Live provider badge (Gemini vs. mock) from the backend health check

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if the backend runs elsewhere
npm run dev            # http://localhost:5173
```

The app expects the FastAPI backend to be reachable at `VITE_API_URL`
(default `http://localhost:8000`).

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Type-check and build for production  |
| `npm run preview`   | Preview the production build         |
| `npm run typecheck` | Run `tsc --noEmit` type checking     |

## Configuration

| Variable       | Default                 | Description                       |
| -------------- | ----------------------- | --------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend. |

## Project structure

```
src/
  main.tsx              App entry
  App.tsx               Page layout + staging workflow state
  index.css             Tailwind layers + theme tokens
  types.ts              Interfaces mirroring the backend contract
  vite-env.d.ts         Typed import.meta.env
  lib/
    api.ts              Typed fetch helpers (health, modes, stage)
    constants.ts        Fallback modes/styles + upload limits
    format.ts           Formatting helpers
  components/           Well-factored UI components
```

The API layer in `src/lib/api.ts` matches the backend HTTP contract exactly and
throws a typed `ApiError` on non-2xx responses.

/**
 * Typed fetch helpers for the AI Virtual Staging Studio backend.
 * The base URL is configured via the `VITE_API_URL` env var and defaults to
 * the local FastAPI dev server. Every helper throws {@link ApiError} on a
 * non-2xx response so callers can surface a clean message.
 */
import {
  ApiError,
  type HealthResponse,
  type ModesResponse,
  type StageRequest,
  type StageResponse,
} from '../types';

/** Resolved backend base URL, without a trailing slash. */
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
).replace(/\/+$/, '');

/** Shape of the `{ detail }` error body FastAPI returns for 4xx/5xx. */
interface ErrorBody {
  detail?: unknown;
}

/**
 * Attempt to extract a human-readable error message from a failed response.
 * Falls back to a generic message keyed on the status code.
 */
async function extractErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    if (typeof body.detail === 'string' && body.detail.trim().length > 0) {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      // FastAPI 422 validation errors arrive as an array of issues.
      const first = body.detail[0] as { msg?: unknown };
      if (first && typeof first.msg === 'string') {
        return first.msg;
      }
    }
  } catch {
    // Response was not JSON; fall through to the default message below.
  }
  return `Request failed with status ${response.status}.`;
}

/** Parse a JSON response, raising {@link ApiError} on failure. */
async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorDetail(response));
  }
  return (await response.json()) as T;
}

/**
 * Check backend health and which provider is active.
 * `GET /api/health`
 */
export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, { signal });
  return parseJson<HealthResponse>(response);
}

/**
 * Fetch the available staging modes and interior-design styles.
 * `GET /api/modes`
 */
export async function getModes(signal?: AbortSignal): Promise<ModesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/modes`, { signal });
  return parseJson<ModesResponse>(response);
}

/**
 * Submit a room photo for AI staging.
 * `POST /api/stage` (multipart/form-data)
 *
 * @throws {ApiError} when the backend returns a non-2xx status (e.g. 502 on a
 *   provider error, 422 on invalid input).
 */
export async function stagePhoto(
  request: StageRequest,
  signal?: AbortSignal,
): Promise<StageResponse> {
  const form = new FormData();
  form.append('image', request.image);
  form.append('mode', request.mode);
  if (request.style) {
    form.append('style', request.style);
  }
  const instruction = request.instruction?.trim();
  if (instruction) {
    form.append('instruction', instruction);
  }
  form.append('enhance', String(request.enhance));
  if (request.mask) {
    form.append('mask', request.mask, 'mask.png');
  }

  const response = await fetch(`${API_BASE_URL}/api/stage`, {
    method: 'POST',
    body: form,
    signal,
  });
  return parseJson<StageResponse>(response);
}

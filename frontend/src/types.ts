/**
 * TypeScript interfaces mirroring the FastAPI backend response shapes.
 * These must stay in sync with the backend HTTP API contract.
 */

/** Provider currently backing the staging endpoint. */
export type Provider = 'gemini' | 'mock';

/** Identifier for a staging mode. */
export type ModeId = 'furnish' | 'declutter' | 'repaint' | 'dusk';

/** Identifier for an interior-design style. */
export type StyleId =
  | 'modern'
  | 'scandinavian'
  | 'industrial'
  | 'midcentury'
  | 'coastal'
  | 'farmhouse';

/** Response from `GET /api/health`. */
export interface HealthResponse {
  status: 'ok' | string;
  provider: Provider;
}

/** A selectable staging mode returned by `GET /api/modes`. */
export interface Mode {
  id: ModeId;
  name: string;
  description: string;
}

/** A selectable interior-design style returned by `GET /api/modes`. */
export interface Style {
  id: StyleId;
  name: string;
  description: string;
}

/** Response from `GET /api/modes`. */
export interface ModesResponse {
  modes: Mode[];
  styles: Style[];
}

/** Payload for `POST /api/stage` (assembled into multipart/form-data). */
export interface StageRequest {
  image: File;
  mode: ModeId;
  style?: StyleId;
  instruction?: string;
  enhance: boolean;
  /**
   * Optional edit mask, same pixel dimensions as `image` (any image type the
   * backend can decode). White marks the region to edit; black marks the
   * region that must stay untouched. Omit to edit the whole image.
   */
  mask?: Blob;
}

/** Successful response from `POST /api/stage`. */
export interface StageResponse {
  id: string;
  /** Data URL, e.g. "data:image/png;base64,....". */
  resultImage: string;
  /** Data URL of the original upload. */
  originalImage: string;
  promptUsed: string;
  mock: boolean;
  /** True when a mask was supplied and the edit was confined to it. */
  maskApplied: boolean;
}

/**
 * Error raised by API helpers when the backend responds with a non-2xx status.
 * `status` is the HTTP status code; `detail` is the human-readable message.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

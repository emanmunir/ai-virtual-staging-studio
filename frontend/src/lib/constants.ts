/**
 * Static UI metadata used as sensible defaults and fallbacks.
 * The authoritative lists come from `GET /api/modes`; these mirror the backend
 * contract so the UI can render immediately and degrade gracefully if the
 * request fails.
 */
import type { Mode, ModeId, Style } from '../types';

/** Modes for which choosing an interior-design style is meaningful. */
export const STYLE_AWARE_MODES: ReadonlySet<ModeId> = new Set<ModeId>([
  'furnish',
  'repaint',
]);

/** Fallback mode list matching the backend contract. */
export const FALLBACK_MODES: readonly Mode[] = [
  {
    id: 'furnish',
    name: 'Furnish',
    description: 'Add tasteful furniture and decor to an empty room.',
  },
  {
    id: 'declutter',
    name: 'Declutter',
    description: 'Remove clutter and depersonalize a lived-in space.',
  },
  {
    id: 'repaint',
    name: 'Repaint',
    description: 'Recolor the walls while keeping the room intact.',
  },
  {
    id: 'dusk',
    name: 'Day to Dusk',
    description: 'Transform an exterior daytime shot into a warm dusk scene.',
  },
];

/** Fallback style list matching the backend contract. */
export const FALLBACK_STYLES: readonly Style[] = [
  { id: 'modern', name: 'Modern', description: 'Clean lines, neutral tones, minimal clutter.' },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light woods, soft textiles, airy and bright.',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Raw materials, metal accents, exposed textures.',
  },
  {
    id: 'midcentury',
    name: 'Mid-century',
    description: 'Warm woods, tapered legs, retro palette.',
  },
  { id: 'coastal', name: 'Coastal', description: 'Breezy blues, natural fibers, relaxed feel.' },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    description: 'Rustic warmth, shiplap, cozy and inviting.',
  },
];

/** Accepted upload MIME types. */
export const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Maximum accepted upload size in bytes (12 MB). */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

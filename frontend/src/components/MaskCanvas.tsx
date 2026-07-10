import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { XIcon } from './icons';

interface MaskCanvasProps {
  /** Preview URL of the uploaded photo to paint over. */
  imageUrl: string;
  disabled?: boolean;
  /**
   * Called whenever the mask changes. Receives a black/white PNG blob (white
   * = region to edit) once at least one stroke has been painted, or `null`
   * once the canvas is cleared / empty.
   */
  onMaskChange: (mask: Blob | null) => void;
}

/** Fixed internal resolution for the exported mask (independent of display size). */
const MASK_WIDTH = 800;
const MASK_HEIGHT = 600;

const MIN_BRUSH = 16;
const MAX_BRUSH = 140;
const DEFAULT_BRUSH = 50;

interface Point {
  x: number;
  y: number;
}

/**
 * Lets the user paint the region a staging edit should be confined to.
 *
 * Internally maintains two same-size canvases: a visible one that shows a
 * translucent terracotta highlight over the painted area (for feedback), and
 * a hidden black/white one that is the actual exported mask (white = paint,
 * black = untouched). They are always drawn to together so they stay in sync.
 */
export function MaskCanvas({ imageUrl, disabled = false, onMaskChange }: MaskCanvasProps) {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH);
  const [hasPainted, setHasPainted] = useState(false);

  // (Re)initialize both canvases whenever the underlying photo changes.
  useEffect(() => {
    const display = displayCanvasRef.current;
    if (display) {
      display.width = MASK_WIDTH;
      display.height = MASK_HEIGHT;
      display.getContext('2d')?.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    }

    const mask = document.createElement('canvas');
    mask.width = MASK_WIDTH;
    mask.height = MASK_HEIGHT;
    const maskCtx = mask.getContext('2d');
    if (maskCtx) {
      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    }
    maskCanvasRef.current = mask;

    setHasPainted(false);
    onMaskChange(null);
    // Only re-run when the photo itself changes; onMaskChange is stable enough
    // in practice and re-running on every parent render would reset strokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  const pointFromEvent = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = displayCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    return {
      x: ((event.clientX - rect.left) / rect.width) * MASK_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * MASK_HEIGHT,
    };
  }, []);

  const paintSegment = useCallback(
    (from: Point | null, to: Point) => {
      const display = displayCanvasRef.current;
      const mask = maskCanvasRef.current;
      if (!display || !mask) {
        return;
      }
      const displayCtx = display.getContext('2d');
      const maskCtx = mask.getContext('2d');
      if (!displayCtx || !maskCtx) {
        return;
      }

      for (const [ctx, strokeStyle] of [
        [displayCtx, 'rgba(196, 90, 58, 0.45)'] as const,
        [maskCtx, '#ffffff'] as const,
      ]) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo((from ?? to).x, (from ?? to).y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        // Round the stroke ends so single taps register as a dot.
        ctx.beginPath();
        ctx.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [brushSize],
  );

  const emitMask = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (!mask) {
      return;
    }
    mask.toBlob((blob) => {
      onMaskChange(blob);
    }, 'image/png');
  }, [onMaskChange]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (disabled) {
        return;
      }
      const point = pointFromEvent(event);
      if (!point) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      paintSegment(null, point);
      setHasPainted(true);
    },
    [disabled, paintSegment, pointFromEvent],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) {
        return;
      }
      const point = pointFromEvent(event);
      if (!point) {
        return;
      }
      paintSegment(lastPointRef.current, point);
      lastPointRef.current = point;
    },
    [paintSegment, pointFromEvent],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) {
      return;
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
    emitMask();
  }, [emitMask]);

  const handleClear = useCallback(() => {
    const display = displayCanvasRef.current;
    const mask = maskCanvasRef.current;
    display?.getContext('2d')?.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    const maskCtx = mask?.getContext('2d');
    if (mask && maskCtx) {
      maskCtx.fillStyle = '#000000';
      maskCtx.fillRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
    }
    setHasPainted(false);
    onMaskChange(null);
  }, [onMaskChange]);

  return (
    <div className="surface overflow-hidden">
      <div className="relative aspect-[4/3] w-full select-none bg-canvas">
        <img
          src={imageUrl}
          alt="Paint the area to edit"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <canvas
          ref={displayCanvasRef}
          className={[
            'absolute inset-0 h-full w-full touch-none',
            disabled ? 'cursor-not-allowed' : 'cursor-crosshair',
          ].join(' ')}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {hasPainted && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="focus-ring absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-600 text-canvas backdrop-blur transition hover:bg-ink disabled:opacity-50"
          >
            <XIcon width={14} height={14} />
            Clear mask
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <label htmlFor="mask-brush-size" className="flex-none text-xs font-600 text-ink-soft">
          Brush size
        </label>
        <input
          id="mask-brush-size"
          type="range"
          min={MIN_BRUSH}
          max={MAX_BRUSH}
          value={brushSize}
          disabled={disabled}
          onChange={(event) => setBrushSize(Number(event.target.value))}
          className="h-1.5 flex-1 accent-terracotta-500 disabled:opacity-50"
        />
        <span className="w-6 flex-none text-right text-xs text-ink-muted">{brushSize}</span>
      </div>
      {!hasPainted && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-ink-muted">
          Paint over the area you want changed — everything else stays untouched.
        </p>
      )}
    </div>
  );
}

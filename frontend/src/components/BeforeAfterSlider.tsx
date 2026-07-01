import { useCallback, useEffect, useRef, useState } from 'react';
import { DragHandleIcon } from './icons';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/**
 * Interactive before/after comparison. A draggable vertical handle wipes
 * between the original (`beforeSrc`) and staged (`afterSrc`) images. The
 * position is driven by an overlaid range input so it is keyboard-accessible.
 *
 * The "before" layer is clipped with `clip-path` (rather than a width change)
 * so the revealed portion never squashes — both images stay pixel-aligned.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [position, setPosition] = useState(50);

  // Track the container width so the clipped "before" image can be sized to it.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    setWidth(node.clientWidth);
    return () => observer.disconnect();
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(Number(event.target.value));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl bg-canvas"
    >
      {/* After image (full, sits underneath). */}
      <img
        src={afterSrc}
        alt="Staged result"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Before image, revealed to the left of the handle via clip-path. */}
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt="Original room"
          draggable={false}
          className="absolute inset-0 h-full max-w-none object-cover"
          style={{ width: width > 0 ? `${width}px` : '100%' }}
        />
      </div>

      {/* Corner labels. */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-600 uppercase tracking-wide text-canvas backdrop-blur">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-terracotta-500/90 px-2.5 py-1 text-xs font-600 uppercase tracking-wide text-canvas backdrop-blur">
        {afterLabel}
      </span>

      {/* Divider line + grip. */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-paper shadow-[0_0_0_1px_rgba(33,29,24,0.15)]"
        style={{ left: `calc(${position}% - 1px)` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink shadow-lift">
          <DragHandleIcon width={18} height={18} />
        </span>
      </div>

      {/* Overlaid, invisible range input drives the position (mouse + keyboard). */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={handleChange}
        aria-label="Reveal staged result. Drag to compare before and after."
        className="comparison-range absolute inset-0 z-20 h-full w-full opacity-0"
      />
    </div>
  );
}

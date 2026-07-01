import { useCallback, useId, useRef, useState, type DragEvent } from 'react';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '../lib/constants';
import { formatBytes } from '../lib/format';
import { ImageIcon, UploadIcon, XIcon } from './icons';

interface DropzoneProps {
  /** Currently selected file, or `null` when empty. */
  file: File | null;
  /** Object URL preview for the selected file, or `null` when empty. */
  previewUrl: string | null;
  /** Called with a validated file, or with an error message string on rejection. */
  onSelect: (file: File) => void;
  onError: (message: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

/** Drag-and-drop + click upload zone with an inline preview and validation. */
export function Dropzone({
  file,
  previewUrl,
  onSelect,
  onError,
  onClear,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const validateAndSelect = useCallback(
    (candidate: File) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(candidate.type)) {
        onError('Unsupported file type. Please upload a JPG, PNG, or WebP image.');
        return;
      }
      if (candidate.size > MAX_UPLOAD_BYTES) {
        onError(`Image is too large (max ${formatBytes(MAX_UPLOAD_BYTES)}).`);
        return;
      }
      onSelect(candidate);
    },
    [onError, onSelect],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) {
        return;
      }
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) {
        validateAndSelect(dropped);
      }
    },
    [disabled, validateAndSelect],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const openFilePicker = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  // Populated preview state.
  if (file && previewUrl) {
    return (
      <div className="surface overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-canvas">
          <img
            src={previewUrl}
            alt={`Preview of ${file.name}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="focus-ring absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-600 text-canvas backdrop-blur transition hover:bg-ink disabled:opacity-50"
          >
            <XIcon width={14} height={14} />
            Remove
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-600">
            <ImageIcon width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-600 text-ink">{file.name}</p>
            <p className="text-xs text-ink-muted">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="focus-ring flex-none rounded-lg border border-line px-3 py-1.5 text-xs font-600 text-ink-soft transition hover:border-ink-muted hover:text-ink disabled:opacity-50"
          >
            Replace
          </button>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (chosen) {
              validateAndSelect(chosen);
            }
            event.target.value = '';
          }}
        />
      </div>
    );
  }

  // Empty state.
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload a room photo"
      onClick={openFilePicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFilePicker();
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      className={[
        'focus-ring group flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition',
        isDragging
          ? 'border-terracotta-400 bg-terracotta-50'
          : 'border-line bg-paper hover:border-terracotta-300 hover:bg-terracotta-50/40',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-14 w-14 items-center justify-center rounded-2xl transition',
          isDragging
            ? 'bg-terracotta-500 text-canvas'
            : 'bg-canvas text-terracotta-600 group-hover:bg-terracotta-100',
        ].join(' ')}
      >
        <UploadIcon width={26} height={26} />
      </span>
      <div>
        <p className="font-display text-lg font-600 text-ink">
          Drop a room photo here
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          or <span className="font-600 text-terracotta-600">browse</span> to
          choose a file
        </p>
      </div>
      <p className="text-xs text-ink-muted">
        JPG, PNG, or WebP · up to {formatBytes(MAX_UPLOAD_BYTES)}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) {
            validateAndSelect(chosen);
          }
          event.target.value = '';
        }}
      />
    </div>
  );
}

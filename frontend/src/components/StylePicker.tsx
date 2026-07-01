import { CheckIcon } from './icons';
import type { Style, StyleId } from '../types';

interface StylePickerProps {
  styles: readonly Style[];
  value: StyleId | null;
  onChange: (style: StyleId) => void;
  disabled?: boolean;
}

/** Chip-based picker for interior-design styles (Furnish / Repaint modes). */
export function StylePicker({ styles, value, onChange, disabled = false }: StylePickerProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-600 text-ink">Design style</legend>
      <div role="radiogroup" aria-label="Design style" className="flex flex-wrap gap-2">
        {styles.map((style) => {
          const selected = style.id === value;
          return (
            <button
              key={style.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={style.description}
              onClick={() => onChange(style.id)}
              className={[
                'focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-500 transition',
                selected
                  ? 'border-terracotta-500 bg-terracotta-500 text-canvas shadow-sm'
                  : 'border-line bg-paper text-ink-soft hover:border-terracotta-300 hover:text-ink',
                disabled ? 'cursor-not-allowed opacity-60' : '',
              ].join(' ')}
            >
              {selected && <CheckIcon width={14} height={14} />}
              {style.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

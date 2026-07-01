import type { Mode, ModeId } from '../types';

interface ModeSelectorProps {
  modes: readonly Mode[];
  value: ModeId;
  onChange: (mode: ModeId) => void;
  disabled?: boolean;
}

/** Card-style selector for the four staging modes. */
export function ModeSelector({ modes, value, onChange, disabled = false }: ModeSelectorProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-600 text-ink">Staging mode</legend>
      <div
        role="radiogroup"
        aria-label="Staging mode"
        className="grid grid-cols-2 gap-2.5"
      >
        {modes.map((mode) => {
          const selected = mode.id === value;
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(mode.id)}
              className={[
                'focus-ring flex flex-col gap-1 rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-ink bg-ink text-canvas shadow-sm'
                  : 'border-line bg-paper text-ink hover:border-ink-muted hover:bg-canvas',
                disabled ? 'cursor-not-allowed opacity-60' : '',
              ].join(' ')}
            >
              <span className="text-sm font-600">{mode.name}</span>
              <span
                className={[
                  'text-xs leading-snug',
                  selected ? 'text-canvas/75' : 'text-ink-muted',
                ].join(' ')}
              >
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

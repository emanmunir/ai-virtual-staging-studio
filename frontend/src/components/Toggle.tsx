import { useId } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Accessible switch-style toggle with a label and optional helper text. */
export function Toggle({ checked, onChange, label, description, disabled = false }: ToggleProps) {
  const labelId = useId();
  const descId = useId();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <span id={labelId} className="text-sm font-600 text-ink">
          {label}
        </span>
        {description && (
          <p id={descId} className="mt-0.5 text-xs text-ink-muted">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'focus-ring relative inline-flex h-6 w-11 flex-none items-center rounded-full transition',
          checked ? 'bg-sage-500' : 'bg-ink-muted/40',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4.5 w-4.5 transform rounded-full bg-paper shadow-sm transition',
            checked ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </button>
    </div>
  );
}

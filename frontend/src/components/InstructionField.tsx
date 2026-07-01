import { useId } from 'react';

interface InstructionFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

/** Optional free-text field for extra staging instructions. */
export function InstructionField({
  value,
  onChange,
  disabled = false,
  maxLength = 400,
}: InstructionFieldProps) {
  const fieldId = useId();

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={fieldId} className="text-sm font-600 text-ink">
          Extra instructions{' '}
          <span className="font-400 text-ink-muted">(optional)</span>
        </label>
        <span className="text-xs tabular-nums text-ink-muted">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        id={fieldId}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder="e.g. Add a large area rug and keep the walls neutral."
        className="focus-ring w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition focus-visible:border-terracotta-300 disabled:opacity-60"
      />
    </div>
  );
}

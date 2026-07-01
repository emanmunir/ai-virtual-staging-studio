import { useState } from 'react';
import { ChevronIcon } from './icons';

interface PromptDetailsProps {
  prompt: string;
}

/** Collapsible panel revealing the exact prompt sent to the provider. */
export function PromptDetails({ prompt }: PromptDetailsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-canvas/60">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left"
      >
        <span className="text-sm font-600 text-ink">Prompt used</span>
        <ChevronIcon
          width={18}
          height={18}
          className={[
            'flex-none text-ink-muted transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-soft">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}

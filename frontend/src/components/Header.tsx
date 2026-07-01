import type { Provider } from '../types';
import { ProviderBadge } from './ProviderBadge';

interface HeaderProps {
  /** Active provider from `/api/health`, or `null` while loading/unavailable. */
  provider: Provider | null;
}

/** Top-of-page product header with name, tagline, and provider status. */
export function Header({ provider }: HeaderProps) {
  return (
    <header className="border-b border-line/70 bg-paper/70 backdrop-blur-sm">
      <div className="container-page flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas shadow-sm"
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
              <path
                d="M7 22V13l9-6 9 6v9a1 1 0 0 1-1 1h-5v-6h-6v6H8a1 1 0 0 1-1-1Z"
                fill="currentColor"
              />
              <circle cx="16" cy="14.5" r="2" fill="#c05a35" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-600 tracking-tight text-ink">
              Virtual Staging Studio
            </p>
            <p className="text-xs font-500 uppercase tracking-[0.18em] text-ink-muted">
              AI staging for real estate
            </p>
          </div>
        </div>
        <ProviderBadge provider={provider} />
      </div>
    </header>
  );
}

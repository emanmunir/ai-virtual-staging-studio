import type { Provider } from '../types';

interface ProviderBadgeProps {
  provider: Provider | null;
}

/**
 * Compact status pill showing which provider is serving requests.
 * Renders a neutral "connecting" state while `provider` is `null`.
 */
export function ProviderBadge({ provider }: ProviderBadgeProps) {
  if (provider === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-500 text-ink-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ink-muted" />
        Connecting…
      </span>
    );
  }

  const isLive = provider === 'gemini';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-600',
        isLive
          ? 'border-sage-300 bg-sage-100 text-sage-600'
          : 'border-terracotta-200 bg-terracotta-50 text-terracotta-700',
      ].join(' ')}
      title={
        isLive
          ? 'Connected to the Gemini image provider.'
          : 'Backend is running in mock mode — results are placeholders.'
      }
    >
      <span
        className={[
          'h-2 w-2 rounded-full',
          isLive ? 'bg-sage-500' : 'bg-terracotta-500',
        ].join(' ')}
      />
      {isLive ? 'Gemini live' : 'Mock mode'}
    </span>
  );
}

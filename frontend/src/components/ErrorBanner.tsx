import { AlertIcon, XIcon } from './icons';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Dismissible error banner shown above the workspace on failure. */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex animate-fade-in-up items-start gap-3 rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-terracotta-800"
    >
      <span className="mt-0.5 flex-none text-terracotta-600">
        <AlertIcon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-600">Something went wrong</p>
        <p className="mt-0.5 break-words text-sm text-terracotta-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="focus-ring flex-none rounded-md p-1 text-terracotta-600 transition hover:bg-terracotta-100"
      >
        <XIcon width={16} height={16} />
      </button>
    </div>
  );
}

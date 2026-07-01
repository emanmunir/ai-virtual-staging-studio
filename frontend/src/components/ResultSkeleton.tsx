interface ResultSkeletonProps {
  /** Status text shown beneath the shimmering placeholder. */
  status: string;
}

/** Loading placeholder shown while a staging request is in flight. */
export function ResultSkeleton({ status }: ResultSkeletonProps) {
  return (
    <section aria-live="polite" aria-busy="true" className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 animate-pulse rounded-lg bg-line" />
        <span className="h-5 w-40 animate-pulse rounded bg-line" />
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-canvas">
        <div className="absolute inset-0 bg-gradient-to-br from-line/60 to-canvas" />
        {/* Shimmer sweep. */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-paper/70 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-ink-muted/30 border-t-terracotta-500"
            role="status"
            aria-label="Staging in progress"
          />
          <p className="text-sm font-500 text-ink-soft">{status}</p>
        </div>
      </div>

      <div className="h-11 w-full animate-pulse rounded-xl bg-line/70" />
    </section>
  );
}

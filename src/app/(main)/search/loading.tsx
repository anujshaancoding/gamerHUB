export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-32 rounded-lg bg-surface-light" />

      {/* Search bar skeleton */}
      <div className="h-12 w-full rounded-xl bg-surface-light" />

      {/* Filter chips skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface-light" />
        ))}
      </div>

      {/* Search results skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="h-12 w-12 rounded-lg bg-surface-light shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-surface-light" />
              <div className="h-3 w-full rounded bg-surface-light" />
              <div className="h-3 w-1/3 rounded bg-surface-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

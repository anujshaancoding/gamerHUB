export default function FindGamersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search/filter bar skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-64 rounded-lg bg-surface-light" />
        <div className="h-10 w-32 rounded-lg bg-surface-light" />
        <div className="h-10 w-32 rounded-lg bg-surface-light" />
      </div>

      {/* Gamer cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-surface-light" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-surface-light" />
                <div className="h-3 w-20 rounded bg-surface-light" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-surface-light" />
              <div className="h-6 w-16 rounded-full bg-surface-light" />
            </div>
            <div className="h-8 w-full rounded-lg bg-surface-light" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClansLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-surface-light" />
        <div className="h-10 w-32 rounded-lg bg-surface-light" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-lg bg-surface-light" />
        <div className="h-10 w-28 rounded-lg bg-surface-light" />
      </div>

      {/* Clan cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-surface-light" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-surface-light" />
                <div className="h-3 w-20 rounded bg-surface-light" />
              </div>
            </div>
            <div className="h-4 w-full rounded bg-surface-light" />
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-surface-light" />
              <div className="h-4 w-16 rounded bg-surface-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

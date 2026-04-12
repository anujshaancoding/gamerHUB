export default function HelpLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-3xl mx-auto">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="h-8 w-40 rounded-lg bg-surface-light mx-auto" />
        <div className="h-4 w-64 rounded bg-surface-light mx-auto" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-11 w-full rounded-lg bg-surface-light" />

      {/* FAQ accordion skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-3/4 rounded bg-surface-light" />
              <div className="h-5 w-5 rounded bg-surface-light shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

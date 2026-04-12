export default function PremiumLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="h-8 w-48 rounded-lg bg-surface-light mx-auto" />
        <div className="h-4 w-72 rounded bg-surface-light mx-auto" />
      </div>

      {/* Pricing cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-6 space-y-5">
            <div className="h-5 w-24 rounded bg-surface-light" />
            <div className="h-10 w-28 rounded bg-surface-light" />
            <div className="h-4 w-full rounded bg-surface-light" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-surface-light shrink-0" />
                  <div className="h-3 w-full rounded bg-surface-light" />
                </div>
              ))}
            </div>
            <div className="h-11 w-full rounded-lg bg-surface-light" />
          </div>
        ))}
      </div>
    </div>
  );
}

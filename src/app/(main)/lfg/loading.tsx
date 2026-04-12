export default function LFGLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-52 rounded-lg bg-surface-light" />
        <div className="h-10 w-32 rounded-lg bg-surface-light" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-surface-light" />
        ))}
      </div>

      {/* LFG post list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-light" />
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded bg-surface-light" />
                  <div className="h-3 w-20 rounded bg-surface-light" />
                </div>
              </div>
              <div className="h-7 w-16 rounded-full bg-surface-light" />
            </div>
            <div className="h-4 w-full rounded bg-surface-light" />
            <div className="h-4 w-1/2 rounded bg-surface-light" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-6 w-16 rounded-full bg-surface-light" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

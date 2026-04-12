export default function UpdatesLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-3xl mx-auto">
      {/* Header skeleton */}
      <div className="h-8 w-44 rounded-lg bg-surface-light" />

      {/* Timeline skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div className="h-4 w-4 rounded-full bg-surface-light shrink-0" />
              <div className="w-0.5 flex-1 bg-surface-light" />
            </div>
            {/* Content card */}
            <div className="flex-1 rounded-xl border border-border bg-surface p-5 space-y-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 rounded-full bg-surface-light" />
                <div className="h-3 w-24 rounded bg-surface-light" />
              </div>
              <div className="h-5 w-48 rounded bg-surface-light" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-surface-light" />
                <div className="h-4 w-3/4 rounded bg-surface-light" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded-lg bg-surface-light" />

      {/* Category tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-surface-light" />
        ))}
      </div>

      {/* Featured card skeleton */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="h-52 w-full bg-surface-light" />
        <div className="p-5 space-y-3">
          <div className="h-6 w-3/4 rounded bg-surface-light" />
          <div className="h-4 w-full rounded bg-surface-light" />
          <div className="h-4 w-1/2 rounded bg-surface-light" />
        </div>
      </div>

      {/* News cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="h-36 w-full bg-surface-light" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-full rounded bg-surface-light" />
              <div className="h-4 w-2/3 rounded bg-surface-light" />
              <div className="h-3 w-20 rounded bg-surface-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

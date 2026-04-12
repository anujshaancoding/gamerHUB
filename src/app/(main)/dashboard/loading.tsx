export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome header skeleton */}
      <div className="h-8 w-56 rounded-lg bg-surface-light" />
      <div className="h-4 w-80 rounded bg-surface-light" />

      {/* Stats cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="h-4 w-20 rounded bg-surface-light" />
            <div className="h-8 w-16 rounded bg-surface-light" />
          </div>
        ))}
      </div>

      {/* Content cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="h-5 w-36 rounded bg-surface-light" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-surface-light" />
              <div className="h-4 w-3/4 rounded bg-surface-light" />
              <div className="h-4 w-1/2 rounded bg-surface-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

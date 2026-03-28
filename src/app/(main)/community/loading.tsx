export default function CommunityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-surface-light" />
        ))}
      </div>

      {/* Post cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-light" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-surface-light" />
              <div className="h-3 w-20 rounded bg-surface-light" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-surface-light" />
            <div className="h-4 w-3/4 rounded bg-surface-light" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded bg-surface-light" />
            <div className="h-4 w-16 rounded bg-surface-light" />
          </div>
        </div>
      ))}
    </div>
  );
}

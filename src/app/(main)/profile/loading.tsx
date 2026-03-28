export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-48 rounded-xl bg-surface-light" />

      {/* Profile header skeleton */}
      <div className="flex items-end gap-4 -mt-12 px-4">
        <div className="h-24 w-24 rounded-full bg-surface-light border-4 border-background" />
        <div className="space-y-2 pb-2">
          <div className="h-6 w-40 rounded bg-surface-light" />
          <div className="h-4 w-24 rounded bg-surface-light" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="flex gap-6 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1 text-center">
            <div className="h-5 w-8 rounded bg-surface-light mx-auto" />
            <div className="h-3 w-14 rounded bg-surface-light" />
          </div>
        ))}
      </div>

      {/* Content tabs skeleton */}
      <div className="flex gap-2 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-surface-light" />
        ))}
      </div>

      {/* Content area */}
      <div className="px-4 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="h-4 w-full rounded bg-surface-light" />
            <div className="h-4 w-2/3 rounded bg-surface-light" />
          </div>
        ))}
      </div>
    </div>
  );
}

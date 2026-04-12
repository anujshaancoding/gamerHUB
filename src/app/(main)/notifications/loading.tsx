export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 rounded-lg bg-surface-light" />
        <div className="h-8 w-28 rounded-lg bg-surface-light" />
      </div>

      {/* Notification list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <div className="h-10 w-10 rounded-full bg-surface-light shrink-0" />
            <div className="flex-1 space-y-2">
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

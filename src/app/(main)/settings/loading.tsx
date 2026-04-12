export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      {/* Header skeleton */}
      <div className="h-8 w-36 rounded-lg bg-surface-light" />

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <div className="h-5 w-40 rounded bg-surface-light" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-24 rounded bg-surface-light" />
                <div className="h-10 w-full rounded-lg bg-surface-light" />
              </div>
            ))}
          </div>
          <div className="h-10 w-32 rounded-lg bg-surface-light" />
        </div>
      ))}
    </div>
  );
}

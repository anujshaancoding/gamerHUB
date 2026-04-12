export default function WriteLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="h-8 w-40 rounded-lg bg-surface-light" />

      {/* Title input skeleton */}
      <div className="h-12 w-full rounded-lg bg-surface-light" />

      {/* Toolbar skeleton */}
      <div className="flex gap-2 p-2 rounded-lg border border-border bg-surface">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-8 rounded bg-surface-light" />
        ))}
      </div>

      {/* Editor body skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6 min-h-[400px] space-y-3">
        <div className="h-4 w-full rounded bg-surface-light" />
        <div className="h-4 w-5/6 rounded bg-surface-light" />
        <div className="h-4 w-full rounded bg-surface-light" />
        <div className="h-4 w-3/4 rounded bg-surface-light" />
        <div className="h-4 w-full rounded bg-surface-light" />
        <div className="h-4 w-2/3 rounded bg-surface-light" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-end gap-3">
        <div className="h-10 w-28 rounded-lg bg-surface-light" />
        <div className="h-10 w-28 rounded-lg bg-surface-light" />
      </div>
    </div>
  );
}

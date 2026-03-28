export default function BlogLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="h-8 w-64 rounded bg-surface-light mx-auto" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-light mx-auto" />
      </div>

      {/* Category filters */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface-light" />
        ))}
      </div>

      {/* Blog post cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="h-44 bg-surface-light" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-16 rounded-full bg-surface-light" />
              <div className="h-5 w-full rounded bg-surface-light" />
              <div className="h-4 w-3/4 rounded bg-surface-light" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-surface-light" />
                <div className="h-3 w-24 rounded bg-surface-light" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-5rem)] animate-pulse">
      {/* Conversation list skeleton */}
      <div className="w-full md:w-80 border-r border-border space-y-1 p-3">
        <div className="h-10 rounded-lg bg-surface-light mb-3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-surface-light shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-surface-light" />
              <div className="h-3 w-40 rounded bg-surface-light" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area skeleton (hidden on mobile) */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-surface-light mx-auto" />
          <div className="h-4 w-48 rounded bg-surface-light mx-auto" />
        </div>
      </div>
    </div>
  );
}

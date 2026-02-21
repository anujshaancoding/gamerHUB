export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-surface-light" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

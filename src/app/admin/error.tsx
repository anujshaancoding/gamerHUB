"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="p-4 rounded-full bg-error/10 border border-error/20">
        <AlertTriangle className="w-10 h-10 text-error" />
      </div>
      <h2 className="text-xl font-bold text-red-400">Admin Panel Error</h2>
      <p className="text-text-muted">Something went wrong in the admin panel.</p>
      {error.digest && (
        <p className="text-sm text-text-muted/40 font-mono">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

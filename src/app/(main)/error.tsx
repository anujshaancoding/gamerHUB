"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="p-4 rounded-full bg-error/10 border border-error/20 mb-6">
        <AlertTriangle className="w-10 h-10 text-error" />
      </div>

      <h2 className="text-2xl font-bold text-text mb-2">Something went wrong</h2>
      <p className="text-text-muted mb-6 max-w-md">
        This page encountered an error. Your data is safe &mdash; try refreshing or go back.
      </p>

      <div className="flex items-center gap-3">
        <Button
          onClick={reset}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Try Again
        </Button>
        <Link href="/community">
          <Button
            variant="outline"
            leftIcon={<Home className="w-4 h-4" />}
          >
            Back to Community
          </Button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-text-muted/40">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}

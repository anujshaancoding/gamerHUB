"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto animate-[fadeSlideDown_400ms_ease-out]">
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-error/10 border border-error/20">
            <AlertTriangle className="w-16 h-16 text-error" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-text mb-3">Connection Lost</h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          Something went wrong on our end. Don&apos;t worry &mdash; your progress is safe. Let&apos;s
          try reconnecting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={reset}
            className="bg-primary text-black font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Lobby
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-text-muted/40">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

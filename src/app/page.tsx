"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Logged in users go to community
      router.replace("/community");
    } else {
      // Check if first time visitor
      const hasVisited = localStorage.getItem("gamerhub_visited");
      if (!hasVisited) {
        // First time visitor - show onboarding
        localStorage.setItem("gamerhub_visited", "true");
        router.replace("/onboard");
      } else {
        // Returning visitor but not logged in - go to community (limited access)
        router.replace("/community");
      }
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-text-muted">Loading...</p>
      </div>
    </div>
  );
}

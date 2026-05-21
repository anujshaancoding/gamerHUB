"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function MyProfileRedirect() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (profile?.username) {
      router.replace(`/profile/${profile.username}`);
    } else {
      // Guest (no session) — don't spin forever, send to login.
      router.replace("/login?redirect=/profile");
    }
  }, [loading, profile, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

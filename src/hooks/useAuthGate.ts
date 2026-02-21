"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

// Routes that guests can access without showing the auth gate
const GUEST_ALLOWED_ROUTES = [
  "/community",
  "/login",
  "/register",
  "/onboarding",
  "/offline",
  "/overview",
  "/",
];

// Check if a path is allowed for guests
function isGuestAllowed(pathname: string): boolean {
  return GUEST_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function useAuthGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [showAuthGate, setShowAuthGate] = useState(false);

  useEffect(() => {
    // Don't show gate while loading
    if (loading) {
      setShowAuthGate(false);
      return;
    }

    // If user is authenticated, never show the gate
    if (user) {
      setShowAuthGate(false);
      return;
    }

    // Check if current route is allowed for guests
    const guestAllowed = isGuestAllowed(pathname);

    // Show auth gate if user is not authenticated and route is not guest-allowed
    setShowAuthGate(!guestAllowed);
  }, [user, loading, pathname]);

  return {
    showAuthGate,
    isAuthenticated: !!user,
    isLoading: loading,
    currentPath: pathname,
    closeAuthGate: () => setShowAuthGate(false),
  };
}

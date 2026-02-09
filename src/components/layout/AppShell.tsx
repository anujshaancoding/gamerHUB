"use client";

import { usePathname } from "next/navigation";
import { RightSidebar } from "./RightSidebar";

// Pages where sidebar should be hidden
const HIDDEN_SIDEBAR_ROUTES = [
  "/onboard",
  "/login",
  "/register",
  "/auth",
  "/forgot-password",
  "/reset-password",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route should hide the sidebar
  const shouldHideSidebar = HIDDEN_SIDEBAR_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="xl:mr-72">{children}</div>
      <RightSidebar />
    </>
  );
}

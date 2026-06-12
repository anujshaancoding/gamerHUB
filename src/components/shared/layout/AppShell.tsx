"use client";

// AppShell previously mounted the Phase-3 social right rail (activity feed,
// friends list, mini chat) and the direct-message notifier. Those features
// are frozen for V2 (see V2-PLAN.md: "keep code, remove from nav"). The
// RightSidebar / MessageNotifier components still exist but are no longer
// surfaced, so AppShell is now a passthrough. Kept as a component so the
// layout import and the re-mount point survive for Phase 3.

export function AppShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

"use client";

import { useAuthGate } from "@/hooks/useAuthGate";
import { AuthGateModal } from "./auth-gate-modal";

interface AuthGateProviderProps {
  children: React.ReactNode;
}

// V2: the global guest auth-gate overlay is disabled for now. ggLobby V2 is
// content-led — guests must be able to browse everything freely. Flip this
// back to `true` to re-enable the site-wide sign-up gate.
const AUTH_GATE_ENABLED = false;

export function AuthGateProvider({ children }: AuthGateProviderProps) {
  const { showAuthGate, currentPath, closeAuthGate } = useAuthGate();

  return (
    <>
      {children}
      {AUTH_GATE_ENABLED && (
        <AuthGateModal
          isOpen={showAuthGate}
          onClose={closeAuthGate}
          redirectTo={currentPath}
        />
      )}
    </>
  );
}

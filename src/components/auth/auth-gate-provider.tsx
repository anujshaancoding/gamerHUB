"use client";

import { useAuthGate } from "@/hooks/useAuthGate";
import { AuthGateModal } from "./auth-gate-modal";

interface AuthGateProviderProps {
  children: React.ReactNode;
}

export function AuthGateProvider({ children }: AuthGateProviderProps) {
  const { showAuthGate, currentPath, closeAuthGate } = useAuthGate();

  return (
    <>
      {children}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={closeAuthGate}
        redirectTo={currentPath}
      />
    </>
  );
}

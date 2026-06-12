"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGateModal } from "./auth-gate-modal";
import { CTA_SOURCES, type CtaSource } from "@/lib/analytics/sources";

// V2: the global guest auth-gate overlay (route-level wall) stays disabled.
// ggLobby V2 is content-led — guests browse everything freely. The gate is now
// triggered IMPERATIVELY, per high-intent action (apply to LFG, add friend,
// react/comment), via `useActionGate().openAuthGate(...)`.

interface OpenAuthGateOptions {
  /** Contextual heading copy, e.g. "Sign up to apply to this lobby". */
  reason?: string;
  /** Discovery surface for cta_click attribution. */
  source?: CtaSource;
  /** Where to send the user after signup; defaults to the current path. */
  redirectTo?: string;
}

interface AuthGateContextValue {
  /** Open the just-in-time signup modal for a gated action. */
  openAuthGate: (options?: OpenAuthGateOptions) => void;
  /** Close the modal. */
  closeAuthGate: () => void;
  /** Whether the modal is currently open. */
  isOpen: boolean;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

interface AuthGateProviderProps {
  children: React.ReactNode;
}

export function AuthGateProvider({ children }: AuthGateProviderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<OpenAuthGateOptions>({});

  const openAuthGate = useCallback((options: OpenAuthGateOptions = {}) => {
    setOpts(options);
    setIsOpen(true);
  }, []);

  const closeAuthGate = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo<AuthGateContextValue>(
    () => ({ openAuthGate, closeAuthGate, isOpen }),
    [openAuthGate, closeAuthGate, isOpen]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthGateModal
        isOpen={isOpen}
        onClose={closeAuthGate}
        reason={opts.reason}
        source={opts.source ?? CTA_SOURCES.gate_modal}
        redirectTo={opts.redirectTo ?? pathname}
      />
    </AuthGateContext.Provider>
  );
}

/**
 * Access the imperative just-in-time auth gate. Call `openAuthGate({ reason,
 * source })` from any high-intent guest action to show the contextual signup
 * modal and fire the cta_click funnel event.
 *
 * Returns a no-op safe fallback when used outside the provider so call sites
 * never crash in tests / isolated renders.
 */
export function useActionGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    return {
      openAuthGate: () => {},
      closeAuthGate: () => {},
      isOpen: false,
    };
  }
  return ctx;
}

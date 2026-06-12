"use client";

import { Fragment, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Gamepad2, Users, Trophy, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES, type CtaSource } from "@/lib/analytics/sources";

interface AuthGateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  redirectTo?: string;
  /** Discovery surface that opened this gate — drives cta_click attribution. */
  source?: CtaSource;
  /**
   * Contextual, action-specific copy shown as the modal heading, e.g.
   * "Sign up to apply to this lobby". When omitted, falls back to the
   * generic "Join the Gaming Community" headline.
   */
  reason?: string;
}

export function AuthGateModal({
  isOpen,
  onClose,
  redirectTo,
  source = CTA_SOURCES.gate_modal,
  reason,
}: AuthGateModalProps) {
  const router = useRouter();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  const handleSignUp = () => {
    // Funnel: record deliberate signup intent + the surface that drove it.
    trackCtaClick(source);
    const params = new URLSearchParams();
    if (redirectTo) {
      params.set("redirect", redirectTo);
    }
    router.push(`/register${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSignIn = () => {
    const params = new URLSearchParams();
    if (redirectTo) {
      params.set("redirect", redirectTo);
    }
    router.push(`/login${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleGoToCommunity = () => {
    router.push("/agents");
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={reason || "Join the Gaming Community"}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-surface via-surface to-surface/90 border border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title — contextual when a reason is passed */}
                <h2 className="text-2xl font-bold text-center text-text mb-2">
                  {reason || "Join the Gaming Community"}
                </h2>
                <p className="text-center text-text-muted mb-6">
                  {reason
                    ? "Create your free ggLobby account — it only takes a few seconds."
                    : "Sign up to unlock all features and connect with gamers worldwide"}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <FeatureItem
                    icon={<Users className="w-5 h-5" />}
                    text="Find teammates and build your squad"
                  />
                  <FeatureItem
                    icon={<Gamepad2 className="w-5 h-5" />}
                    text="Track your gaming stats and progress"
                  />
                  <FeatureItem
                    icon={<Trophy className="w-5 h-5" />}
                    text="Join tournaments and win rewards"
                  />
                  <FeatureItem
                    icon={<MessageCircle className="w-5 h-5" />}
                    text="Chat with friends and join communities"
                  />
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSignUp}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={handleSignIn}
                    variant="outline"
                    className="w-full h-12 text-base font-semibold"
                  >
                    Sign In
                  </Button>
                </div>

                {/* Community link */}
                <div className="mt-6 text-center">
                  <button
                    onClick={onClose || handleGoToCommunity}
                    className="text-sm text-text-muted hover:text-primary transition-colors"
                  >
                    Continue browsing as guest
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-text-muted">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

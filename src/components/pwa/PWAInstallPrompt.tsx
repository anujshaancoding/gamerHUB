'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import Image from 'next/image';
import { usePWA } from './PWAProvider';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, installApp, dismissPrompt, isDismissed } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay showing the prompt so it doesn't appear immediately on page load
    if (isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
    setShow(false);
  }, [isInstallable, isInstalled, isDismissed]);

  if (!show) return null;

  const handleInstall = async () => {
    await installApp();
    setShow(false);
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border border-primary/20 bg-surface/95 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-primary/10 p-2">
            <Image
              src="/icons/icon-96x96.png"
              alt="ggLobby"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-text text-sm">Install ggLobby</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Add to your home screen for the best experience
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 text-text-muted hover:bg-surface-light hover:text-text-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-light/80 px-3 py-2 text-xs text-text-secondary">
                <span>Tap</span>
                <Share className="h-3.5 w-3.5 text-primary" />
                <span>then</span>
                <span className="inline-flex items-center gap-1 font-medium text-text">
                  <Plus className="h-3.5 w-3.5" /> Add to Home Screen
                </span>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-light transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-background hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

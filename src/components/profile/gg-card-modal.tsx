"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Share2,
  Loader2,
  Sparkles,
  Link2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { generateGGCard, downloadGGCard, type GGCardData } from "@/lib/gg-card";

interface GGCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: GGCardData;
}

export function GGCardModal({ isOpen, onClose, cardData }: GGCardModalProps) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);
  const blobRef = useRef<string | null>(null);

  // Generate card when modal opens
  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      await document.fonts.ready;
      const blob = await generateGGCard(cardData);
      setCardBlob(blob);
      // Revoke previous URL
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      console.error("[gg-card] Generation failed:", err);
      toast.error("Failed to generate GG Card");
    } finally {
      setGenerating(false);
    }
  }, [cardData]);

  useEffect(() => {
    if (isOpen) {
      generate();
    }
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [isOpen, generate]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (!cardBlob) return;
    downloadGGCard(cardBlob, cardData.username);
    toast.success("GG Card downloaded!");
  };

  const handleShare = async () => {
    if (!cardBlob) return;

    const file = new File([cardBlob], `${cardData.username}-gg-card.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `${cardData.displayName || cardData.username}'s GG Card`,
          text: `Check out my gamer profile on ggLobby! 🎮`,
          files: [file],
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback: copy profile link
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    const url = `https://gglobby.in/profile/${cardData.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const profileUrl = `https://gglobby.in/profile/${cardData.username}`;
  const shareText = encodeURIComponent(
    `Check out my gamer profile on ggLobby! 🎮 ${profileUrl}`
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-surface/95 backdrop-blur-md rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-text">Your GG Card</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Card Preview */}
            <div className="p-5">
              <div className="relative w-full rounded-xl overflow-hidden bg-black/30 border border-white/[0.06]">
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-text-muted">
                      Generating your GG Card...
                    </p>
                  </div>
                ) : previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Your GG Card"
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <p className="text-sm text-text-muted">
                      Failed to generate card
                    </p>
                    <button
                      onClick={generate}
                      className="text-sm text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={handleDownload}
                  disabled={!cardBlob || generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  disabled={!cardBlob || generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {/* Social Share Links */}
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-text-dim mb-3 text-center">
                  Share on your favorite platform
                </p>
                <div className="flex items-center justify-center gap-2">
                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors group"
                    title="Copy Link"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Link2 className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
                    )}
                  </button>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${shareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#25D366]/10 border border-white/[0.06] transition-colors group"
                    title="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-text-secondary group-hover:text-[#25D366] transition-colors">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors group"
                    title="X (Twitter)"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-text-secondary group-hover:text-text transition-colors">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* Instagram (copy for story) */}
                  <button
                    onClick={() => {
                      handleDownload();
                      toast.success("Card downloaded! Share it on your Instagram Story");
                    }}
                    disabled={!cardBlob}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#E4405F]/10 border border-white/[0.06] transition-colors group disabled:opacity-40"
                    title="Instagram (downloads card)"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-text-secondary group-hover:text-[#E4405F] transition-colors">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </button>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(`Check out my gamer profile on ggLobby! 🎮`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#0088cc]/10 border border-white/[0.06] transition-colors group"
                    title="Telegram"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-text-secondary group-hover:text-[#0088cc] transition-colors">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Tip */}
              <p className="text-xs text-text-dim text-center mt-4">
                Tip: Download and share on Instagram Stories for maximum reach!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

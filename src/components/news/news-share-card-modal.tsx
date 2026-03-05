"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Share2, Loader2, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SocialShareButtons } from "@/components/blog/social-share-buttons";
import {
  generateAllNewsShareCards,
  downloadBlob,
  downloadAllNewsCards,
  type NewsShareCardSet,
} from "@/lib/news-share-cards";
import type { NewsArticle } from "@/types/news";

interface NewsShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle;
  articleUrl: string;
}

const CARD_LABELS = ["Hero", "Summary", "CTA"] as const;
const CARD_KEYS = ["hero", "summary", "cta"] as const;

export function NewsShareCardModal({
  isOpen,
  onClose,
  article,
  articleUrl,
}: NewsShareCardModalProps) {
  const [cards, setCards] = useState<NewsShareCardSet | null>(null);
  const [previews, setPreviews] = useState<Record<string, string> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!isOpen) return;
    setCards(null);
    setPreviews(null);
    setError(null);
    setIsGenerating(true);
    setActiveCard(0);

    generateAllNewsShareCards(article, articleUrl)
      .then((set) => {
        setCards(set);
        setPreviews({
          hero: URL.createObjectURL(set.hero),
          summary: URL.createObjectURL(set.summary),
          cta: URL.createObjectURL(set.cta),
        });
      })
      .catch((err) => {
        console.error("Failed to generate news share cards:", err);
        setError("Failed to generate cards. Please try again.");
      })
      .finally(() => setIsGenerating(false));
  }, [isOpen, article, articleUrl]);

  useEffect(() => {
    return () => {
      if (previews) {
        Object.values(previews).forEach(URL.revokeObjectURL);
      }
    };
  }, [previews]);

  const handleDownloadSingle = useCallback(
    (idx: 0 | 1 | 2) => {
      if (!cards) return;
      downloadBlob(cards[CARD_KEYS[idx]], `news-${article.id}-${CARD_KEYS[idx]}.png`);
    },
    [cards, article.id],
  );

  const handleDownloadAll = useCallback(() => {
    if (!cards) return;
    downloadAllNewsCards(cards, article.id);
  }, [cards, article.id]);

  const handleNativeShare = useCallback(
    async (idx: 0 | 1 | 2) => {
      if (!cards) return;
      const key = CARD_KEYS[idx];
      const file = new File([cards[key]], `news-${article.id}-${key}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: article.title,
            text: `Check out "${article.title}" on ggLobby`,
            url: articleUrl,
            files: [file],
          });
        } catch (e) {
          if (e instanceof Error && e.name !== "AbortError") {
            console.error("Share failed:", e);
          }
        }
      }
    },
    [cards, article, articleUrl],
  );

  const canNativeShare =
    typeof navigator !== "undefined" && !!navigator.canShare;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Share as Cards
        </span>
      }
      description="Download or share beautiful image cards for this news article"
      size="xl"
    >
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-text-muted text-sm">Generating cards...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : previews ? (
        <div className="space-y-4">
          {/* Card tabs */}
          <div className="flex gap-2">
            {CARD_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveCard(i as 0 | 1 | 2)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCard === i
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-surface-light text-text-muted hover:text-text"
                }`}
              >
                Card {i + 1}: {label}
              </button>
            ))}
          </div>

          {/* Active card preview */}
          <div className="relative rounded-xl overflow-hidden border border-border bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previews[CARD_KEYS[activeCard]]}
              alt={`${CARD_LABELS[activeCard]} card preview`}
              className="w-full h-auto"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSingle(activeCard)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download This Card
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAll}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download All 3
            </Button>

            {canNativeShare && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleNativeShare(activeCard)}
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Share Image
              </Button>
            )}
          </div>

          {/* Social sharing links */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-dim mb-2 uppercase tracking-wider font-medium">
              Share article link
            </p>
            <SocialShareButtons
              url={articleUrl}
              title={article.title}
              description={article.excerpt || undefined}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

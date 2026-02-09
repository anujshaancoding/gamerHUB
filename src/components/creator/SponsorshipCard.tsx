"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  Calendar,
  Check,
  X,
  Loader2,
  ExternalLink,
  Gift,
  DollarSign,
  Percent,
  Tag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSponsorships } from "@/lib/hooks/useCreatorProfile";
import {
  SPONSORSHIP_CATEGORIES,
  type SponsorshipCategory,
  type SponsorshipWithBrand,
  type ApplySponsorshipRequest,
} from "@/types/creator";

interface SponsorshipCardProps {
  sponsorship: SponsorshipWithBrand;
  onApply: () => void;
}

export function SponsorshipCard({ sponsorship, onApply }: SponsorshipCardProps) {
  const categoryInfo = SPONSORSHIP_CATEGORIES[sponsorship.category as SponsorshipCategory];
  const deadline = sponsorship.application_deadline
    ? new Date(sponsorship.application_deadline)
    : null;
  const isExpired = deadline && deadline < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Brand Logo */}
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {sponsorship.brand_logo ? (
              <img
                src={sponsorship.brand_logo}
                alt={sponsorship.brand_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{sponsorship.title}</h3>
              {sponsorship.user_applied && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    sponsorship.user_application_status === "accepted"
                      ? "bg-green-500/10 text-green-500"
                      : sponsorship.user_application_status === "rejected"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {sponsorship.user_application_status === "accepted"
                    ? "Accepted"
                    : sponsorship.user_application_status === "rejected"
                    ? "Rejected"
                    : "Applied"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{sponsorship.brand_name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full">
                <Tag className="h-3 w-3" />
                {categoryInfo?.name || sponsorship.category}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {sponsorship.min_followers.toLocaleString()}+ followers
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {sponsorship.description && (
          <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
            {sponsorship.description}
          </p>
        )}

        {/* Benefits */}
        {sponsorship.benefits && (
          <div className="mt-4 space-y-2">
            {(sponsorship.benefits as any).compensation && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>{(sponsorship.benefits as any).compensation}</span>
              </div>
            )}
            {(sponsorship.benefits as any).products?.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-purple-500" />
                <span>Free products included</span>
              </div>
            )}
            {(sponsorship.benefits as any).affiliatePercentage && (
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4 text-blue-500" />
                <span>
                  {(sponsorship.benefits as any).affiliatePercentage}% affiliate commission
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
        {deadline && (
          <div
            className={`flex items-center gap-2 text-sm ${
              isExpired ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            {isExpired ? (
              <span>Deadline passed</span>
            ) : (
              <span>
                Apply by{" "}
                {deadline.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        )}

        {!sponsorship.user_applied && !isExpired && (
          <Button onClick={onApply} size="sm">
            Apply Now
          </Button>
        )}

        {sponsorship.user_applied &&
          sponsorship.user_application_status === "pending" && (
            <span className="text-sm text-muted-foreground">
              Application under review
            </span>
          )}
      </div>
    </motion.div>
  );
}

// Sponsorship List Component
interface SponsorshipListProps {
  category?: SponsorshipCategory;
}

export function SponsorshipList({ category }: SponsorshipListProps) {
  const [page, setPage] = useState(1);
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipWithBrand | null>(null);

  const {
    sponsorships,
    total,
    totalPages,
    eligibility,
    isLoading,
    error,
    applyToSponsorship,
    isApplying,
  } = useSponsorships({ category, page });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-card animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check if it's a tier eligibility error
    if (errorMessage.includes("Gold tier")) {
      return (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Gold Tier Required</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sponsorship opportunities are available to Gold tier creators and above.
            Keep growing your audience to unlock this feature!
          </p>
          {eligibility && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Current tier: <span className="font-medium">{eligibility.tier}</span>
              </p>
              <p>
                Followers: <span className="font-medium">{eligibility.followerCount}</span>
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Unable to Load Sponsorships</h3>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  if (sponsorships.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Sponsorships Available</h3>
        <p className="text-muted-foreground">
          Check back later for new brand partnership opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sponsorship Cards */}
      <div className="space-y-4">
        {sponsorships.map((sponsorship) => (
          <SponsorshipCard
            key={sponsorship.id}
            sponsorship={sponsorship}
            onApply={() => setSelectedSponsorship(sponsorship)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Apply Modal */}
      {selectedSponsorship && (
        <ApplyModal
          sponsorship={selectedSponsorship}
          onClose={() => setSelectedSponsorship(null)}
          onApply={async (request) => {
            await applyToSponsorship(selectedSponsorship.id, request);
            setSelectedSponsorship(null);
          }}
          isApplying={isApplying}
        />
      )}
    </div>
  );
}

// Apply Modal
interface ApplyModalProps {
  sponsorship: SponsorshipWithBrand;
  onClose: () => void;
  onApply: (request: ApplySponsorshipRequest) => Promise<void>;
  isApplying: boolean;
}

function ApplyModal({ sponsorship, onClose, onApply, isApplying }: ApplyModalProps) {
  const [pitch, setPitch] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [deliverables, setDeliverables] = useState("");

  const handleSubmit = async () => {
    await onApply({
      pitch,
      portfolio_urls: portfolioUrl ? [portfolioUrl] : [],
      expected_deliverables: deliverables || undefined,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Apply for Sponsorship</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sponsorship.brand_name} - {sponsorship.title}
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Pitch <span className="text-red-500">*</span>
              </label>
              <textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Tell the brand why you'd be a great fit for this partnership..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 50 characters ({pitch.length}/50)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Portfolio/Content Link
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                What can you deliver?
              </label>
              <textarea
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g., 2 YouTube videos, 5 TikToks, 10 stream mentions..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={pitch.length < 50 || isApplying}
            >
              {isApplying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Application
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Category Filter
interface CategoryFilterProps {
  selected: SponsorshipCategory | null;
  onSelect: (category: SponsorshipCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {Object.entries(SPONSORSHIP_CATEGORIES).map(([key, { name }]) => (
        <Button
          key={key}
          variant={selected === key ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(key as SponsorshipCategory)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}

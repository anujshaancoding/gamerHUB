"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Poll, PollOption } from "@/types/community";

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  isVoting?: boolean;
}

export function PollCard({ poll, onVote, isVoting }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    poll.user_votes || []
  );
  const hasVoted = poll.user_votes && poll.user_votes.length > 0;
  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const showResults = hasVoted || isExpired || !poll.is_active;

  const handleOptionClick = (optionId: string) => {
    if (showResults || !poll.is_active) return;

    if (poll.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote?.(selectedOptions);
    }
  };

  const getPercentage = (option: PollOption) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((option.vote_count / poll.total_votes) * 100);
  };

  const getTimeRemaining = () => {
    if (!poll.ends_at) return null;
    const ends = new Date(poll.ends_at);
    const now = new Date();
    const diff = ends.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return "< 1h left";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{poll.question}</h3>
            {poll.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {poll.description}
              </p>
            )}
          </div>
          {poll.game && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {poll.game.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}
          </span>
          {getTimeRemaining() && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeRemaining()}
            </span>
          )}
          {poll.allow_multiple && (
            <span className="text-primary">Multiple choice</span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="p-4 space-y-2">
        {poll.options?.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const userVotedFor = poll.user_votes?.includes(option.id);
          const percentage = getPercentage(option);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={showResults || !poll.is_active}
              className={`relative w-full text-left p-3 rounded-lg border transition-all ${
                isSelected && !showResults
                  ? "border-primary bg-primary/5"
                  : showResults
                  ? "border-border"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Progress Bar (when showing results) */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute inset-0 rounded-lg ${
                    userVotedFor ? "bg-primary/20" : "bg-muted"
                  }`}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Checkbox/Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-${
                      poll.allow_multiple ? "md" : "full"
                    } border flex items-center justify-center flex-shrink-0 ${
                      isSelected || userVotedFor
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {(isSelected || userVotedFor) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>

                  {/* Option image */}
                  {option.image_url && (
                    <img
                      src={option.image_url}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}

                  <span className="font-medium">{option.option_text}</span>
                </div>

                {/* Percentage */}
                {showResults && (
                  <span className="text-sm font-medium">{percentage}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Button */}
      {!showResults && poll.is_active && (
        <div className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isVoting}
          >
            {isVoting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Vote"
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {poll.creator?.avatar_url ? (
            <img
              src={poll.creator.avatar_url}
              alt={poll.creator.username}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-muted" />
          )}
          <span>{poll.creator?.username}</span>
        </div>
        {poll.is_anonymous && <span>Anonymous voting</span>}
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ChevronRight, UserPlus } from "lucide-react";
import { HorizontalScroll, Card, Button } from "@/components/ui";
import { SuggestionCard } from "./suggestion-card";
import { useSuggestions } from "@/lib/hooks/useSuggestions";
import { useAuth } from "@/lib/hooks/useAuth";

interface SuggestedFriendsSectionProps {
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SuggestedFriendsSection({ className, isExpanded, onToggleExpand }: SuggestedFriendsSectionProps) {
  const { user } = useAuth();
  const { allSuggestions, loading, refetch } = useSuggestions({
    limit: 10,
    enabled: !!user,
  });
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAddFriend = (userId: string) => {
    setAddedIds((prev) => new Set([...prev, userId]));
    // Optionally refetch after a delay
    setTimeout(() => refetch(), 1000);
  };

  // Filter out users that have been added
  const visibleSuggestions = allSuggestions.filter(
    (s) => !addedIds.has(s.user_id)
  );

  // Don't render if not logged in
  if (!user) return null;

  // Don't render if loading or no suggestions
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text">Suggested Friends</h2>
          </div>
        </div>
        <HorizontalScroll>
          {[...Array(5)].map((_, i) => (
            <Card
              key={i}
              className="p-4 min-w-[200px] w-[200px] h-[220px] animate-pulse snap-start"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-surface-light" />
                <div className="w-24 h-4 bg-surface-light rounded" />
                <div className="w-16 h-3 bg-surface-light rounded" />
                <div className="w-20 h-6 bg-surface-light rounded-full" />
                <div className="w-full h-8 bg-surface-light rounded" />
              </div>
            </Card>
          ))}
        </HorizontalScroll>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text">Suggested Friends</h2>
          </div>
        </div>
        <Card className="p-6 text-center">
          <UserPlus className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-2">No suggestions yet</p>
          <p className="text-sm text-text-muted">
            Add friends and games to get personalized suggestions
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">Suggested Friends</h2>
        </div>
        {isExpanded ? (
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            Show Less
          </Button>
        ) : (
          <Link
            href="/find-gamers?tab=suggestions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            See All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isExpanded ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SuggestionCard
                suggestion={suggestion}
                onAddFriend={handleAddFriend}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <>
          <HorizontalScroll>
            {visibleSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.user_id}
                suggestion={suggestion}
                onAddFriend={handleAddFriend}
              />
            ))}
          </HorizontalScroll>
          {visibleSuggestions.length > 3 && onToggleExpand && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={onToggleExpand}>
                Show More ({visibleSuggestions.length} friends)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

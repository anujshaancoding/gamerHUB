"use client";

import { useState } from "react";
import { Crown, Plus, X } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useListings } from "@/lib/hooks/useListings";
import type { ListingWinner } from "@/types/listings";

interface AddWinnersFormProps {
  listingId: string;
  existingWinners: ListingWinner[];
}

export function AddWinnersForm({
  listingId,
  existingWinners,
}: AddWinnersFormProps) {
  const { addWinner, isAddingWinner, removeWinner, isRemovingWinner } =
    useListings();

  const [displayName, setDisplayName] = useState("");
  const [placement, setPlacement] = useState("");
  const [prizeAwarded, setPrizeAwarded] = useState("");

  const handleAdd = async () => {
    if (!displayName.trim()) return;

    try {
      await addWinner({
        listing_id: listingId,
        display_name: displayName.trim(),
        placement: placement ? parseInt(placement) : undefined,
        prize_awarded: prizeAwarded || undefined,
      });

      setDisplayName("");
      setPlacement("");
      setPrizeAwarded("");
    } catch (err) {
      console.error("Failed to add winner:", err);
    }
  };

  const handleRemove = async (winnerId: string) => {
    try {
      await removeWinner(listingId, winnerId);
    } catch (err) {
      console.error("Failed to remove winner:", err);
    }
  };

  const sortedWinners = [...existingWinners].sort(
    (a, b) => (a.placement || 99) - (b.placement || 99)
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-500" />
        Announce Winners
      </h4>

      {/* Existing winners list */}
      {sortedWinners.length > 0 && (
        <div className="space-y-2">
          {sortedWinners.map((winner) => (
            <div
              key={winner.id}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-light"
            >
              <div className="flex items-center gap-2">
                {winner.placement && (
                  <span className="text-xs font-bold text-yellow-500 w-6">
                    #{winner.placement}
                  </span>
                )}
                <span className="text-sm text-text font-medium">
                  {winner.display_name}
                </span>
                {winner.prize_awarded && (
                  <span className="text-xs text-text-muted">
                    — {winner.prize_awarded}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(winner.id)}
                disabled={isRemovingWinner}
                className="text-text-muted hover:text-error transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add winner form */}
      <div className="space-y-2 p-3 rounded-lg border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            placeholder="Winner name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            placeholder="Placement (1, 2, 3...)"
            type="number"
            min={1}
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
          />
          <Input
            placeholder="Prize (optional)"
            value={prizeAwarded}
            onChange={(e) => setPrizeAwarded(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!displayName.trim() || isAddingWinner}
          isLoading={isAddingWinner}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Winner
        </Button>
      </div>
    </div>
  );
}

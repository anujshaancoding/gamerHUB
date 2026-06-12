"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { csrfHeaders } from "@/lib/hooks/useCsrfToken";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

export function FollowButton({
  playerId,
  playerName,
  className,
}: {
  playerId: string;
  playerName: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) {
      setFollowing(false);
      return;
    }
    fetch(`/api/pro/follow?player_id=${playerId}`)
      .then((r) => r.json())
      .then((d) => setFollowing(!!d.following))
      .catch(() => setFollowing(false));
  }, [playerId, user]);

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow pros");
      return;
    }
    if (pending) return;
    setPending(true);
    const optimistic = !following;
    setFollowing(optimistic);
    try {
      const res = await fetch("/api/pro/follow", {
        method: "POST",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ player_id: playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFollowing(!!data.following);
      toast.success(data.following ? `Following ${playerName}` : `Unfollowed ${playerName}`);
    } catch (err) {
      setFollowing(!optimistic);
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPending(false);
    }
  };

  const loading = following === null;
  const isFollowing = !!following;

  return (
    <button
      onClick={toggle}
      disabled={pending || loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
        isFollowing
          ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25"
          : "bg-surface-light border-border text-text-secondary hover:text-text hover:border-primary/30",
        (pending || loading) && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {pending || loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Heart className={cn("h-3.5 w-3.5", isFollowing && "fill-primary")} />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

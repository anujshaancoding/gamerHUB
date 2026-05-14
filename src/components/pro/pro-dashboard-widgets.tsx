"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

interface FeaturedPlayer {
  id: string;
  slug: string;
  game: "valorant" | "bgmi" | "freefire";
  ign: string;
  real_name: string | null;
  role: string | null;
  region: string | null;
  photo_url: string | null;
  bio: string | null;
  peak_rank: string | null;
  current_rank: string | null;
  national_rank: number | null;
  team: { id: string; name: string; short_name: string | null } | null;
}

interface FollowedPlayer {
  id: string;
  slug: string;
  game: "valorant" | "bgmi" | "freefire";
  ign: string;
  role: string | null;
  photo_url: string | null;
  national_rank: number | null;
  team: { id: string; name: string; short_name: string | null } | null;
}

const GAME_LABEL: Record<FeaturedPlayer["game"], string> = {
  valorant: "Valorant",
  bgmi: "BGMI",
  freefire: "Free Fire",
};

const GAME_ACCENT: Record<FeaturedPlayer["game"], string> = {
  valorant: "bg-red-500/10 text-red-300 border-red-500/30",
  bgmi: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  freefire: "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

export function PlayerOfWeekCard() {
  const [player, setPlayer] = useState<FeaturedPlayer | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/pro/featured")
      .then((r) => r.json())
      .then((d) => setPlayer(d.player || null))
      .catch(() => setPlayer(null));
  }, []);

  if (player === undefined) {
    return (
      <Card>
        <CardContent className="p-5 animate-pulse">
          <div className="h-4 w-32 bg-surface-light rounded mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-surface-light" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-surface-light rounded" />
              <div className="h-3 w-1/3 bg-surface-light rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!player) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-text-muted flex items-center gap-2">
          <Star className="h-4 w-4 text-warning fill-warning" />
          Player of the Week
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Link
          href={`/pro/${player.game}/${player.slug}`}
          className="flex items-start gap-3 group"
        >
          <div className="relative h-14 w-14 rounded-xl bg-surface-light overflow-hidden flex-shrink-0">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.ign}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-text-muted">
                {player.ign.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                {player.ign}
              </h3>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${GAME_ACCENT[player.game]}`}
              >
                {GAME_LABEL[player.game]}
              </span>
              {player.national_rank && (
                <Badge variant="primary" size="sm">#{player.national_rank}</Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {player.team?.name || "Free agent"}
              {player.role ? ` · ${player.role}` : ""}
              {player.region ? ` · ${player.region}` : ""}
            </p>
            {player.bio && (
              <p className="text-xs text-text-secondary mt-2 line-clamp-2">{player.bio}</p>
            )}
            {player.peak_rank && (
              <p className="text-xs text-text-secondary mt-2 inline-flex items-center gap-1">
                <Trophy className="h-3 w-3 text-warning" />
                Peak {player.peak_rank}
              </p>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export function FollowedProsCard() {
  const [players, setPlayers] = useState<FollowedPlayer[] | undefined>(undefined);

  useEffect(() => {
    fetch("/api/pro/follow/me")
      .then((r) => r.json())
      .then((d) => setPlayers(d.players || []))
      .catch(() => setPlayers([]));
  }, []);

  if (players === undefined) {
    return (
      <Card>
        <CardContent className="p-5 animate-pulse">
          <div className="h-4 w-32 bg-surface-light rounded mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-light" />
                <div className="flex-1 h-3 bg-surface-light rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-text-muted flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          Pros you follow
        </CardTitle>
        <Link
          href="/pro"
          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Browse all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {players.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-light/40 p-4 text-center">
            <p className="text-sm text-text-muted">You&apos;re not following anyone yet.</p>
            <Link
              href="/pro"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Follow your favourite pros →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {players.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/pro/${p.game}/${p.slug}`}
                className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-surface-light transition-colors group"
              >
                <div className="relative h-9 w-9 rounded-full bg-surface-light overflow-hidden flex-shrink-0">
                  {p.photo_url ? (
                    <Image src={p.photo_url} alt={p.ign} fill sizes="36px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-semibold text-text-muted">
                      {p.ign.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                    {p.ign}
                    {p.national_rank && (
                      <span className="ml-1.5 text-[10px] text-text-muted font-normal">#{p.national_rank}</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {GAME_LABEL[p.game]}
                    {p.team?.name ? ` · ${p.team.name}` : ""}
                  </p>
                </div>
              </Link>
            ))}
            {players.length > 6 && (
              <p className="text-xs text-text-muted text-center pt-1">
                +{players.length - 6} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

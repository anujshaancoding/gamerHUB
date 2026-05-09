"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchX, Lock, AlertTriangle, RefreshCw, Hash } from "lucide-react";
import type { LookupError } from "@/lib/tracker/types";

const SAMPLE_IDS = ["Phoenix#NA1", "Jett#1234", "Sage#APAC1", "Omen#EU01"];

interface Props {
  error: LookupError;
  riotId: string;
  onTrySample: (id: string) => void;
  onRetry: () => void;
}

export function NotFoundCard({ error, riotId, onTrySample, onRetry }: Props) {
  if (error.code === "PRIVATE_PROFILE") {
    return (
      <Card variant="elevated" className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text">Profile is private</h3>
          <p className="text-sm text-text-muted">
            <span className="font-mono text-text-secondary">{riotId}</span> has match
            history hidden. Stats can only be analyzed for public profiles.
          </p>
        </div>
        <p className="rounded-lg border border-border bg-surface-light/50 px-3 py-2 text-xs text-text-muted">
          Riot lets players hide match history in <strong>Settings → General → Career Profile</strong>.
        </p>
      </Card>
    );
  }

  if (error.code === "RATE_LIMITED" || error.code === "UPSTREAM_ERROR") {
    return (
      <Card variant="elevated" className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text">
            {error.code === "RATE_LIMITED" ? "Slow down a sec" : "Something went wrong"}
          </h3>
          <p className="text-sm text-text-muted">{error.message}</p>
        </div>
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </Card>
    );
  }

  // INVALID_FORMAT or NOT_FOUND
  const isInvalid = error.code === "INVALID_FORMAT";

  return (
    <Card variant="elevated" className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/15 text-error">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-text sm:text-xl">
          {isInvalid ? "That ID doesn't look right" : "Player not found"}
        </h3>
        <p className="mt-1 text-sm text-text-muted">{error.message}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface-light/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Common reasons
        </p>
        <ul className="space-y-1.5 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <strong>Tag is wrong</strong> — it&apos;s the part after <code className="text-primary">#</code>{" "}
              (e.g. <code>NA1</code>, not the region you think it is).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <strong>Spelling/spaces</strong> — Riot IDs are case-sensitive and exact-match. Copy it from
              the player&apos;s in-game profile.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <strong>Recently changed name</strong> — Riot can take a few hours to propagate updates.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <strong>No ranked matches yet</strong> — brand-new accounts won&apos;t show up.
            </span>
          </li>
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Or try a sample profile
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onTrySample(id)}
              className="rounded-md border border-border bg-surface-light/40 px-2.5 py-1 font-mono text-xs text-text-secondary hover:border-primary/50 hover:text-text"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

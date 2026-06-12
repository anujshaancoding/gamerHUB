"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchX, Lock, AlertTriangle, RefreshCw, Hash } from "lucide-react";
import type { LookupError } from "@/lib/tracker/types";

type Kind = "valorant" | "cs2";

const COPY: Record<Kind, {
  privateTitle: string;
  privateBody: (id: string) => React.ReactNode;
  privateHint: React.ReactNode;
  reasons: Array<{ title: string; body: React.ReactNode }>;
  samples: string[];
  samplesHeading: string;
}> = {
  valorant: {
    privateTitle: "Profile is private",
    privateBody: (id) => (
      <>
        <span className="font-mono text-text-secondary">{id}</span> has match history hidden. Stats can only be analyzed for public profiles.
      </>
    ),
    privateHint: (
      <>Riot lets players hide match history in <strong>Settings → General → Career Profile</strong>.</>
    ),
    reasons: [
      { title: "Tag is wrong", body: <>it&apos;s the part after <code className="text-primary">#</code> (e.g. <code>NA1</code>, not the region you think it is).</> },
      { title: "Spelling/spaces", body: <>Riot IDs are case-sensitive and exact-match. Copy it from the player&apos;s in-game profile.</> },
      { title: "Recently changed name", body: <>Riot can take a few hours to propagate updates.</> },
      { title: "No ranked matches yet", body: <>brand-new accounts won&apos;t show up.</> },
    ],
    samples: ["Phoenix#NA1", "Jett#1234", "Sage#APAC1", "Omen#EU01"],
    samplesHeading: "Or try a sample profile",
  },
  cs2: {
    privateTitle: "Steam profile is private",
    privateBody: (id) => (
      <>
        <span className="font-mono text-text-secondary">{id}</span> has game details hidden on Steam. CS2 stats can only be read from public profiles.
      </>
    ),
    privateHint: (
      <>On Steam: <strong>Profile → Edit Profile → Privacy Settings → Game Details: Public</strong>. Also make sure <strong>Always keep my total playtime private</strong> is unchecked.</>
    ),
    reasons: [
      { title: "Wrong vanity URL", body: <>use the part after <code className="text-primary">/id/</code> in your Steam URL (e.g. <code>gabelogannewell</code>).</> },
      { title: "Custom URL not set", body: <>if you don&apos;t have a vanity URL, paste the full <code>steamcommunity.com/profiles/&lt;steamid64&gt;</code> link or the 17-digit ID directly.</> },
      { title: "Profile privacy", body: <>your profile or game details are private — see the privacy fix below the search box.</> },
      { title: "No CS2 hours", body: <>brand-new accounts with zero CS2 matches won&apos;t return stats.</> },
    ],
    samples: ["gabelogannewell", "76561197960287930", "th3whitewolf"],
    samplesHeading: "Or try a sample profile",
  },
};

interface Props {
  error: LookupError;
  submittedId: string;
  onTrySample: (id: string) => void;
  onRetry: () => void;
  kind?: Kind;
}

export function NotFoundCard({ error, submittedId, onTrySample, onRetry, kind = "valorant" }: Props) {
  const copy = COPY[kind];

  if (error.code === "PRIVATE_PROFILE") {
    return (
      <Card variant="elevated" className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text">{copy.privateTitle}</h3>
          <p className="text-sm text-text-muted">{copy.privateBody(submittedId)}</p>
        </div>
        <p className="rounded-lg border border-border bg-surface-light/50 px-3 py-2 text-xs text-text-muted">
          {copy.privateHint}
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
          {copy.reasons.map((r) => (
            <li key={r.title} className="flex items-start gap-2">
              <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <strong>{r.title}</strong> — {r.body}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {copy.samplesHeading}
        </p>
        <div className="flex flex-wrap gap-2">
          {copy.samples.map((id) => (
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

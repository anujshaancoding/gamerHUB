import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trophy } from "lucide-react";
import { getEventBySlug, listPickemMatches, listUserPredictions, pickemLeaderboard } from "@/lib/pro/pickem-queries";
import { getUser } from "@/lib/auth/get-user";
import { PickemBoard } from "@/components/monetization/pro/pickem-board";
import { PickemLeaderboard } from "@/components/monetization/pro/pickem-leaderboard";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Pick'em — ggLobby" };
  return {
    title: `${event.name} Pick'em — Predict every match · ggLobby`,
    description: `Predict the winner of every ${event.name} match. Climb the live leaderboard.`,
    alternates: { canonical: `/pro/events/${slug}/pickem` },
  };
}

export default async function EventPickemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [matches, user] = await Promise.all([
    listPickemMatches(event.id),
    getUser(),
  ]);

  const [picks, leaderboard] = await Promise.all([
    user ? listUserPredictions(user.id, event.id) : Promise.resolve([]),
    pickemLeaderboard(event.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link href="/pro/events" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3">
          <ChevronLeft className="h-4 w-4" /> Tournament calendar
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 border border-primary/30 p-2.5">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">{event.name} — Pick&apos;em</h1>
            <p className="text-text-muted text-sm mt-1">
              {event.region} · {event.game.toUpperCase()} · Picks lock at each match&apos;s scheduled start time.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-sm text-text-secondary text-center">
            No matches published yet. Brackets typically open 24–48 h before the event starts.
          </div>
        ) : (
          <PickemBoard matches={matches} initialPicks={picks} isAuthed={!!user} />
        )}

        <PickemLeaderboard rows={leaderboard} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { listProEvents } from "@/lib/pro/queries";
import { EventsList } from "@/components/pro/events-list";

export const metadata: Metadata = {
  title: "Indian Valorant Tournament Calendar · ggLobby",
  description:
    "Upcoming and live Valorant tournaments in India — VCT Challengers South Asia and more. Dates, prize pools, venues, official streams.",
  openGraph: {
    title: "Indian Valorant Tournament Calendar",
    description:
      "VCT Challengers SA and other Indian Valorant events. Dates, prize pools, streams.",
    type: "website",
  },
};

export const revalidate = 300;

export default async function ProEventsPage() {
  const events = await listProEvents();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Pro Scene
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Indian Esports Calendar
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          Upcoming and live Valorant tournaments in India.
          Dates, prize pools, venues and official broadcast links.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-secondary">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p>
          Beta. We currate this calendar manually from official sources (Riot SA and
          VALORANT Esports) and the major tournament organizers. Missing an event?{" "}
          <Link href="/help" className="text-primary hover:underline">
            Tell us.
          </Link>
        </p>
      </div>

      <EventsList events={events} />
    </div>
  );
}

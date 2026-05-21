import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MAPS, mapSplash } from "@/lib/data/valorant-maps";

export const metadata: Metadata = {
  title: "Valorant Maps — Callouts & Lineups | ggLobby",
  description:
    "Every Valorant map with callouts and agent lineups. Ascent, Bind, Haven, Split, Lotus, Sunset, Abyss and more — learn the lineups that win rounds.",
  keywords: [
    "valorant maps",
    "valorant callouts",
    "valorant lineups",
    "valorant map guide",
  ],
};

export default function MapsPage() {
  const pool = MAPS.filter((m) => m.inPool);
  const rest = MAPS.filter((m) => !m.inPool);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-primary" />
        <h1 className="text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
          Valorant Maps
        </h1>
      </div>
      <p className="mb-8 max-w-2xl text-sm text-text-muted">
        Callouts and agent lineups for every map. Pick a map to browse lineups
        by agent, ability and side.
      </p>

      <Section title="Competitive Pool" maps={pool} />
      {rest.length > 0 && (
        <div className="mt-10">
          <Section title="Other Maps" maps={rest} />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  maps,
}: {
  title: string;
  maps: typeof MAPS;
}) {
  return (
    <>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-text-dim">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {maps.map((map) => (
          <Link
            key={map.slug}
            href={`/maps/${map.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={mapSplash(map.uuid)}
                alt={map.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-text drop-shadow">
                    {map.name}
                  </h3>
                  <span className="rounded-md bg-surface/80 px-2 py-1 text-xs font-semibold text-text-secondary backdrop-blur">
                    {map.sites.length} sites
                  </span>
                </div>
              </div>
            </div>
            <p className="p-4 text-sm leading-relaxed text-text-muted">
              {map.blurb}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

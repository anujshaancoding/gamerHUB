import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { getPassportGallery } from "@/lib/features/passport-gallery";
import { PassportGalleryCard } from "@/components/gaming/passport/passport-gallery-card";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Indian Valorant Passport Gallery | ggLobby",
  description:
    "Browse public Valorant Passports from Indian players. See rank, peak rank, main agent, role, state, language and playstyle.",
  alternates: { canonical: "/passport/gallery" },
};

export const revalidate = 60;

export default async function PassportGalleryPage() {
  const passports = await getPassportGallery(72).catch((error) => {
    console.error("Passport gallery page error:", error);
    return [];
  });
  const featured = passports.filter((passport) => passport.submitted);
  const visible = featured.length > 0 ? featured.concat(passports.filter((p) => !p.submitted)) : passports;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Weekly feature queue
            </div>
            <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight text-text sm:text-6xl">
              Indian Valorant Passport Gallery
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Public Passports from Indian Valorant players. Browse rank, agent,
              role, state, language and playstyle before Squad Finder opens.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/passport">
              <Button variant="primary" leftIcon={<ArrowRight className="h-4 w-4" />}>
                Create passport
              </Button>
            </Link>
            <Link href="/rank-card">
              <Button variant="outline" leftIcon={<Trophy className="h-4 w-4" />}>
                Make rank card
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {visible.length > 0 ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((passport) => (
            <PassportGalleryCard key={passport.id} passport={passport} />
          ))}
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight text-text">
            Be the first public Passport
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary">
            Save your Valorant Passport and submit it for weekly feature. Once
            players start joining, this gallery becomes the proof layer for Squad Finder.
          </p>
          <div className="mt-6">
            <Link href="/passport">
              <Button variant="primary">Create your Passport</Button>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

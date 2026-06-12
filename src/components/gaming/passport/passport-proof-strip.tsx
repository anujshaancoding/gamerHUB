"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { PassportGalleryCard } from "./passport-gallery-card";
import type { PassportGalleryItem } from "@/lib/features/passport-gallery";

export function PassportProofStrip() {
  const [passports, setPassports] = useState<PassportGalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/passport/gallery?limit=6")
      .then((response) => (response.ok ? response.json() : { passports: [] }))
      .then((data) => {
        if (!mounted) return;
        setPassports(Array.isArray(data.passports) ? data.passports : []);
      })
      .catch(() => {
        if (mounted) setPassports([]);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Live proof
          </div>
          <h2 className="mt-4 text-3xl font-black uppercase italic tracking-tight sm:text-4xl">
            Indian Passports joining this week
          </h2>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            The gallery becomes our trust signal before Squad Finder opens:
            real ranks, agents, states, languages and playstyles from Indian Valorant players.
          </p>
        </div>
        <Link href="/passport/gallery">
          <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View gallery
          </Button>
        </Link>
      </div>

      {passports.length > 0 ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {passports.map((passport) => (
            <PassportGalleryCard key={passport.id} passport={passport} compact />
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-border bg-surface p-6 text-center">
          <h3 className="text-xl font-black uppercase tracking-tight text-text">
            {loaded ? "Be the first featured Passport" : "Loading Passports"}
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
            Save your Passport, submit it for weekly feature, then share the gallery
            link with your squad.
          </p>
          <div className="mt-5">
            <Link href="/passport">
              <Button variant="primary">Create Passport</Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

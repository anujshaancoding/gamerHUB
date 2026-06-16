import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { JsonLd, BASE_URL } from "@/lib/features/seo";
import { RankUpGuide } from "@/components/gaming/rank-up/rank-up-guide";
import { getTier, RANK_UP_LADDER, RANK_UP_TIERS } from "@/lib/data/valorant-rank-up";

interface Props {
  params: Promise<{ tier: string }>;
}

// Pre-render the whole ladder: live tiers as full guides, locked tiers as a
// "coming soon" placeholder so inbound/social links resolve gracefully.
export function generateStaticParams() {
  return RANK_UP_LADDER.map((t) => ({ tier: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tier: slug } = await params;
  const tier = getTier(slug);
  const ladder = RANK_UP_LADDER.find((t) => t.slug === slug);

  if (!tier) {
    if (ladder) {
      const t = `${ladder.rank} Rank Guide — Coming Soon | ggLobby`;
      return {
        title: { absolute: t },
        description: `Our ${ladder.rank} → ${ladder.nextRank} game-sense guide is on the way. Start with the Iron, Bronze and Silver guides now.`,
        alternates: { canonical: `${BASE_URL}/rank-up/${slug}` },
        robots: { index: false, follow: true },
      };
    }
    return { title: "Rank not found", robots: { index: false, follow: false } };
  }

  return {
    // tier.title already carries "| ggLobby"; absolute prevents a double suffix
    // while og/twitter below keep the explicit brand.
    title: { absolute: tier.title },
    description: tier.description,
    keywords: tier.keywords,
    alternates: { canonical: `${BASE_URL}/rank-up/${tier.slug}` },
    openGraph: {
      title: tier.title,
      description: tier.description,
      type: "article",
      url: `${BASE_URL}/rank-up/${tier.slug}`,
    },
    twitter: { card: "summary_large_image", title: tier.title, description: tier.description },
  };
}

function ComingSoon({ rank, nextRank }: { rank: string; nextRank: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <Link
        href="/rank-up"
        className="mb-6 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All ranks
      </Link>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface">
        <Lock className="h-6 w-6 text-text-dim" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-text md:text-3xl">
        The {rank} → {nextRank} guide is coming soon
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
        We&apos;re writing the {rank} game-sense guide right now. In the meantime, the Iron, Bronze and
        Silver guides are live — most of the fundamentals carry straight up the ladder.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {RANK_UP_TIERS.map((t) => (
          <Link
            key={t.slug}
            href={`/rank-up/${t.slug}`}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/30 hover:text-text"
          >
            {t.rank} guide
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function RankUpTierPage({ params }: Props) {
  const { tier: slug } = await params;
  const tier = getTier(slug);

  if (!tier) {
    const ladder = RANK_UP_LADDER.find((t) => t.slug === slug);
    if (ladder) return <ComingSoon rank={ladder.rank} nextRank={ladder.nextRank} />;
    notFound();
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Rank Up", item: `${BASE_URL}/rank-up` },
      { "@type": "ListItem", position: 3, name: tier.rank, item: `${BASE_URL}/rank-up/${tier.slug}` },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tier.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, faqPage]} />
      <RankUpGuide tier={tier} />
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listForumCategories, listLatestForumThreads } from "@/lib/pro/forum-queries";
import { ForumLanding } from "@/components/content/forum/forum-landing";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Forum — Indian Valorant discussions · ggLobby",
  description:
    "Discussion board for Indian Valorant players — agents, comps, ranked rants and LFG.",
  alternates: { canonical: "/forum" },
  openGraph: {
    title: "ggLobby Forum",
    description: "Talk Indian esports, hardware and ranked rants.",
    type: "website",
  },
};

export default async function ForumLandingPage() {
  const [cats, latest] = await Promise.all([
    listForumCategories(),
    listLatestForumThreads(10),
  ]);

  const announcements = cats.find((c) => c.slug === "announcements") ?? null;
  const sections = cats.filter((c) => c.slug !== "announcements");

  // With a single section there's nothing to pick — skip the landing and drop
  // the user straight into that section's thread list.
  if (sections.length === 1) {
    redirect(`/forum/${sections[0].slug}`);
  }

  return (
    <ForumLanding
      announcements={announcements}
      sections={sections}
      latest={latest}
    />
  );
}

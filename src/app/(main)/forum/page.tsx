import type { Metadata } from "next";
import { listForumCategories, listLatestForumThreads } from "@/lib/pro/forum-queries";
import { ForumLanding } from "@/components/forum/forum-landing";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Forum — Indian gamer discussions · ggLobby",
  description:
    "Discussion board for Indian Valorant players. Sections for Valorant, hardware, LFG and more.",
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

  return (
    <ForumLanding
      announcements={announcements}
      sections={sections}
      latest={latest}
    />
  );
}

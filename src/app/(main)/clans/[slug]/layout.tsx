import type { Metadata } from "next";
import { createClient } from "@/lib/db/client";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = createClient();
  const { data: clan } = await db
    .from("clans")
    .select("name, tag, description, avatar_url")
    .eq("slug", slug)
    .single();

  if (!clan) {
    return { title: "Clan Not Found" };
  }

  const clanName = clan.name as string;
  const clanTag = clan.tag as string;
  const clanDescription = clan.description as string | null;
  const clanAvatarUrl = clan.avatar_url as string | null;

  const title = `${clanName} [${clanTag}]`;
  const description =
    clanDescription?.slice(0, 160) ||
    `Check out the ${clanName} clan on ggLobby`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ggLobby`,
      description,
      images: clanAvatarUrl ? [{ url: clanAvatarUrl }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${title} | ggLobby`,
      description,
    },
    alternates: {
      canonical: `https://gglobby.in/clans/${slug}`,
    },
  };
}

export default function ClanDetailLayout({ children }: Props) {
  return children;
}

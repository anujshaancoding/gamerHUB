import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clans",
  description:
    "Create or join gaming clans on ggLobby. Build your squad, recruit members, and compete together in Valorant, BGMI, Free Fire and more.",
  openGraph: {
    title: "Clans | ggLobby",
    description:
      "Create or join gaming clans on ggLobby. Build your squad, recruit members, and compete together.",
    type: "website",
  },
  alternates: {
    canonical: "/clans",
  },
};

export default function ClansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

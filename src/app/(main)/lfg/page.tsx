import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Looking for Group",
  description: "Find teammates and squads for your favorite games. Browse LFG posts or create your own on ggLobby.",
  alternates: { canonical: "https://gglobby.in/lfg" },
};

export default function LFGPage() {
  redirect("/find-gamers?tab=lfg");
}

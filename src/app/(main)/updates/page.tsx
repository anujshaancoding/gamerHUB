import type { Metadata } from "next";
import { UpdatesPageClient } from "@/components/updates/updates-page-client";

export const metadata: Metadata = {
  title: "Updates - What's New",
  description:
    "See the latest updates, features, and improvements to ggLobby. Stay informed about what's new on the platform.",
};

export default function UpdatesPage() {
  return <UpdatesPageClient />;
}

import type { Metadata } from "next";
import { BASE_URL } from "@/lib/seo/constants";
import { HelpCenterClient } from "./help-center-client";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Get help with ggLobby features — blog creation, profile setup, clans, messaging, and more.",
  openGraph: {
    title: "Help Center | ggLobby",
    description:
      "Get help with ggLobby features — blog creation, profile setup, clans, messaging, and more.",
    type: "website",
    url: `${BASE_URL}/help`,
  },
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return <HelpCenterClient />;
}

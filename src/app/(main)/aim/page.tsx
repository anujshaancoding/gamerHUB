import type { Metadata } from "next";
import { AimHub } from "@/components/aim/aim-hub";

export const metadata: Metadata = {
  title: "Aim Lab · ggLobby",
  description:
    "Seven browser-native aim drills — reaction, flick, tracking plus four ggLobby originals (Peek Duel, Ghost Echo, Clutch 1v5, Daily Gauntlet). Play instantly, share your score.",
  openGraph: {
    title: "ggLobby Aim Lab — Train your aim. Share the receipt.",
    description:
      "Train your aim in the browser. Seven drills, four of them ggLobby originals. No download. No login required.",
    type: "website",
  },
};

export default function AimPage() {
  return <AimHub />;
}

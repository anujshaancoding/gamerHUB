import type { Metadata } from "next";
import { CarouselBuilder } from "@/components/admin/carousel/CarouselBuilder";

export const metadata: Metadata = {
  title: "IG Carousel · Admin · ggLobby",
};

export default function AdminCarouselPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Instagram Carousel</h1>
        <p className="mt-1 text-sm text-white/50">
          Turn any blog post (or fresh idea) into a 4–8 slide rank-themed
          carousel sized 1080×1350. Edit each slide, then download as PNGs to
          upload on Instagram.
        </p>
      </div>
      <CarouselBuilder />
    </div>
  );
}

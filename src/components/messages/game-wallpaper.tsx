"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface GameWallpaperProps {
  gameSlugs: string[];
}

export function GameWallpaper({ gameSlugs }: GameWallpaperProps) {
  const tiles = useMemo(() => {
    if (gameSlugs.length === 0) return [];
    const tileCount = 48; // 6 columns x 8 rows approx
    const result: { slug: string; rotation: number; delay: number }[] = [];
    for (let i = 0; i < tileCount; i++) {
      result.push({
        slug: gameSlugs[i % gameSlugs.length],
        rotation: ((i * 37 + 13) % 360) - 180, // pseudo-random rotation
        delay: i * 0.02,
      });
    }
    return result;
  }, [gameSlugs]);

  if (tiles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95 z-10" />

      {/* Subtle radial glow at center */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.02)_0%,transparent_70%)]" />

      {/* Tiled game icons */}
      <div className="absolute inset-0 grid grid-cols-6 gap-8 p-8 opacity-[0.05] z-0">
        {tiles.map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: tile.delay, duration: 0.6, ease: "easeOut" }}
            className="flex items-center justify-center"
            style={{ transform: `rotate(${tile.rotation}deg)` }}
          >
            <Image
              src={`/images/games/${tile.slug}.svg`}
              alt=""
              width={64}
              height={64}
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 opacity-60"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

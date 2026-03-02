"use client";

import { getSkinById } from "@/lib/constants/profile-skins";

interface SkinWrapperProps {
  skin: unknown;
  children: React.ReactNode;
}

export function SkinWrapper({ skin, children }: SkinWrapperProps) {
  // If no skin, invalid, or "default" -- render children as-is
  if (!skin || typeof skin !== "string") {
    return <>{children}</>;
  }

  const resolved = getSkinById(skin);
  if (!resolved || resolved.id === "default" || !resolved.className) {
    return <>{children}</>;
  }

  return (
    <>
      <style>{`
        /* ══════════════════════════════════════
           Skin: RPG Character Sheet
           ══════════════════════════════════════ */
        .skin-rpg-sheet {
          font-family: Georgia, 'Times New Roman', serif;
          position: relative;
        }
        .skin-rpg-sheet::before,
        .skin-rpg-sheet::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #d4a574;
          pointer-events: none;
          z-index: 5;
        }
        .skin-rpg-sheet::before {
          top: 8px;
          left: 8px;
          border-right: none;
          border-bottom: none;
        }
        .skin-rpg-sheet::after {
          bottom: 8px;
          right: 8px;
          border-left: none;
          border-top: none;
        }
        .skin-rpg-sheet > * {
          position: relative;
        }
        /* Cards get parchment look */
        .skin-rpg-sheet [class*="rounded"] {
          border: 2px solid #d4a574;
          background-image: linear-gradient(
            135deg,
            rgba(212, 165, 116, 0.08) 0%,
            rgba(139, 105, 20, 0.05) 100%
          );
        }
        /* Sepia tint overlay */
        .skin-rpg-sheet .border-border,
        .skin-rpg-sheet .border-white\\/10 {
          border-color: rgba(212, 165, 116, 0.35);
        }
        /* Headings get serif style */
        .skin-rpg-sheet h1,
        .skin-rpg-sheet h2,
        .skin-rpg-sheet h3,
        .skin-rpg-sheet h4 {
          font-family: Georgia, 'Times New Roman', serif;
          letter-spacing: 0.02em;
        }

        /* ══════════════════════════════════════
           Skin: Esports Pro Card
           ══════════════════════════════════════ */
        .skin-esports-card {
          font-family: 'Inter', system-ui, sans-serif;
        }
        .skin-esports-card [class*="rounded"] {
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
          border: 1px solid rgba(0, 255, 136, 0.4);
        }
        .skin-esports-card .border-border,
        .skin-esports-card .border-white\\/10 {
          border-color: rgba(0, 255, 136, 0.3);
        }
        .skin-esports-card h1,
        .skin-esports-card h2,
        .skin-esports-card h3,
        .skin-esports-card h4 {
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
        .skin-esports-card span,
        .skin-esports-card p {
          font-weight: 600;
        }

        /* ══════════════════════════════════════
           Skin: Retro Arcade
           ══════════════════════════════════════ */
        .skin-retro-arcade {
          font-family: 'Courier New', 'Lucida Console', monospace;
          position: relative;
        }
        /* CRT scanline overlay */
        .skin-retro-arcade::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
          pointer-events: none;
          z-index: 10;
          border-radius: inherit;
        }
        .skin-retro-arcade [class*="rounded"] {
          border: 3px dashed rgba(255, 0, 255, 0.5);
          border-radius: 4px !important;
        }
        .skin-retro-arcade .border-border,
        .skin-retro-arcade .border-white\\/10 {
          border-color: rgba(0, 255, 255, 0.4);
        }
        .skin-retro-arcade h1,
        .skin-retro-arcade h2,
        .skin-retro-arcade h3,
        .skin-retro-arcade h4 {
          font-family: 'Courier New', 'Lucida Console', monospace;
          text-shadow: 2px 2px 0 rgba(255, 0, 255, 0.3);
          letter-spacing: 0.08em;
        }

        /* ══════════════════════════════════════
           Skin: Cyberpunk Terminal
           ══════════════════════════════════════ */
        .skin-cyberpunk {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        .skin-cyberpunk [class*="rounded"] {
          border: 1px solid rgba(255, 51, 102, 0.5);
          border-radius: 2px !important;
          clip-path: polygon(
            0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px,
            100% calc(100% - 4px), calc(100% - 4px) 100%,
            4px 100%, 0 calc(100% - 4px)
          );
        }
        .skin-cyberpunk .border-border,
        .skin-cyberpunk .border-white\\/10 {
          border-color: rgba(51, 255, 204, 0.3);
        }
        .skin-cyberpunk h1,
        .skin-cyberpunk h2,
        .skin-cyberpunk h3,
        .skin-cyberpunk h4 {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          color: #33ffcc;
        }
        /* Glitch on hover */
        @keyframes skin-cyberpunk-glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 1px) skewX(-1deg); }
          40% { transform: translate(2px, -1px) skewX(1deg); }
          60% { transform: translate(-1px, 2px) skewX(-0.5deg); }
          80% { transform: translate(1px, -2px) skewX(0.5deg); }
          100% { transform: translate(0); }
        }
        .skin-cyberpunk:hover {
          animation: skin-cyberpunk-glitch 0.4s ease-in-out;
        }

        /* ══════════════════════════════════════
           Skin: Fantasy Quest Log
           ══════════════════════════════════════ */
        .skin-fantasy-quest {
          font-family: Georgia, 'Palatino Linotype', serif;
        }
        .skin-fantasy-quest [class*="rounded"] {
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: 16px !important;
          background-image: linear-gradient(
            135deg,
            rgba(168, 85, 247, 0.06) 0%,
            rgba(99, 102, 241, 0.04) 50%,
            rgba(168, 85, 247, 0.06) 100%
          );
          box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.1);
        }
        .skin-fantasy-quest .border-border,
        .skin-fantasy-quest .border-white\\/10 {
          border-color: rgba(139, 92, 246, 0.35);
        }
        .skin-fantasy-quest h1,
        .skin-fantasy-quest h2,
        .skin-fantasy-quest h3,
        .skin-fantasy-quest h4 {
          font-family: Georgia, 'Palatino Linotype', serif;
          font-style: italic;
          letter-spacing: 0.03em;
          background: linear-gradient(135deg, #a855f7, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      <div className={resolved.className}>
        {children}
      </div>
    </>
  );
}

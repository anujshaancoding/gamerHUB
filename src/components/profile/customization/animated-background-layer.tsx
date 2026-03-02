"use client";

import { getBackgroundById } from "@/lib/constants/profile-backgrounds";

interface AnimatedBackgroundLayerProps {
  background: unknown;
}

export function AnimatedBackgroundLayer({ background }: AnimatedBackgroundLayerProps) {
  if (!background || typeof background !== "string") return null;

  const bg = getBackgroundById(background);
  if (!bg) return null;

  return (
    <>
      <style>{`
        /* ── Cyberpunk Grid ── */
        @keyframes cyberpunk-grid-scroll {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 0 60px, 60px 0; }
        }
        .bg-anim-cyberpunk-grid {
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 29px,
              rgba(0, 255, 255, 0.25) 29px,
              rgba(0, 255, 255, 0.25) 30px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 29px,
              rgba(0, 255, 255, 0.12) 29px,
              rgba(0, 255, 255, 0.12) 30px
            );
          background-size: 30px 30px;
          animation: cyberpunk-grid-scroll 4s linear infinite;
          transform: perspective(400px) rotateX(45deg);
          transform-origin: center bottom;
        }

        /* ── Starfield ── */
        @keyframes starfield-zoom {
          0% {
            background-size: 200px 200px, 300px 300px, 250px 250px, 180px 180px;
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            background-size: 400px 400px, 600px 600px, 500px 500px, 360px 360px;
            opacity: 0.6;
          }
        }
        .bg-anim-starfield {
          background:
            radial-gradient(1px 1px at 10% 20%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 40% 60%, #ffffff 100%, transparent),
            radial-gradient(1px 1px at 70% 30%, #c7d2fe 100%, transparent),
            radial-gradient(2px 2px at 85% 75%, #ffffff 100%, transparent),
            radial-gradient(1px 1px at 25% 80%, #e0e7ff 100%, transparent),
            radial-gradient(1.5px 1.5px at 55% 15%, #ffffff 100%, transparent),
            radial-gradient(1px 1px at 90% 50%, #c7d2fe 100%, transparent);
          background-color: transparent;
          background-size: 200px 200px, 300px 300px, 250px 250px, 180px 180px, 220px 220px, 280px 280px, 160px 160px;
          animation: starfield-zoom 8s ease-in-out infinite;
        }

        /* ── Retro Arcade ── */
        @keyframes retro-arcade-move {
          0% { background-position: 0 0; }
          100% { background-position: 24px 24px; }
        }
        .bg-anim-retro-arcade {
          background:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255, 0, 255, 0.15) 4px,
              rgba(255, 0, 255, 0.15) 8px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 4px,
              rgba(0, 255, 255, 0.1) 4px,
              rgba(0, 255, 255, 0.1) 8px
            );
          background-size: 12px 12px;
          animation: retro-arcade-move 2s steps(6) infinite;
          image-rendering: pixelated;
        }

        /* ── Aurora Borealis ── */
        @keyframes aurora-shift {
          0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
          33% { background-position: 50% 100%; filter: hue-rotate(30deg); }
          66% { background-position: 100% 50%; filter: hue-rotate(-20deg); }
          100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
        }
        .bg-anim-aurora {
          background: linear-gradient(
            135deg,
            rgba(15, 118, 110, 0.6),
            rgba(124, 58, 237, 0.5),
            rgba(6, 182, 212, 0.6),
            rgba(168, 85, 247, 0.5),
            rgba(52, 211, 153, 0.6)
          );
          background-size: 400% 400%;
          animation: aurora-shift 12s ease infinite;
        }

        /* ── Neon Waves ── */
        @keyframes neon-waves-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-anim-neon-waves {
          background: linear-gradient(
            90deg,
            rgba(6, 182, 212, 0.5),
            rgba(168, 85, 247, 0.5),
            rgba(244, 63, 94, 0.5),
            rgba(6, 182, 212, 0.5)
          );
          background-size: 300% 100%;
          animation: neon-waves-move 6s ease infinite;
        }

        /* ── Geometric Mesh ── */
        @keyframes geometric-rotate {
          0% { transform: rotate(0deg) scale(1.5); }
          100% { transform: rotate(360deg) scale(1.5); }
        }
        .bg-anim-geometric {
          background: conic-gradient(
            from 0deg at 50% 50%,
            rgba(99, 102, 241, 0.3),
            rgba(236, 72, 153, 0.3),
            rgba(6, 182, 212, 0.3),
            rgba(168, 85, 247, 0.3),
            rgba(99, 102, 241, 0.3)
          );
          animation: geometric-rotate 20s linear infinite;
        }

        /* ── Smoke ── */
        @keyframes smoke-drift {
          0% {
            background-position: 0% 50%, 100% 50%;
            opacity: 0.25;
          }
          25% {
            opacity: 0.35;
          }
          50% {
            background-position: 30% 40%, 70% 60%;
            opacity: 0.25;
          }
          75% {
            opacity: 0.35;
          }
          100% {
            background-position: 0% 50%, 100% 50%;
            opacity: 0.25;
          }
        }
        .bg-anim-smoke {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(148, 163, 184, 0.5) 0%, transparent 70%),
            radial-gradient(ellipse at 80% 50%, rgba(100, 116, 139, 0.4) 0%, transparent 70%),
            radial-gradient(ellipse at 50% 30%, rgba(71, 85, 105, 0.3) 0%, transparent 60%);
          background-size: 100% 100%;
          animation: smoke-drift 10s ease-in-out infinite;
        }

        /* ── Gradient Pulse ── */
        @keyframes gradient-pulse-anim {
          0%, 100% {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(236, 72, 153, 0.4));
          }
          50% {
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.5), rgba(6, 182, 212, 0.4));
          }
        }
        .bg-anim-gradient-pulse {
          animation: gradient-pulse-anim 5s ease-in-out infinite;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(236, 72, 153, 0.4));
        }
      `}</style>
      <div
        className={`absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0 opacity-30 ${bg.className}`}
      />
    </>
  );
}

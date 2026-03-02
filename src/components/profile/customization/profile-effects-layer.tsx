"use client";

import { useMemo } from "react";
import { getEffectById, type ProfileEffect } from "@/lib/constants/profile-effects";

interface ProfileEffectsLayerProps {
  effect: unknown;
}

/**
 * Seeded pseudo-random number generator based on particle index.
 * Produces deterministic values to avoid hydration mismatch between
 * server and client renders.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateParticles(effect: ProfileEffect) {
  const particles = [];

  for (let i = 0; i < effect.particleCount; i++) {
    const r1 = seededRandom(i);
    const r2 = seededRandom(i + 100);
    const r3 = seededRandom(i + 200);
    const r4 = seededRandom(i + 300);
    const r5 = seededRandom(i + 400);

    const left = r1 * 100;
    const delay = r2 * (effect.durationRange[1] - effect.durationRange[0]) + effect.durationRange[0];
    const size =
      r3 * (effect.sizeRange[1] - effect.sizeRange[0]) + effect.sizeRange[0];
    const duration =
      r4 * (effect.durationRange[1] - effect.durationRange[0]) + effect.durationRange[0];
    const color = effect.colors[Math.floor(r5 * effect.colors.length)];

    particles.push({ left, delay, size, duration, color, index: i });
  }

  return particles;
}

function renderParticle(
  effect: ProfileEffect,
  particle: ReturnType<typeof generateParticles>[number]
) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${particle.left}%`,
    animationName: effect.animationName,
    animationDuration: `${particle.duration}s`,
    animationDelay: `${particle.delay}s`,
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
    animationFillMode: "both",
  };

  switch (effect.shape) {
    case "custom":
      return (
        <div
          key={particle.index}
          style={{
            ...baseStyle,
            fontSize: `${particle.size}px`,
            top: "-20px",
          }}
        >
          {effect.character}
        </div>
      );

    case "circle":
      return (
        <div
          key={particle.index}
          style={{
            ...baseStyle,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: "50%",
            backgroundColor: particle.color,
            top: "-20px",
          }}
        />
      );

    case "square":
      return (
        <div
          key={particle.index}
          style={{
            ...baseStyle,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            top: "-20px",
          }}
        />
      );

    case "line":
      return (
        <div
          key={particle.index}
          style={{
            ...baseStyle,
            width: `${particle.size}px`,
            height: `${particle.size * 6}px`,
            backgroundColor: particle.color,
            borderRadius: "1px",
            top: "-30px",
          }}
        />
      );

    default:
      return null;
  }
}

const EFFECT_KEYFRAMES = `
@keyframes effectSnowfall {
  0% {
    transform: translateY(-10px) translateX(0px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(30px);
    opacity: 0;
  }
}

@keyframes effectRain {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  5% {
    opacity: 0.7;
  }
  95% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

@keyframes effectFireflies {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  40% {
    transform: translate(20px, -30px);
    opacity: 0.3;
  }
  60% {
    transform: translate(-15px, -10px);
    opacity: 1;
  }
  80% {
    transform: translate(10px, -40px);
    opacity: 0.4;
  }
  100% {
    transform: translate(0, 0);
    opacity: 0;
  }
}

@keyframes effectCherryBlossoms {
  0% {
    transform: translateY(-10px) translateX(0px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateY(50vh) translateX(40px) rotate(180deg);
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(100vh) translateX(-20px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes effectEmbers {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
    bottom: -10px;
  }
  10% {
    opacity: 1;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(20px);
    opacity: 0;
  }
}

@keyframes effectSparks {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  20% {
    transform: scale(1);
    opacity: 1;
  }
  40% {
    opacity: 0.8;
  }
  60% {
    transform: scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

@keyframes effectMatrix {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  30% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  70% {
    opacity: 0.2;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

@keyframes effectPixels {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  25% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.5;
  }
  75% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

@keyframes effectBubbles {
  0% {
    transform: translateY(0) translateX(0) scale(0.5);
    opacity: 0;
    bottom: -20px;
  }
  10% {
    opacity: 0.6;
    transform: translateY(0) translateX(0) scale(1);
  }
  50% {
    transform: translateY(-50vh) translateX(15px) scale(1.05);
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) translateX(-10px) scale(0.8);
    opacity: 0;
  }
}

@keyframes effectAurora {
  0% {
    transform: translateX(0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 0.15;
    transform: translateX(20px) scale(1.1);
  }
  50% {
    opacity: 0.25;
    transform: translateX(-15px) scale(1.3);
  }
  80% {
    opacity: 0.1;
    transform: translateX(10px) scale(1.05);
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 0;
  }
}
`;

export function ProfileEffectsLayer({ effect }: ProfileEffectsLayerProps) {
  const effectConfig = useMemo(() => {
    if (effect === null || effect === undefined || typeof effect !== "string") {
      return null;
    }
    return getEffectById(effect);
  }, [effect]);

  const particles = useMemo(() => {
    if (!effectConfig) return [];
    return generateParticles(effectConfig);
  }, [effectConfig]);

  if (!effectConfig) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EFFECT_KEYFRAMES }} />
      <div
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
        aria-hidden="true"
      >
        {particles.map((particle) => renderParticle(effectConfig, particle))}
      </div>
    </>
  );
}

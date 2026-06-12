// Instagram-carousel slide renderer.
//
// Outputs 1080×1350 PNGs (IG's portrait carousel native size) with three slide
// kinds: cover, tip, cta. Rank-tier theming tints the accent stripe + badge.
//
// Pure canvas — no html2canvas, no extra deps. Mirrors the pattern in
// src/lib/share-cards.ts so we stay consistent across the codebase.

import { VALORANT as V } from "@/lib/features/theme/valorant-theme";
import { RANK_THEMES, type RankTier } from "./rank-themes";

export const SLIDE_W = 1080;
export const SLIDE_H = 1350;
const PAD = 80;
const FONT = '"Geist", "Geist Sans", system-ui, -apple-system, sans-serif';
const FONT_DISPLAY = '"Geist", "Geist Sans", system-ui, sans-serif';

export type SlideKind = "cover" | "tip" | "cta";

export interface CarouselSlide {
  kind: SlideKind;
  rank: RankTier;
  title: string;
  body: string;
  /** "2 / 5" style page marker — auto-filled when rendering a deck. */
  index?: number;
  total?: number;
}

export interface CarouselDeck {
  slides: CarouselSlide[];
  /** Optional URL printed on the CTA slide footer. */
  ctaUrl?: string;
  /** Optional handle on the CTA slide. */
  handle?: string;
}

// ── Canvas helpers (kept local — share-cards' helpers use OffscreenCanvas
//    types that don't carry over cleanly, so we duplicate the small ones)

function wrap(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines?: number,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return y;
  let line = "";
  let lines = 0;
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    const w = ctx.measureText(test).width;
    if (w > maxW && line) {
      lines++;
      if (maxLines && lines >= maxLines && i < words.length - 1) {
        let t = line;
        while (ctx.measureText(t + "…").width > maxW && t.length) t = t.slice(0, -1);
        ctx.fillText(t + "…", x, curY);
        return curY + lineH;
      }
      ctx.fillText(line, x, curY);
      curY += lineH;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineH;
  }
  return curY;
}

function drawLogo(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  accent: string,
) {
  ctx.font = `900 italic ${size}px ${FONT_DISPLAY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = V.cream;
  ctx.fillText("gg", x, y);
  const ggW = ctx.measureText("gg").width;
  ctx.fillStyle = accent;
  ctx.fillText("Lobby", x + ggW, y);
}

function drawSkewedPill(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  textColor: string,
  fontPx = 22,
): { w: number; h: number } {
  // Approximate the homepage's -skew-x-12 look without transform overhead:
  // a parallelogram drawn manually.
  ctx.font = `900 ${fontPx}px ${FONT}`;
  const padX = 22;
  const padY = 12;
  const textW = ctx.measureText(text).width;
  const w = textW + padX * 2;
  const h = fontPx + padY * 2;
  const skew = h * 0.22;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2);
  return { w, h };
}

function drawBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  accent: string,
) {
  // Deep navy base
  ctx.fillStyle = V.bgDeep;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // Diagonal accent wash
  const wash = ctx.createLinearGradient(0, 0, SLIDE_W, SLIDE_H);
  wash.addColorStop(0, accent + "1a");
  wash.addColorStop(0.55, "transparent");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);

  // Subtle grid texture (very faint — adds the "tactical" feel without noise)
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let x = 0; x < SLIDE_W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SLIDE_H);
    ctx.stroke();
  }
  for (let y = 0; y < SLIDE_H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SLIDE_W, y);
    ctx.stroke();
  }

  // Top accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, SLIDE_W, 10);
}

function drawFooter(
  ctx: OffscreenCanvasRenderingContext2D,
  slide: CarouselSlide,
  accent: string,
) {
  // Watermark logo (bottom-left)
  drawLogo(ctx, PAD, SLIDE_H - PAD + 6, 36, accent);

  // Page indicator (bottom-right)
  if (slide.index && slide.total) {
    ctx.font = `800 24px ${FONT}`;
    ctx.fillStyle = V.textMuted;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      `${String(slide.index).padStart(2, "0")} / ${String(slide.total).padStart(2, "0")}`,
      SLIDE_W - PAD,
      SLIDE_H - PAD,
    );
  }

  // Bottom accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, SLIDE_H - 10, SLIDE_W, 10);
}

// ── Per-slide renderers ────────────────────────────────────────────────

function renderCover(
  ctx: OffscreenCanvasRenderingContext2D,
  slide: CarouselSlide,
) {
  const theme = RANK_THEMES[slide.rank];
  drawBackground(ctx, theme.accent);

  // Rank pill
  const pillY = 160;
  drawSkewedPill(
    ctx,
    theme.label.toUpperCase(),
    PAD,
    pillY,
    theme.accent,
    theme.textOnAccent,
    24,
  );

  // Eyebrow
  ctx.font = `900 22px ${FONT}`;
  ctx.fillStyle = V.textMuted;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("VALORANT · TIP DROP", PAD, pillY + 90);

  // Big italic title
  ctx.font = `900 italic 96px ${FONT_DISPLAY}`;
  ctx.fillStyle = V.cream;
  const titleY = wrap(ctx, slide.title.toUpperCase(), PAD, pillY + 170, SLIDE_W - PAD * 2, 102, 5);

  // Outlined echo word (decorative)
  ctx.font = `900 italic 110px ${FONT_DISPLAY}`;
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.accent;
  ctx.fillStyle = "transparent";
  ctx.strokeText("TIPS.", PAD, titleY + 100);

  // Body (small subline)
  if (slide.body) {
    ctx.font = `500 30px ${FONT}`;
    ctx.fillStyle = V.textMuted;
    wrap(ctx, slide.body, PAD, titleY + 160, SLIDE_W - PAD * 2, 42, 3);
  }

  // Swipe hint
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "right";
  ctx.fillText("SWIPE →", SLIDE_W - PAD, SLIDE_H - PAD - 70);

  drawFooter(ctx, slide, theme.accent);
}

function renderTip(
  ctx: OffscreenCanvasRenderingContext2D,
  slide: CarouselSlide,
) {
  const theme = RANK_THEMES[slide.rank];
  drawBackground(ctx, theme.accent);

  // Side accent rail (left edge)
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, 18, SLIDE_H);

  // Tip number (huge, outlined, top-right)
  if (slide.index) {
    ctx.font = `900 italic 280px ${FONT_DISPLAY}`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.accent + "66";
    ctx.fillStyle = "transparent";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.strokeText(String(slide.index).padStart(2, "0"), SLIDE_W - PAD, 280);
  }

  // Rank chip (small, top-left)
  drawSkewedPill(
    ctx,
    theme.label.toUpperCase(),
    PAD,
    140,
    theme.accent,
    theme.textOnAccent,
    18,
  );

  // Title
  ctx.font = `900 italic 64px ${FONT_DISPLAY}`;
  ctx.fillStyle = V.cream;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const titleEndY = wrap(
    ctx,
    slide.title.toUpperCase(),
    PAD,
    360,
    SLIDE_W - PAD * 2,
    74,
    4,
  );

  // Divider
  ctx.fillStyle = theme.accent;
  ctx.fillRect(PAD, titleEndY + 18, 110, 5);

  // Body
  ctx.font = `500 34px ${FONT}`;
  ctx.fillStyle = V.cream + "e6";
  wrap(
    ctx,
    slide.body,
    PAD,
    titleEndY + 80,
    SLIDE_W - PAD * 2,
    48,
    10,
  );

  drawFooter(ctx, slide, theme.accent);
}

function renderCta(
  ctx: OffscreenCanvasRenderingContext2D,
  slide: CarouselSlide,
  url: string,
  handle: string,
) {
  const theme = RANK_THEMES[slide.rank];
  drawBackground(ctx, theme.accent);

  // Big centered logo
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `900 italic 110px ${FONT_DISPLAY}`;
  // We need to color "gg" cream and "Lobby" accent, so split it manually
  const ggMetrics = ctx.measureText("gg");
  const lobbyMetrics = ctx.measureText("Lobby");
  const totalW = ggMetrics.width + lobbyMetrics.width;
  const startX = (SLIDE_W - totalW) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = V.cream;
  ctx.fillText("gg", startX, 380);
  ctx.fillStyle = theme.accent;
  ctx.fillText("Lobby", startX + ggMetrics.width, 380);

  // Tagline
  ctx.font = `900 italic 56px ${FONT_DISPLAY}`;
  ctx.fillStyle = V.cream;
  ctx.textAlign = "center";
  ctx.fillText((slide.title || "INDIA'S VALORANT HOME").toUpperCase(), SLIDE_W / 2, 500);

  // Body
  if (slide.body) {
    ctx.font = `500 32px ${FONT}`;
    ctx.fillStyle = V.textMuted;
    wrap(
      ctx,
      slide.body,
      PAD,
      580,
      SLIDE_W - PAD * 2,
      44,
      4,
    );
  }

  // CTA button (centered)
  const btnText = "TAP THE LINK IN BIO";
  ctx.font = `900 32px ${FONT}`;
  const btnW = ctx.measureText(btnText).width + 80;
  const btnX = (SLIDE_W - btnW) / 2;
  const btnY = 870;
  drawSkewedPill(
    ctx,
    btnText,
    btnX,
    btnY,
    theme.accent,
    theme.textOnAccent,
    32,
  );

  // URL line
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = V.cream;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(url, SLIDE_W / 2, btnY + 150);

  // Handle
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText(handle, SLIDE_W / 2, btnY + 200);

  drawFooter(ctx, slide, theme.accent);
}

// ── Public API ─────────────────────────────────────────────────────────

export async function renderSlide(
  slide: CarouselSlide,
  deck: { ctaUrl?: string; handle?: string } = {},
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = new OffscreenCanvas(SLIDE_W, SLIDE_H);
  const ctx = canvas.getContext("2d")!;

  switch (slide.kind) {
    case "cover":
      renderCover(ctx, slide);
      break;
    case "tip":
      renderTip(ctx, slide);
      break;
    case "cta":
      renderCta(
        ctx,
        slide,
        deck.ctaUrl || "gglobby.in",
        deck.handle || "@gglobby.in",
      );
      break;
  }

  return canvas.convertToBlob({ type: "image/png" });
}

export async function renderDeck(deck: CarouselDeck): Promise<Blob[]> {
  const total = deck.slides.length;
  const stamped = deck.slides.map((s, i) => ({ ...s, index: i + 1, total }));
  return Promise.all(
    stamped.map((s) =>
      renderSlide(s, { ctaUrl: deck.ctaUrl, handle: deck.handle }),
    ),
  );
}

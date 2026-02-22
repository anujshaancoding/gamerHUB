import QRCode from "qrcode";
import {
  BLOG_COLOR_PALETTES,
  BLOG_CATEGORIES,
  type BlogCategory,
  type BlogColorPalette,
} from "@/types/blog";

// ── Shareable Post — works with BlogPost, CommunityPost, etc. ─────────
export interface ShareablePost {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  featured_image_url?: string | null;
  category?: BlogCategory | string;
  tags?: string[];
  color_palette?: BlogColorPalette | string | null;
  published_at?: string | null;
  created_at?: string;
  meta_description?: string | null;
  author?: {
    display_name?: string | null;
    username?: string;
  } | null;
}

// ── Constants ──────────────────────────────────────────────────────────
const CARD_SIZE = 1080;
const PADDING = 80;
const INNER_WIDTH = CARD_SIZE - PADDING * 2;
const FONT_STACK = '"Geist", "Geist Sans", system-ui, -apple-system, sans-serif';

interface CardPalette {
  primary: string;
  secondary: string;
  background: string;
}

function getPalette(id?: BlogColorPalette | string | null): CardPalette {
  const key = (id || "neon_surge") as BlogColorPalette;
  const p = BLOG_COLOR_PALETTES[key] || BLOG_COLOR_PALETTES.neon_surge;
  return {
    primary: p.primaryHex,
    secondary: p.secondaryHex,
    background: p.backgroundHex,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Fetch an image and return an ImageBitmap ready for OffscreenCanvas drawing. */
async function loadImage(url: string): Promise<ImageBitmap> {
  let blob: Blob | null = null;

  if (url.startsWith("data:")) {
    // data: URLs can be fetched directly
    const res = await fetch(url);
    blob = await res.blob();
  } else {
    // Strategy 1: direct fetch
    try {
      const res = await fetch(url);
      if (res.ok) blob = await res.blob();
    } catch (e) {
      console.warn("[share-cards] Direct fetch failed:", url, e);
    }

    // Strategy 2: proxy through Next.js image optimizer (same-origin)
    if (!blob) {
      try {
        const proxyUrl = `/_next/image?url=${encodeURIComponent(url)}&w=1080&q=90`;
        const res = await fetch(proxyUrl);
        if (res.ok) blob = await res.blob();
      } catch (e) {
        console.warn("[share-cards] Proxy fetch failed:", url, e);
      }
    }
  }

  if (!blob) throw new Error(`Failed to fetch image: ${url}`);

  return createImageBitmap(blob);
}

/** Lighten a hex colour by a fixed amount (0-255 per channel). */
function lightenColor(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Strip HTML tags and return the first ~300 chars. */
function extractFirstParagraph(html: string): string {
  const stripped = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 300 ? stripped.slice(0, 300) + "..." : stripped;
}

/** Draw a rounded rectangle path (does NOT fill/stroke — caller decides). */
function roundRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw word-wrapped text. Returns the Y after the last rendered line.
 * Supports maxLines with "…" truncation.
 */
function drawWrappedText(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines?: number,
): number {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const test = line + (line ? " " : "") + words[i];
    const w = ctx.measureText(test).width;

    if (w > maxWidth && line !== "") {
      lineCount++;
      if (maxLines && lineCount >= maxLines) {
        let t = line;
        while (ctx.measureText(t + "...").width > maxWidth && t.length > 0)
          t = t.slice(0, -1);
        ctx.fillText(t + "...", x, curY);
        return curY + lineHeight;
      }
      ctx.fillText(line, x, curY);
      curY += lineHeight;
      line = words[i];
    } else {
      line = test;
    }
  }

  if (line) {
    lineCount++;
    if (maxLines && lineCount > maxLines) {
      let t = line;
      while (ctx.measureText(t + "...").width > maxWidth && t.length > 0)
        t = t.slice(0, -1);
      ctx.fillText(t + "...", x, curY);
    } else {
      ctx.fillText(line, x, curY);
    }
    curY += lineHeight;
  }

  return curY;
}

/** Draw the "ggLobby" watermark. */
function drawWatermark(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  palette: CardPalette,
  size = 28,
) {
  ctx.font = `bold ${size}px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.primary;
  ctx.fillText("gg", x, y);
  const ggW = ctx.measureText("gg").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Lobby", x + ggW, y);
}

/** Create the shared accent gradient (primary → secondary) across full width. */
function accentGradient(
  ctx: OffscreenCanvasRenderingContext2D,
  palette: CardPalette,
): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, CARD_SIZE, 0);
  g.addColorStop(0, palette.primary);
  g.addColorStop(1, palette.secondary);
  return g;
}

// ── Card 1: Hero ───────────────────────────────────────────────────────

export async function generateHeroCard(post: ShareablePost): Promise<Blob> {
  const canvas = new OffscreenCanvas(CARD_SIZE, CARD_SIZE);
  const ctx = canvas.getContext("2d")!;
  const palette = getPalette(post.color_palette);
  const catInfo = post.category ? BLOG_CATEGORIES[post.category as BlogCategory] : null;

  // Background — featured image or gradient fallback
  if (post.featured_image_url) {
    try {
      const img = await loadImage(post.featured_image_url);
      const scale = Math.max(CARD_SIZE / img.width, CARD_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (CARD_SIZE - w) / 2, (CARD_SIZE - h) / 2, w, h);
      // image loaded successfully
    } catch (err) {
      console.error("[share-cards] Hero image load failed:", post.featured_image_url, err);
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
    grad.addColorStop(0, palette.background);
    grad.addColorStop(1, lightenColor(palette.background, 20));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
    // Decorative accent stripe
    ctx.fillStyle = palette.primary + "15";
    ctx.fillRect(0, CARD_SIZE * 0.3, CARD_SIZE, CARD_SIZE * 0.4);
  }

  // Dark gradient overlay
  const overlay = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  overlay.addColorStop(0, "rgba(0,0,0,0.2)");
  overlay.addColorStop(0.4, "rgba(0,0,0,0.4)");
  overlay.addColorStop(0.7, "rgba(0,0,0,0.75)");
  overlay.addColorStop(1, "rgba(0,0,0,0.92)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Top accent line
  ctx.fillStyle = accentGradient(ctx, palette);
  ctx.fillRect(0, 0, CARD_SIZE, 6);

  // Category badge
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const badgeText = (catInfo?.label ?? post.category).toUpperCase();
  ctx.font = `bold 22px ${FONT_STACK}`;
  const bm = ctx.measureText(badgeText);
  const bpH = 24;
  const bpV = 14;
  const bW = bm.width + bpH * 2;
  const bH = 22 + bpV * 2;
  const bY = 80;

  ctx.fillStyle = palette.primary + "30";
  roundRect(ctx, PADDING, bY, bW, bH, 8);
  ctx.fill();
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 1.5;
  roundRect(ctx, PADDING, bY, bW, bH, 8);
  ctx.stroke();
  ctx.fillStyle = palette.primary;
  ctx.fillText(badgeText, PADDING + bpH, bY + bpV + 2);

  // Title (lower half)
  let titleY = CARD_SIZE - 380;
  ctx.font = `bold 52px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  titleY = drawWrappedText(ctx, post.title, PADDING, titleY, INNER_WIDTH, 64, 4);

  // Separator line
  const sepY = titleY + 20;
  ctx.fillStyle = palette.primary;
  ctx.fillRect(PADDING, sepY, 80, 3);

  // Author + date
  const metaY = sepY + 30;
  const authorName =
    post.author?.display_name || post.author?.username || "ggLobby Author";
  ctx.font = `500 24px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffffcc";
  ctx.fillText(authorName, PADDING, metaY);

  const dateStr = post.published_at || post.created_at;
  if (dateStr) {
    const date = new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    ctx.font = `400 20px ${FONT_STACK}`;
    ctx.fillStyle = "#ffffff80";
    ctx.fillText(date, PADDING, metaY + 36);
  }

  // Watermark (bottom-right)
  drawWatermark(ctx, CARD_SIZE - 220, CARD_SIZE - PADDING + 10, palette);

  return canvas.convertToBlob({ type: "image/png" });
}

// ── Card 2: Summary ────────────────────────────────────────────────────

export async function generateSummaryCard(post: ShareablePost): Promise<Blob> {
  const canvas = new OffscreenCanvas(CARD_SIZE, CARD_SIZE);
  const ctx = canvas.getContext("2d")!;
  const palette = getPalette(post.color_palette);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  bgGrad.addColorStop(0, palette.background);
  bgGrad.addColorStop(1, lightenColor(palette.background, 8));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Decorative corner accents
  ctx.strokeStyle = palette.primary + "40";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 100);
  ctx.lineTo(40, 40);
  ctx.lineTo(100, 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CARD_SIZE - 40, CARD_SIZE - 100);
  ctx.lineTo(CARD_SIZE - 40, CARD_SIZE - 40);
  ctx.lineTo(CARD_SIZE - 100, CARD_SIZE - 40);
  ctx.stroke();

  // Top accent line
  ctx.fillStyle = accentGradient(ctx, palette);
  ctx.fillRect(0, 0, CARD_SIZE, 6);

  // Large decorative quotation mark
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `bold 180px Georgia, serif`;
  ctx.fillStyle = palette.primary + "15";
  ctx.fillText("\u201C", PADDING - 20, 60);

  // Title (smaller, for context)
  ctx.font = `bold 32px ${FONT_STACK}`;
  ctx.fillStyle = palette.primary;
  const titleEndY = drawWrappedText(
    ctx,
    post.title,
    PADDING,
    160,
    INNER_WIDTH,
    40,
    2,
  );

  // Separator
  ctx.fillStyle = palette.secondary + "60";
  ctx.fillRect(PADDING, titleEndY + 16, 60, 2);

  // Excerpt / summary text
  const excerptText =
    post.excerpt ||
    (post as { meta_description?: string | null }).meta_description ||
    extractFirstParagraph(post.content);
  ctx.font = `400 30px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffffdd";
  drawWrappedText(
    ctx,
    excerptText,
    PADDING,
    titleEndY + 50,
    INNER_WIDTH,
    44,
    10,
  );

  // Tags
  if (post.tags?.length) {
    const tagsY = CARD_SIZE - 180;
    let tagX = PADDING;
    ctx.font = `500 20px ${FONT_STACK}`;
    ctx.textBaseline = "top";
    for (const tag of post.tags.slice(0, 4)) {
      const label = `#${tag}`;
      const tw = ctx.measureText(label).width + 24;
      if (tagX + tw > CARD_SIZE - PADDING) break;
      ctx.fillStyle = palette.primary + "20";
      roundRect(ctx, tagX, tagsY, tw, 36, 18);
      ctx.fill();
      ctx.fillStyle = palette.primary;
      ctx.fillText(label, tagX + 12, tagsY + 9);
      tagX += tw + 10;
    }
  }

  // Watermark
  drawWatermark(ctx, CARD_SIZE - 220, CARD_SIZE - PADDING + 10, palette);

  return canvas.convertToBlob({ type: "image/png" });
}

// ── Card 3: CTA / Branding ────────────────────────────────────────────

export async function generateCtaCard(
  post: ShareablePost,
  articleUrl: string,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(CARD_SIZE, CARD_SIZE);
  const ctx = canvas.getContext("2d")!;
  const palette = getPalette(post.color_palette);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  bgGrad.addColorStop(0, palette.background);
  bgGrad.addColorStop(0.6, palette.background);
  bgGrad.addColorStop(1, lightenColor(palette.background, 5));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Radial glow behind QR area
  const radGrad = ctx.createRadialGradient(
    CARD_SIZE / 2, 480, 10,
    CARD_SIZE / 2, 480, 320,
  );
  radGrad.addColorStop(0, palette.primary + "12");
  radGrad.addColorStop(1, "transparent");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Top accent line
  ctx.fillStyle = accentGradient(ctx, palette);
  ctx.fillRect(0, 0, CARD_SIZE, 6);

  // Large "ggLobby" logo text (centred)
  ctx.textBaseline = "top";
  ctx.font = `bold 64px ${FONT_STACK}`;
  const ggW = ctx.measureText("gg").width;
  const lobbyW = ctx.measureText("Lobby").width;
  const startX = (CARD_SIZE - (ggW + lobbyW)) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = palette.primary;
  ctx.fillText("gg", startX, 120);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Lobby", startX + ggW, 120);

  // "Read the full article at"
  ctx.textAlign = "center";
  ctx.font = `bold 36px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Read the full article at", CARD_SIZE / 2, 230);

  // URL
  ctx.font = `500 28px ${FONT_STACK}`;
  ctx.fillStyle = palette.primary;
  ctx.fillText("gglobby.in", CARD_SIZE / 2, 280);

  // QR Code
  const qrSize = 280;
  const qrX = (CARD_SIZE - qrSize) / 2;
  const qrY = 340;

  try {
    const qrDataUrl = await QRCode.toDataURL(articleUrl, {
      width: qrSize,
      margin: 2,
      color: { dark: palette.primary, light: "#00000000" },
      errorCorrectionLevel: "M",
    });
    const qrImg = await loadImage(qrDataUrl);

    // QR border box
    ctx.strokeStyle = palette.primary + "40";
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 16);
    ctx.stroke();

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    // qr image drawn
  } catch {
    // Fallback — just show the URL more prominently
    ctx.font = `500 26px ${FONT_STACK}`;
    ctx.fillStyle = palette.primary;
    ctx.fillText(articleUrl, CARD_SIZE / 2, qrY + qrSize / 2);
  }

  // "Scan to read"
  ctx.textAlign = "center";
  ctx.font = `400 22px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff80";
  ctx.fillText("Scan to read", CARD_SIZE / 2, qrY + qrSize + 40);

  // Social handle
  const socialY = qrY + qrSize + 100;
  ctx.fillStyle = palette.secondary + "60";
  ctx.fillRect(CARD_SIZE / 2 - 30, socialY - 20, 60, 2);
  ctx.font = `500 24px ${FONT_STACK}`;
  ctx.fillStyle = palette.secondary;
  ctx.fillText("@gglobby.in", CARD_SIZE / 2, socialY + 16);

  // "Join the Gaming Community"
  ctx.font = `600 28px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffffcc";
  ctx.fillText("Join the Gaming Community", CARD_SIZE / 2, socialY + 60);

  // Bottom accent bar
  ctx.fillStyle = accentGradient(ctx, palette);
  ctx.fillRect(0, CARD_SIZE - 6, CARD_SIZE, 6);

  // Reset alignment
  ctx.textAlign = "start";

  return canvas.convertToBlob({ type: "image/png" });
}

// ── Public API ─────────────────────────────────────────────────────────

export interface ShareCardSet {
  hero: Blob;
  summary: Blob;
  cta: Blob;
}

export async function generateAllShareCards(
  post: ShareablePost,
  articleUrl: string,
): Promise<ShareCardSet> {
  // Wait for fonts (resolves instantly if already loaded)
  await document.fonts.ready;

  const [hero, summary, cta] = await Promise.all([
    generateHeroCard(post),
    generateSummaryCard(post),
    generateCtaCard(post, articleUrl),
  ]);
  return { hero, summary, cta };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllCards(cards: ShareCardSet, slug: string) {
  downloadBlob(cards.hero, `${slug}-hero.png`);
  setTimeout(() => downloadBlob(cards.summary, `${slug}-summary.png`), 100);
  setTimeout(() => downloadBlob(cards.cta, `${slug}-cta.png`), 200);
}

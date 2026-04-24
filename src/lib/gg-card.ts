import QRCode from "qrcode";

// ── GG Card — Shareable Gamer Identity Card ──────────────────────────
// Uses OffscreenCanvas (client-side) to generate a portrait image
// that users can download/share on social media.

export interface GGCardData {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  region: string | null;
  level: number;
  currentXp: number;
  xpToNext: number;
  totalXp: number;
  prestigeLevel: number;
  matchesPlayed: number;
  matchesWon: number;
  currentStreak: number;
  bestStreak: number;
  gamesLinked: number;
  badgeCount: number;
  isPremium: boolean;
  clanName: string | null;
  clanTag: string | null;
  primaryGame: {
    name: string;
    rank?: string | null;
    role?: string | null;
    iconUrl?: string | null;
  } | null;
  // Game theme colors
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    glow: string;
  };
}

// ── Constants ────────────────────────────────────────────────────────
const CARD_W = 1080;
const CARD_H = 1350;
const PAD = 64;
const INNER_W = CARD_W - PAD * 2;
const FONT = '"Geist", "Geist Sans", system-ui, -apple-system, sans-serif';

// ── Helpers ──────────────────────────────────────────────────────────

async function loadImage(url: string): Promise<ImageBitmap> {
  let blob: Blob | null = null;

  if (url.startsWith("data:")) {
    const res = await fetch(url);
    blob = await res.blob();
  } else {
    // Strategy 1: direct fetch
    try {
      const res = await fetch(url);
      if (res.ok) blob = await res.blob();
    } catch { /* next strategy */ }

    // Strategy 2: image proxy
    if (!blob) {
      try {
        const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
        if (res.ok) blob = await res.blob();
      } catch { /* next strategy */ }
    }

    // Strategy 3: Next.js image optimizer
    if (!blob) {
      try {
        const res = await fetch(`/_next/image?url=${encodeURIComponent(url)}&w=1080&q=90`);
        if (res.ok) blob = await res.blob();
      } catch { /* give up */ }
    }
  }

  if (!blob) throw new Error(`Failed to fetch image: ${url}`);
  return createImageBitmap(blob);
}

function roundRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── Main Generator ───────────────────────────────────────────────────

export async function generateGGCard(data: GGCardData): Promise<Blob> {
  const canvas = new OffscreenCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext("2d")!;
  const c = data.themeColors;

  // ─── Background ────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bgGrad.addColorStop(0, c.background);
  bgGrad.addColorStop(0.3, lighten(c.background, 8));
  bgGrad.addColorStop(1, c.background);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle radial glow behind avatar area
  const radGlow = ctx.createRadialGradient(CARD_W / 2, 260, 20, CARD_W / 2, 260, 400);
  radGlow.addColorStop(0, hexToRgba(c.primary, 0.12));
  radGlow.addColorStop(1, "transparent");
  ctx.fillStyle = radGlow;
  ctx.fillRect(0, 0, CARD_W, 600);

  // ─── Top Accent Bar ────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(0, 0, CARD_W, 0);
  accentGrad.addColorStop(0, c.primary);
  accentGrad.addColorStop(0.5, c.accent);
  accentGrad.addColorStop(1, c.primary);
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, CARD_W, 6);

  // ─── Banner Area ───────────────────────────────────────────
  const bannerH = 240;
  let bannerLoaded = false;
  if (data.bannerUrl) {
    try {
      const bannerImg = await loadImage(data.bannerUrl);
      const scale = Math.max(CARD_W / bannerImg.width, bannerH / bannerImg.height);
      const bw = bannerImg.width * scale;
      const bh = bannerImg.height * scale;
      ctx.drawImage(bannerImg, (CARD_W - bw) / 2, 6 + (bannerH - bh) / 2, bw, bh);
      bannerLoaded = true;
    } catch { /* use fallback */ }
  }
  if (!bannerLoaded) {
    const fallback = ctx.createLinearGradient(0, 6, CARD_W, bannerH + 6);
    fallback.addColorStop(0, hexToRgba(c.primary, 0.3));
    fallback.addColorStop(0.5, hexToRgba(c.accent, 0.15));
    fallback.addColorStop(1, hexToRgba(c.primary, 0.05));
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 6, CARD_W, bannerH);
  }

  // Banner fade-out overlay
  const bannerFade = ctx.createLinearGradient(0, bannerH - 80, 0, bannerH + 6);
  bannerFade.addColorStop(0, "rgba(10,10,15,0)");
  bannerFade.addColorStop(1, c.background);
  ctx.fillStyle = bannerFade;
  ctx.fillRect(0, bannerH - 80, CARD_W, 86);

  // ─── Decorative corner accents ─────────────────────────────
  ctx.strokeStyle = hexToRgba(c.primary, 0.25);
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(PAD - 20, 6 + 60);
  ctx.lineTo(PAD - 20, 6 + 20);
  ctx.lineTo(PAD + 20, 6 + 20);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(CARD_W - PAD + 20, 6 + 60);
  ctx.lineTo(CARD_W - PAD + 20, 6 + 20);
  ctx.lineTo(CARD_W - PAD - 20, 6 + 20);
  ctx.stroke();

  // ─── Avatar ────────────────────────────────────────────────
  const avatarSize = 160;
  const avatarX = CARD_W / 2;
  const avatarY = bannerH - 20;

  // Glow ring behind avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 4;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();

  // Avatar background circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = c.background;
  ctx.fill();

  // Clip and draw avatar
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();

  if (data.avatarUrl) {
    try {
      const avatarImg = await loadImage(data.avatarUrl);
      ctx.drawImage(
        avatarImg,
        avatarX - avatarSize / 2,
        avatarY - avatarSize / 2,
        avatarSize,
        avatarSize,
      );
    } catch {
      // Fallback: colored circle with initial
      ctx.fillStyle = hexToRgba(c.primary, 0.3);
      ctx.fill();
      ctx.fillStyle = c.primary;
      ctx.font = `bold 64px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        (data.displayName || data.username).charAt(0).toUpperCase(),
        avatarX,
        avatarY,
      );
    }
  } else {
    ctx.fillStyle = hexToRgba(c.primary, 0.3);
    ctx.fill();
    ctx.fillStyle = c.primary;
    ctx.font = `bold 64px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      (data.displayName || data.username).charAt(0).toUpperCase(),
      avatarX,
      avatarY,
    );
  }
  ctx.restore();

  // Premium badge on avatar
  if (data.isPremium) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2 - 10, avatarY + avatarSize / 2 - 10, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "rgba(255,215,0,0.6)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    // Crown icon (simple)
    ctx.fillStyle = c.background;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", avatarX + avatarSize / 2 - 10, avatarY + avatarSize / 2 - 10);
  }

  // ─── Level Badge ───────────────────────────────────────────
  const lvlBadgeX = avatarX - avatarSize / 2 - 5;
  const lvlBadgeY = avatarY + avatarSize / 2 - 25;
  const lvlText = `LV ${data.level}`;
  ctx.font = `bold 20px ${FONT}`;
  const lvlW = ctx.measureText(lvlText).width + 24;
  ctx.save();
  roundRect(ctx, lvlBadgeX - lvlW / 2, lvlBadgeY - 14, lvlW, 28, 14);
  ctx.fillStyle = c.primary;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = c.background;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lvlText, lvlBadgeX, lvlBadgeY);

  // ─── Username & Display Name ───────────────────────────────
  let curY = avatarY + avatarSize / 2 + 30;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Display name
  const name = data.displayName || data.username;
  ctx.font = `bold 48px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, CARD_W / 2, curY, INNER_W);
  curY += 58;

  // @username
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = hexToRgba(c.primary, 0.8);
  ctx.fillText(`@${data.username}`, CARD_W / 2, curY);
  curY += 38;

  // Region + Clan tag line
  const tagParts: string[] = [];
  if (data.region) tagParts.push(data.region.toUpperCase());
  if (data.clanName) tagParts.push(`[${data.clanTag || data.clanName}]`);
  if (tagParts.length > 0) {
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = "#ffffff60";
    ctx.fillText(tagParts.join("  •  "), CARD_W / 2, curY);
    curY += 34;
  }

  // ─── Separator ─────────────────────────────────────────────
  curY += 12;
  const sepGrad = ctx.createLinearGradient(PAD + 100, 0, CARD_W - PAD - 100, 0);
  sepGrad.addColorStop(0, "transparent");
  sepGrad.addColorStop(0.3, hexToRgba(c.primary, 0.5));
  sepGrad.addColorStop(0.7, hexToRgba(c.primary, 0.5));
  sepGrad.addColorStop(1, "transparent");
  ctx.fillStyle = sepGrad;
  ctx.fillRect(PAD + 100, curY, INNER_W - 200, 2);
  curY += 30;

  // ─── Primary Game + Rank ───────────────────────────────────
  if (data.primaryGame) {
    const gameY = curY;
    const gameBoxH = 80;

    // Game card background
    roundRect(ctx, PAD + 40, gameY, INNER_W - 80, gameBoxH, 16);
    ctx.fillStyle = hexToRgba(c.primary, 0.08);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(c.primary, 0.2);
    ctx.lineWidth = 1.5;
    roundRect(ctx, PAD + 40, gameY, INNER_W - 80, gameBoxH, 16);
    ctx.stroke();

    // Game icon
    let iconDrawn = false;
    if (data.primaryGame.iconUrl) {
      try {
        const icon = await loadImage(data.primaryGame.iconUrl);
        const iconSize = 48;
        const iconX = PAD + 70;
        const iconY = gameY + (gameBoxH - iconSize) / 2;
        ctx.save();
        roundRect(ctx, iconX, iconY, iconSize, iconSize, 10);
        ctx.clip();
        ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
        ctx.restore();
        iconDrawn = true;
      } catch { /* skip icon */ }
    }

    const textStartX = iconDrawn ? PAD + 135 : PAD + 80;

    // Game name
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.primaryGame.name, textStartX, gameY + gameBoxH / 2 - 12);

    // Rank
    if (data.primaryGame.rank) {
      ctx.font = `600 22px ${FONT}`;
      ctx.fillStyle = c.primary;
      ctx.fillText(data.primaryGame.rank, textStartX, gameY + gameBoxH / 2 + 18);
    }

    // Role badge (right-aligned)
    if (data.primaryGame.role) {
      ctx.textAlign = "right";
      ctx.font = `500 20px ${FONT}`;
      ctx.fillStyle = hexToRgba(c.accent, 0.8);
      ctx.fillText(data.primaryGame.role, CARD_W - PAD - 70, gameY + gameBoxH / 2);
    }

    curY = gameY + gameBoxH + 28;
  }

  // ─── XP Progress Bar ──────────────────────────────────────
  const xpBarY = curY;
  const xpBarH = 14;
  const xpBarX = PAD + 40;
  const xpBarW = INNER_W - 80;
  const xpProgress = data.xpToNext > 0 ? Math.min(data.currentXp / data.xpToNext, 1) : 0;

  // Label
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = "#ffffff80";
  ctx.fillText("XP PROGRESS", xpBarX, xpBarY - 6);

  ctx.textAlign = "right";
  ctx.fillStyle = c.primary;
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText(`${data.currentXp.toLocaleString()} / ${data.xpToNext.toLocaleString()} XP`, xpBarX + xpBarW, xpBarY - 6);

  // Bar background
  roundRect(ctx, xpBarX, xpBarY, xpBarW, xpBarH, xpBarH / 2);
  ctx.fillStyle = "#ffffff12";
  ctx.fill();

  // Bar fill
  if (xpProgress > 0) {
    const fillW = Math.max(xpBarH, xpBarW * xpProgress);
    roundRect(ctx, xpBarX, xpBarY, fillW, xpBarH, xpBarH / 2);
    const barGrad = ctx.createLinearGradient(xpBarX, 0, xpBarX + fillW, 0);
    barGrad.addColorStop(0, c.primary);
    barGrad.addColorStop(1, c.accent);
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  curY = xpBarY + xpBarH + 36;

  // ─── Stats Grid (2x2) ─────────────────────────────────────
  const statBoxW = (INNER_W - 80 - 20) / 2; // 2 columns with 20px gap
  const statBoxH = 90;
  const statsX = PAD + 40;
  const winRate =
    data.matchesPlayed > 0
      ? Math.round((data.matchesWon / data.matchesPlayed) * 100)
      : 0;

  const stats = [
    { label: "MATCHES", value: data.matchesPlayed.toLocaleString(), icon: "⚔" },
    { label: "WIN RATE", value: `${winRate}%`, icon: "🏆" },
    { label: "BEST STREAK", value: data.bestStreak.toString(), icon: "🔥" },
    { label: "GAMES", value: data.gamesLinked.toString(), icon: "🎮" },
  ];

  for (let i = 0; i < stats.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = statsX + col * (statBoxW + 20);
    const sy = curY + row * (statBoxH + 16);

    // Stat box
    roundRect(ctx, sx, sy, statBoxW, statBoxH, 14);
    ctx.fillStyle = hexToRgba(c.primary, 0.06);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(c.primary, 0.15);
    ctx.lineWidth = 1;
    roundRect(ctx, sx, sy, statBoxW, statBoxH, 14);
    ctx.stroke();

    // Icon
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `28px ${FONT}`;
    ctx.fillText(stats[i].icon, sx + 18, sy + 14);

    // Value
    ctx.font = `bold 34px ${FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(stats[i].value, sx + statBoxW - 18, sy + 12);

    // Label
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = "#ffffff50";
    ctx.textAlign = "right";
    ctx.fillText(stats[i].label, sx + statBoxW - 18, sy + 56);
  }

  curY += 2 * statBoxH + 16 + 40;

  // ─── Bottom: QR Code + Branding ────────────────────────────
  const profileUrl = `https://gglobby.in/profile/${data.username}`;
  const bottomY = CARD_H - 200;

  // Bottom separator
  const btmSep = ctx.createLinearGradient(PAD, 0, CARD_W - PAD, 0);
  btmSep.addColorStop(0, "transparent");
  btmSep.addColorStop(0.2, hexToRgba(c.primary, 0.3));
  btmSep.addColorStop(0.8, hexToRgba(c.primary, 0.3));
  btmSep.addColorStop(1, "transparent");
  ctx.fillStyle = btmSep;
  ctx.fillRect(PAD, bottomY, INNER_W, 1);

  // QR Code (left side)
  const qrSize = 130;
  const qrX = PAD + 50;
  const qrY = bottomY + 28;

  try {
    const qrData = QRCode.create(profileUrl, { errorCorrectionLevel: "M" });
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const margin = 2;
    const totalModules = moduleCount + margin * 2;
    const moduleSize = qrSize / totalModules;

    // QR border
    ctx.strokeStyle = hexToRgba(c.primary, 0.3);
    ctx.lineWidth = 1.5;
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12);
    ctx.stroke();

    // QR modules
    ctx.fillStyle = c.primary;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          ctx.fillRect(
            qrX + (col + margin) * moduleSize,
            qrY + (row + margin) * moduleSize,
            Math.ceil(moduleSize),
            Math.ceil(moduleSize),
          );
        }
      }
    }
  } catch {
    // Fallback — URL text
    ctx.textAlign = "left";
    ctx.font = `500 18px ${FONT}`;
    ctx.fillStyle = c.primary;
    ctx.fillText(profileUrl, qrX, qrY + qrSize / 2);
  }

  // "Scan to view profile"
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `400 16px ${FONT}`;
  ctx.fillStyle = "#ffffff40";
  ctx.fillText("Scan to view profile", qrX - 5, qrY + qrSize + 18);

  // ggLobby branding (right side)
  const brandX = CARD_W - PAD - 50;
  const brandY = bottomY + 45;

  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  // "gg" in primary, "Lobby" in white
  ctx.font = `bold 44px ${FONT}`;
  const lobbyW = ctx.measureText("Lobby").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Lobby", brandX, brandY);
  ctx.fillStyle = c.primary;
  ctx.fillText("gg", brandX - lobbyW, brandY);

  // Tagline
  ctx.font = `500 18px ${FONT}`;
  ctx.fillStyle = "#ffffff50";
  ctx.fillText("Find Your Squad", brandX, brandY + 54);

  // @gglobby.in
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = hexToRgba(c.accent, 0.7);
  ctx.fillText("@gglobby.in", brandX, brandY + 84);

  // ─── Bottom Accent Bar ─────────────────────────────────────
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, CARD_H - 6, CARD_W, 6);

  // ─── Decorative corner accents (bottom) ────────────────────
  ctx.strokeStyle = hexToRgba(c.primary, 0.25);
  ctx.lineWidth = 2;
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(PAD - 20, CARD_H - 60);
  ctx.lineTo(PAD - 20, CARD_H - 20);
  ctx.lineTo(PAD + 20, CARD_H - 20);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(CARD_W - PAD + 20, CARD_H - 60);
  ctx.lineTo(CARD_W - PAD + 20, CARD_H - 20);
  ctx.lineTo(CARD_W - PAD - 20, CARD_H - 20);
  ctx.stroke();

  return canvas.convertToBlob({ type: "image/png" });
}

// ── Download helper ──────────────────────────────────────────────────

export function downloadGGCard(blob: Blob, username: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${username}-gg-card.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

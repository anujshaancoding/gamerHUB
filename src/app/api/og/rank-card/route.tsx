import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { normaliseTier, rankIconUrl, rankTierNumber, VALORANT_TIERS } from "@/lib/features/tools/valorant-ranks";
import { agentPortrait, findAgent } from "@/lib/data/valorant-agents";
import { MAPS, mapSplash, type ValorantMap } from "@/lib/data/valorant-maps";
import { findWeapon, weaponDisplayIconUrl } from "@/lib/tracker/valorant-assets";

export const runtime = "nodejs";

type SatoriFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700 | 800 | 900; style: "normal" };

// Card fonts for Satori: Outfit for labels/UI, Teko (tall condensed) for the
// rating and rank, Black Ops One (military stencil) for the player name.
// Fetched once per server lifetime and cached. An IE11 user-agent makes
// Google serve TTF (Satori cannot parse woff2). Fully guarded — any failure
// falls back to the built-in font, never a 500.
let fontsCache: SatoriFont[] | null = null;
async function loadFonts(): Promise<SatoriFont[]> {
  if (fontsCache) return fontsCache;
  const wanted: Array<{ family: string; weight: SatoriFont["weight"] }> = [
    { family: "Outfit", weight: 400 },
    { family: "Outfit", weight: 700 },
    { family: "Outfit", weight: 900 },
    { family: "Teko", weight: 500 },
    { family: "Teko", weight: 600 },
    { family: "Teko", weight: 700 },
    { family: "Black Ops One", weight: 400 },
  ];
  const loaded: SatoriFont[] = [];
  for (const { family, weight } of wanted) {
    try {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
          },
        },
      ).then((r) => r.text());
      const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
      if (!url) continue;
      const data = await fetch(url).then((r) => r.arrayBuffer());
      loaded.push({ name: family, data, weight, style: "normal" });
    } catch {
      /* skip this weight */
    }
  }
  if (loaded.length) fontsCache = loaded;
  return loaded;
}

type CardSource = "manual" | "career";
type CardTemplate = "ember" | "frost" | "aurum" | "clean";

type Palette = {
  accent: string;
  accentSoft: string;
  /** primary text on the card */
  text: string;
  /** secondary/muted text */
  dim: string;
  panelBg: string;
  panelBorder: string;
  cardBorder: string;
  /** readability gradient over the lower third */
  scrim: string;
  /** "Lobby" in the wordmark */
  logoAccent: string;
};

const dark = (accent: string, accentSoft: string): Palette => ({
  accent,
  accentSoft,
  text: "#ffffff",
  dim: "#9aa3b2",
  panelBg: "rgba(8,10,14,0.6)",
  panelBorder: "rgba(255,255,255,0.18)",
  cardBorder: "rgba(255,255,255,0.16)",
  scrim: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 58%, rgba(0,0,0,0.78) 100%)",
  logoAccent: accent,
});

const TEMPLATES: Record<CardTemplate, Palette> = {
  ember: dark("#ff4655", "rgba(255,70,85,0.35)"),
  frost: dark("#4db4ff", "rgba(77,180,255,0.35)"),
  aurum: dark("#ffc658", "rgba(255,198,88,0.35)"),
  clean: {
    accent: "#42505e",
    accentSoft: "rgba(66,80,94,0.30)",
    text: "#222c36",
    dim: "#76828f",
    panelBg: "rgba(255,255,255,0.72)",
    panelBorder: "rgba(34,44,54,0.16)",
    cardBorder: "rgba(0,0,0,0.12)",
    scrim: "linear-gradient(180deg, rgba(246,247,248,0) 0%, rgba(246,247,248,0.85) 58%, rgba(246,247,248,0.95) 100%)",
    logoAccent: "#ff4655",
  },
};

/** Accept current template names; map retired ones onto them. */
function parseTemplate(value: string | null | undefined): CardTemplate {
  if (value === "ember" || value === "frost" || value === "aurum" || value === "clean") return value;
  if (value === "neon") return "frost";
  return "ember"; // aggressive / unknown
}

// Background art JPEGs (public/images/cards/bg-<template>.jpg), embedded as
// data URIs for Satori. Cached per server lifetime. Replacing the JPEG files
// (e.g. with AI-generated art) changes the cards with no code changes.
const bgCache = new Map<CardTemplate, string | null>();
async function templateBackground(template: CardTemplate): Promise<string | null> {
  if (bgCache.has(template)) return bgCache.get(template) ?? null;
  try {
    const file = path.join(process.cwd(), "public", "images", "cards", `bg-${template}.jpg`);
    const data = await readFile(file);
    const uri = `data:image/jpeg;base64,${data.toString("base64")}`;
    bgCache.set(template, uri);
    return uri;
  } catch {
    bgCache.set(template, null);
    return null;
  }
}

function sourceTone(source: CardSource, light: boolean) {
  if (source === "career") {
    return light
      ? { border: "#1da06b", text: "#157a51", bg: "rgba(36,211,138,0.14)", label: "CAREER RECORD" }
      : { border: "#24d38a", text: "#24d38a", bg: "rgba(4,32,22,0.72)", label: "CAREER RECORD" };
  }
  return light
    ? { border: "#c98a1d", text: "#9a6a13", bg: "rgba(255,184,77,0.16)", label: "SELF REPORTED" }
    : { border: "#ffb84d", text: "#ffb84d", bg: "rgba(38,26,5,0.72)", label: "SELF REPORTED" };
}

/** 55–99 score for a single tier on the rank ladder; null when unranked. */
function tierScore(rank: string): number | null {
  const n = rankTierNumber(rank);
  if (n == null) return null;
  const idx = n === 27 ? VALORANT_TIERS.length - 1 : n - 3; // 0 = Iron 1
  return Math.round(55 + (idx / (VALORANT_TIERS.length - 1)) * 44);
}

/**
 * FIFA-style overall: 70% current rank + 30% peak rank, so the badge rewards
 * proven ceiling without letting an old peak carry the number. Iron 1 floor
 * is 55, Radiant current+peak is 99.
 */
function rankRating(rank: string, peak: string): number | null {
  const current = tierScore(rank);
  if (current == null) return null;
  const peakScore = tierScore(peak);
  return Math.round(current * 0.7 + Math.max(current, peakScore ?? current) * 0.3);
}

function findMapByNameOrSlug(value: string | null): ValorantMap | null {
  if (!value) return null;
  const needle = value.trim().toLowerCase();
  return MAPS.find((m) => m.slug === needle || m.name.toLowerCase() === needle) ?? null;
}

function cleanParam(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 48) : fallback;
}

type CardOptions = {
  displayName: string;
  rank: string;
  peak: string;
  agent: string;
  weapon: string;
  role: string;
  source: CardSource;
  template: CardTemplate;
  blank: boolean;
  /** uploaded player photo (validated data URI); agent art ghosts behind it */
  photoUri: string | null;
  /** favourite map; its splash art fills the top-right at low opacity */
  map: string | null;
};

async function renderCard(opts: CardOptions): Promise<ImageResponse> {
  const { displayName, peak, agent, weapon, role, source, template, blank, photoUri } = opts;

  const tier = normaliseTier(opts.rank) || opts.rank || "Unranked";
  const rankLabel = String(tier);
  const palette = TEMPLATES[template];
  const { accent, accentSoft, text, dim, panelBg, panelBorder } = palette;
  const isLight = template === "clean";
  const tone = sourceTone(source, isLight);
  const rating = rankRating(rankLabel, peak);
  const favMap = findMapByNameOrSlug(opts.map);
  const rankEmblem = rankIconUrl(rankLabel); // official tier art, null if Unranked
  const peakEmblem = rankIconUrl(peak); // official art for the peak chip, null if not a tier
  const agentMatch = findAgent(agent);
  const agentPortraitUrl = agentMatch ? agentPortrait(agentMatch.uuid) : null;
  const weaponMatch = findWeapon(weapon);
  const weaponIconUrl = weaponMatch ? weaponDisplayIconUrl(weaponMatch.uuid) : null;
  const backgroundUri = await templateBackground(template);

  // Name block: last word drops to its own line, reference-card style.
  // The name keeps exactly the casing the player typed.
  const nameWords = displayName.trim().split(/\s+/);
  const nameLine2 = nameWords.length > 1 ? nameWords[nameWords.length - 1] : null;
  const nameLine1 = nameLine2 ? nameWords.slice(0, -1).join(" ") : displayName.trim();
  const longest = Math.max(nameLine1.length, nameLine2?.length ?? 0);
  // Black Ops One is a wide stencil face, so the name runs smaller than the
  // condensed Teko numerals.
  const nameFontSize = longest > 16 ? 42 : longest > 11 ? 54 : 70;

  const fonts = await loadFonts();
  const baseFontFamily = fonts.some((f) => f.name === "Outfit") ? "Outfit" : "Arial";
  const displayFontFamily = fonts.some((f) => f.name === "Teko") ? "Teko" : baseFontFamily;
  const nameFontFamily = fonts.some((f) => f.name === "Black Ops One")
    ? "Black Ops One"
    : displayFontFamily;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#06080c",
          padding: 36,
          fontFamily: baseFontFamily,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            borderRadius: 40,
            border: `2px solid ${palette.cardBorder}`,
            overflow: "hidden",
            background: isLight
              ? "#f2f4f6"
              : "linear-gradient(160deg, #0c0f15 0%, #05070a 100%)",
            boxShadow: `0 0 90px ${accentSoft}`,
          }}
        >
          {/* Background art */}
          {backgroundUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={backgroundUri}
              width={1008}
              height={1278}
              style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
            />
          )}

          {/* Favourite map: a full-height, oversized splash filling the card's
              right side (the rest clips off the edge), its left edge fading
              into the card. Composition: ghost agent left, hero centre, map
              right. */}
          {!blank && favMap && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 540,
                width: 468,
                height: 1278,
                display: "flex",
                overflow: "hidden",
                opacity: isLight ? 0.6 : 0.34,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                src={mapSplash(favMap.uuid)}
                width={468}
                height={1278}
                style={{
                  objectFit: "cover",
                  // Splash art is bright/foggy in places; over the white card it
                  // dissolves unless darkened, so the light theme deepens it.
                  ...(isLight ? { filter: "brightness(0.82) contrast(1.15)" } : {}),
                }}
              />
            </div>
          )}
          {!blank && favMap && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 540,
                width: 468,
                height: 1278,
                background: isLight
                  ? "linear-gradient(90deg, #f2f4f6 0%, rgba(242,244,246,0) 60%)"
                  : "linear-gradient(90deg, #0a0d12 0%, rgba(10,13,18,0) 60%)",
              }}
            />
          )}

          {/* Ghosted oversize agent. Subtle watermark normally; when the
              player uploads their own photo the agent steps back here at
              ~45% opacity, reference-card style. */}
          {agentPortraitUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={agentPortraitUrl}
              width={1408}
              height={1280}
              style={{
                position: "absolute",
                top: -30,
                left: -360,
                filter: "grayscale(1)",
                opacity: photoUri ? (isLight ? 0.22 : 0.45) : isLight ? 0.08 : 0.14,
              }}
            />
          )}

          {/* Hero: uploaded player photo, or the agent art as fallback */}
          {!blank && photoUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={photoUri}
              width={820}
              height={1010}
              style={{ position: "absolute", top: 126, left: 252, objectFit: "contain" }}
            />
          ) : !blank && agentPortraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={agentPortraitUrl}
              width={1056}
              height={960}
              style={{ position: "absolute", top: 130, left: -24 }}
            />
          ) : null}

          {/* Readability scrim over the lower third */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 520,
              background: palette.scrim,
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              padding: "44px 52px 40px",
            }}
          >
            {/* Top: career line + source pill */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  letterSpacing: 7,
                  color: isLight ? palette.dim : "rgba(255,255,255,0.88)",
                }}
              >
                {blank
                  ? "VALORANT RANK CARD"
                  : `VALORANT · ${role.toUpperCase()} · ${agent.toUpperCase()} MAIN`}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 44,
                  border: `2px solid ${tone.border}`,
                  background: tone.bg,
                  borderRadius: 999,
                  padding: "0 20px",
                }}
              >
                <span style={{ fontSize: 17, color: tone.text, fontWeight: 900, letterSpacing: 2 }}>
                  {tone.label}
                </span>
              </div>
            </div>

            {/* Rating box */}
            {!blank && (
              <div
                style={{
                  marginTop: 30,
                  width: 172,
                  height: 178,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 28,
                  border: `2px solid ${isLight ? palette.panelBorder : accentSoft}`,
                  background: panelBg,
                }}
              >
                <span
                  style={{
                    fontFamily: displayFontFamily,
                    fontSize: 124,
                    fontWeight: 700,
                    color: text,
                    lineHeight: 0.9,
                    marginTop: 14,
                  }}
                >
                  {rating ?? "—"}
                </span>
                <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: 6, color: isLight ? dim : accent }}>
                  OVR
                </span>
              </div>
            )}

            <div style={{ display: "flex", flex: 1 }} />

            {!blank && (
              // Satori needs an explicit flex container here — a bare
              // fragment collapses these rows onto a single line.
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Peak + weapon chips */}
                <div style={{ display: "flex", gap: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      height: 72,
                      borderRadius: 18,
                      border: `2px solid ${panelBorder}`,
                      background: panelBg,
                      padding: "0 22px",
                    }}
                  >
                    {peakEmblem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={peakEmblem} width={42} height={42} />
                    ) : null}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: dim }}>
                        PEAK
                      </span>
                      <span style={{ fontSize: 23, fontWeight: 900, color: text, marginTop: 2 }}>
                        {peak.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      height: 72,
                      borderRadius: 18,
                      border: `2px solid ${panelBorder}`,
                      background: panelBg,
                      padding: "0 22px",
                    }}
                  >
                    {weaponIconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        src={weaponIconUrl}
                        width={84}
                        height={32}
                        style={{
                          objectFit: "contain",
                          // Satori crashes on `filter: undefined`, so only set it when needed.
                          ...(isLight ? { filter: "invert(1) brightness(0.35)" } : {}),
                        }}
                      />
                    ) : null}
                    <span style={{ fontSize: 23, fontWeight: 900, color: text }}>
                      {(weaponMatch?.name ?? weapon).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Name block + current rank crest */}
                <div style={{ display: "flex", alignItems: "center", marginTop: 30 }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span
                      style={{
                        fontFamily: nameFontFamily,
                        fontSize: nameFontSize,
                        fontWeight: 400,
                        color: text,
                        lineHeight: 1.05,
                        letterSpacing: 1,
                      }}
                    >
                      {nameLine1}
                    </span>
                    {nameLine2 && (
                      <span
                        style={{
                          fontFamily: nameFontFamily,
                          fontSize: nameFontSize,
                          fontWeight: 400,
                          color: isLight ? text : accent,
                          lineHeight: 1.05,
                          letterSpacing: 1,
                        }}
                      >
                        {nameLine2}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 150,
                      background: panelBorder,
                      margin: "0 38px",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 4, color: dim }}>
                      CURRENT RANK
                    </span>
                    {rankEmblem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={rankEmblem} width={112} height={112} />
                    ) : (
                      <div
                        style={{
                          width: 112,
                          height: 112,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 999,
                          border: `3px solid ${accentSoft}`,
                        }}
                      >
                        <span style={{ fontSize: 44, fontWeight: 900, color: accent }}>?</span>
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: displayFontFamily,
                        fontSize: 40,
                        fontWeight: 600,
                        color: isLight ? text : accent,
                        letterSpacing: 2,
                        whiteSpace: "nowrap",
                        lineHeight: 0.9,
                      }}
                    >
                      {rankLabel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div
              style={{
                marginTop: 34,
                height: 96,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 20,
                border: `2px solid ${panelBorder}`,
                background: panelBg,
                padding: "0 30px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: text }}>gg</span>
                <span style={{ fontSize: 34, fontWeight: 900, color: palette.logoAccent }}>Lobby</span>
              </div>
              {!blank && (
                <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: isLight ? palette.accent : "rgba(255,255,255,0.85)" }}>
                  {`ROLE : ${role.toUpperCase()}`}
                </span>
              )}
              <span style={{ fontSize: 19, fontWeight: 700, color: dim }}>
                gglobby.in/rank-card
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      ...(fonts.length ? { fonts } : {}),
    },
  );
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const rankParam = request.nextUrl.searchParams.get("rank");
  const nameParam = request.nextUrl.searchParams.get("name");

  try {
    let displayName = cleanParam(nameParam, "Player");
    let rank: string | null = rankParam;
    let peak = cleanParam(request.nextUrl.searchParams.get("peak"), "Not set");
    let agent = cleanParam(request.nextUrl.searchParams.get("agent"), "Jett");
    const weapon = cleanParam(request.nextUrl.searchParams.get("weapon"), "Vandal");
    let role = cleanParam(request.nextUrl.searchParams.get("role"), "Duelist");

    if (username) {
      const db = createAdminClient();
      const { data: profile } = await db
        .from("profiles")
        .select("id, username, display_name")
        .eq("username", username)
        .single();

      if (profile) {
        const p = profile as Record<string, unknown>;
        displayName = nameParam || (p.display_name as string) || (p.username as string);

        if (!rank) {
          const { data: games } = await db
            .from("user_games")
            .select("rank, role, stats, game:games(name)")
            .eq("user_id", p.id as string)
            .eq("is_public", true)
            .limit(8);

          const rows = (games || []) as Array<{
            rank?: string | null;
            role?: string | null;
            stats?: { passport?: Record<string, unknown> } | null;
            game?: { name?: string } | null;
          }>;
          const val =
            rows.find((game) => (game.game?.name || "").toLowerCase().includes("valorant")) ||
            rows.find((game) => game.rank);

          rank = val?.rank || rank;
          role = val?.role || role;
          const passport = val?.stats?.passport;
          if (passport) {
            if (typeof passport.peak_rank === "string") peak = passport.peak_rank;
            if (typeof passport.main_agent_name === "string") agent = passport.main_agent_name;
          }
        }
      }
    }

    return await renderCard({
      displayName,
      rank: rank || "Unranked",
      peak,
      agent,
      weapon,
      role,
      source: request.nextUrl.searchParams.get("source") === "career" ? "career" : "manual",
      template: parseTemplate(request.nextUrl.searchParams.get("template")),
      blank: request.nextUrl.searchParams.get("blank") === "1",
      photoUri: null,
      map: request.nextUrl.searchParams.get("map"),
    });
  } catch (error) {
    console.error("[og/rank-card] Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}

// Uploaded photos don't fit in a GET URL, so the card maker POSTs the same
// params as JSON plus a `photo` data URI when the player adds their own image.
const PHOTO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const PHOTO_MAX_CHARS = 8_000_000; // ~6 MB decoded

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : null);

    let photoUri: string | null = null;
    const photo = str("photo");
    if (photo) {
      if (photo.length > PHOTO_MAX_CHARS || !PHOTO_RE.test(photo)) {
        return new Response("Invalid photo", { status: 400 });
      }
      photoUri = photo;
    }

    return await renderCard({
      displayName: cleanParam(str("name"), "Player"),
      rank: cleanParam(str("rank"), "Unranked"),
      peak: cleanParam(str("peak"), "Not set"),
      agent: cleanParam(str("agent"), "Jett"),
      weapon: cleanParam(str("weapon"), "Vandal"),
      role: cleanParam(str("role"), "Duelist"),
      source: str("source") === "career" ? "career" : "manual",
      template: parseTemplate(str("template")),
      blank: false,
      photoUri,
      map: str("map"),
    });
  } catch (error) {
    console.error("[og/rank-card] POST error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}

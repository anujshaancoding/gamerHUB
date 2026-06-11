import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { normaliseTier, rankIconUrl, rankTierNumber, VALORANT_TIERS } from "@/lib/features/tools/valorant-ranks";
import { agentPortrait, findAgent } from "@/lib/data/valorant-agents";
import { findWeapon, weaponDisplayIconUrl } from "@/lib/tracker/valorant-assets";

export const runtime = "nodejs";

type SatoriFont = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: "normal" };

// Outfit (Google Fonts) for Satori. Fetched once per server lifetime and cached.
// An IE11 user-agent makes Google serve TTF (Satori cannot parse woff2). Fully
// guarded — any failure falls back to the built-in font, never a 500.
let outfitFontsCache: SatoriFont[] | null = null;
async function loadOutfitFonts(): Promise<SatoriFont[]> {
  if (outfitFontsCache) return outfitFontsCache;
  const weights: Array<400 | 700 | 900> = [400, 700, 900];
  const loaded: SatoriFont[] = [];
  for (const weight of weights) {
    try {
      const css = await fetch(`https://fonts.googleapis.com/css2?family=Outfit:wght@${weight}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
        },
      }).then((r) => r.text());
      const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
      if (!url) continue;
      const data = await fetch(url).then((r) => r.arrayBuffer());
      loaded.push({ name: "Outfit", data, weight, style: "normal" });
    } catch {
      /* skip this weight */
    }
  }
  if (loaded.length) outfitFontsCache = loaded;
  return loaded;
}

type CardSource = "manual" | "career";
type CardTemplate = "ember" | "frost" | "aurum";

const TEMPLATES: Record<CardTemplate, { accent: string; accentSoft: string }> = {
  ember: { accent: "#ff4655", accentSoft: "rgba(255,70,85,0.35)" },
  frost: { accent: "#4db4ff", accentSoft: "rgba(77,180,255,0.35)" },
  aurum: { accent: "#ffc658", accentSoft: "rgba(255,198,88,0.35)" },
};

/** Accept new template names; map the legacy CSS-template names onto them. */
function parseTemplate(value: string | null): CardTemplate {
  if (value === "ember" || value === "frost" || value === "aurum") return value;
  if (value === "neon") return "frost";
  return "ember"; // clean / aggressive / unknown
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

function sourceTone(source: CardSource) {
  return source === "career"
    ? { border: "#24d38a", text: "#24d38a", bg: "rgba(4,32,22,0.72)", label: "CAREER RECORD" }
    : { border: "#ffb84d", text: "#ffb84d", bg: "rgba(38,26,5,0.72)", label: "SELF REPORTED" };
}

/** FIFA-style 55–99 overall from the rank ladder; null when unranked. */
function rankRating(rank: string): number | null {
  const n = rankTierNumber(rank);
  if (n == null) return null;
  const idx = n === 27 ? VALORANT_TIERS.length - 1 : n - 3; // 0 = Iron 1
  return Math.round(55 + (idx / (VALORANT_TIERS.length - 1)) * 44);
}

function cleanParam(value: string | null, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 48) : fallback;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const rankParam = request.nextUrl.searchParams.get("rank");
  const peakParam = request.nextUrl.searchParams.get("peak");
  const agentParam = request.nextUrl.searchParams.get("agent");
  const weaponParam = request.nextUrl.searchParams.get("weapon");
  const roleParam = request.nextUrl.searchParams.get("role");
  const nameParam = request.nextUrl.searchParams.get("name");
  const sourceParam = request.nextUrl.searchParams.get("source");
  const templateParam = request.nextUrl.searchParams.get("template");
  const blankTemplate = request.nextUrl.searchParams.get("blank") === "1";

  try {
    let displayName = cleanParam(nameParam, "Player");
    let rank: string | null = rankParam;
    let peak = cleanParam(peakParam, "Not set");
    let agent = cleanParam(agentParam, "Jett");
    const weapon = cleanParam(weaponParam, "Vandal");
    let role = cleanParam(roleParam, "Duelist");

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

    const tier = normaliseTier(rank) || rank || "Unranked";
    const rankLabel = String(tier);
    const source: CardSource = sourceParam === "career" ? "career" : "manual";
    const template = parseTemplate(templateParam);
    const { accent, accentSoft } = TEMPLATES[template];
    const tone = sourceTone(source);
    const rating = rankRating(rankLabel);
    const rankEmblem = rankIconUrl(rankLabel); // official tier art, null if Unranked
    const peakEmblem = rankIconUrl(peak); // official art for the peak chip, null if not a tier
    const agentMatch = findAgent(agent);
    const agentPortraitUrl = agentMatch ? agentPortrait(agentMatch.uuid) : null;
    const weaponMatch = findWeapon(weapon);
    const weaponIconUrl = weaponMatch ? weaponDisplayIconUrl(weaponMatch.uuid) : null;
    const backgroundUri = await templateBackground(template);

    // Name block: last word drops to its own line, reference-card style.
    const nameUpper = displayName.toUpperCase();
    const nameWords = nameUpper.split(/\s+/);
    const nameLine2 = nameWords.length > 1 ? nameWords[nameWords.length - 1] : null;
    const nameLine1 = nameLine2 ? nameWords.slice(0, -1).join(" ") : nameUpper;
    const longest = Math.max(nameLine1.length, nameLine2?.length ?? 0);
    const nameFontSize = longest > 16 ? 52 : longest > 11 ? 66 : 84;

    const outfitFonts = await loadOutfitFonts();
    const baseFontFamily = outfitFonts.length ? "Outfit" : "Arial";

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
              border: "2px solid rgba(255,255,255,0.16)",
              overflow: "hidden",
              background: "linear-gradient(160deg, #0c0f15 0%, #05070a 100%)",
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

            {/* Ghosted oversize agent behind everything (reference-card echo) */}
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
                  opacity: 0.14,
                }}
              />
            )}

            {/* Hero agent art */}
            {!blankTemplate && agentPortraitUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                src={agentPortraitUrl}
                width={1056}
                height={960}
                style={{ position: "absolute", top: 130, left: -24 }}
              />
            )}

            {/* Readability scrim over the lower third */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 520,
                background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 58%, rgba(0,0,0,0.78) 100%)",
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
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {blankTemplate
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
              {!blankTemplate && (
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
                    border: `2px solid ${accentSoft}`,
                    background: "rgba(8,10,14,0.55)",
                  }}
                >
                  <span style={{ fontSize: 96, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                    {rating ?? "—"}
                  </span>
                  <span style={{ fontSize: 19, fontWeight: 900, letterSpacing: 6, color: accent, marginTop: 4 }}>
                    OVR
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flex: 1 }} />

              {!blankTemplate && (
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
                        border: "2px solid rgba(255,255,255,0.18)",
                        background: "rgba(8,10,14,0.6)",
                        padding: "0 22px",
                      }}
                    >
                      {peakEmblem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={peakEmblem} width={42} height={42} />
                      ) : null}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: "#9aa3b2" }}>
                          PEAK
                        </span>
                        <span style={{ fontSize: 23, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
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
                        border: "2px solid rgba(255,255,255,0.18)",
                        background: "rgba(8,10,14,0.6)",
                        padding: "0 22px",
                      }}
                    >
                      {weaponIconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={weaponIconUrl} width={84} height={32} style={{ objectFit: "contain" }} />
                      ) : null}
                      <span style={{ fontSize: 23, fontWeight: 900, color: "#ffffff" }}>
                        {(weaponMatch?.name ?? weapon).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Name block + current rank crest */}
                  <div style={{ display: "flex", alignItems: "center", marginTop: 30 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <span
                        style={{
                          fontSize: nameFontSize,
                          fontWeight: 900,
                          color: "#ffffff",
                          lineHeight: 1,
                          letterSpacing: 1,
                        }}
                      >
                        {nameLine1}
                      </span>
                      {nameLine2 && (
                        <span
                          style={{
                            fontSize: nameFontSize,
                            fontWeight: 900,
                            color: accent,
                            lineHeight: 1,
                            letterSpacing: 1,
                            marginTop: 6,
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
                        background: "rgba(255,255,255,0.22)",
                        margin: "0 38px",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 4, color: "#9aa3b2" }}>
                        CURRENT RANK
                      </span>
                      {rankEmblem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={rankEmblem} width={116} height={116} />
                      ) : (
                        <div
                          style={{
                            width: 116,
                            height: 116,
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
                          fontSize: 30,
                          fontWeight: 900,
                          color: accent,
                          letterSpacing: 2,
                          whiteSpace: "nowrap",
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
                  border: "2px solid rgba(255,255,255,0.16)",
                  background: "rgba(8,10,14,0.62)",
                  padding: "0 30px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: "#ffffff" }}>gg</span>
                  <span style={{ fontSize: 34, fontWeight: 900, color: accent }}>Lobby</span>
                </div>
                {!blankTemplate && (
                  <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: "rgba(255,255,255,0.85)" }}>
                    {`ROLE : ${role.toUpperCase()}`}
                  </span>
                )}
                <span style={{ fontSize: 19, fontWeight: 700, color: "#8b93a1" }}>
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
        ...(outfitFonts.length ? { fonts: outfitFonts } : {}),
      },
    );
  } catch (error) {
    console.error("[og/rank-card] Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}

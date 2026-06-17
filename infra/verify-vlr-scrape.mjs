/**
 * Standalone sanity check for the direct vlr.gg scraper.
 *
 *   node infra/verify-vlr-scrape.mjs            # world board, 90d
 *   node infra/verify-vlr-scrape.mjs in 90      # filter to India flag, 90d
 *   node infra/verify-vlr-scrape.mjs "" all     # world, all-time
 *
 * Ports the cookie-handshake + parse logic from
 * src/lib/features/pro/vlr-scrape.ts (kept dependency-free so this runs with a
 * bare `node`). Prints the first ~8 players so we can eyeball correctness BEFORE
 * trusting the DB ingest. Writes NOTHING — pure read.
 *
 * NOTE: vlr's `country=` URL param does NOT filter this page; country lives in a
 * per-row `<i class="flag mod-<cc>">`. We parse that into `country` and, when a
 * country arg is given, filter on it client-side (same as the real ingest).
 */

const VLR_BASE = "https://www.vlr.gg/stats/";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function buildUrl(timespan) {
  const ts = String(timespan).trim();
  const tsParam = ts === "all" ? "all" : `${ts.replace(/d$/i, "")}d`;
  const params = new URLSearchParams({ region: "all", timespan: tsParam });
  return `${VLR_BASE}?${params.toString()}`;
}

function cookiesFromResponse(res) {
  let raw = [];
  if (typeof res.headers.getSetCookie === "function") {
    raw = res.headers.getSetCookie();
  } else {
    const single = res.headers.get("set-cookie");
    if (single) raw = [single];
  }
  const pairs = [];
  for (const line of raw) {
    const first = line.split(";")[0]?.trim();
    if (first && first.includes("=")) pairs.push(first);
  }
  return pairs.join("; ");
}

async function fetchStatsHtml(url) {
  const baseHeaders = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" };
  const primer = await fetch(url, { redirect: "manual", headers: baseHeaders });
  const cookie = cookiesFromResponse(primer);
  if (primer.status === 200) {
    const body = await primer.text();
    if (body && body.includes("wf-table")) return body;
  }
  const res = await fetch(url, {
    redirect: "manual",
    headers: cookie ? { ...baseHeaders, Cookie: cookie } : baseHeaders,
  });
  if (res.status !== 200) {
    throw new Error(`vlr.gg GET ${url} -> ${res.status} (after cookie handshake)`);
  }
  return res.text();
}

const TBODY_RE = /<tbody>([\s\S]*?)<\/tbody>/;
const TD_RE = /<td[^>]*>([\s\S]*?)<\/td>/g;

function cellText(html) {
  const txt = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return txt === "" ? null : txt;
}

function agentsFromCell(html) {
  const out = [];
  const re = /\/agents\/([a-z0-9-]+)\.png/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].toLowerCase());
  return out;
}

function countryFromCell(html) {
  const m = /class="flag\s+mod-([a-z]{2})"/i.exec(html);
  if (!m) return null;
  const cc = m[1].toLowerCase();
  return cc === "un" ? null : cc;
}

function parseVlrStats(html) {
  const bodyMatch = TBODY_RE.exec(html);
  if (!bodyMatch) return [];
  const rows = bodyMatch[1].split(/<tr\b[^>]*>/i).filter((r) => /<td\b/i.test(r));
  const segments = [];
  for (const row of rows) {
    const tds = [];
    TD_RE.lastIndex = 0;
    let m;
    while ((m = TD_RE.exec(row)) !== null) tds.push(m[1]);
    if (tds.length < 15) continue;
    const playerCell = tds[0];
    const ignMatch = /class="text-of"[^>]*>([\s\S]*?)<\/div>/i.exec(playerCell);
    const ign = ignMatch ? cellText(ignMatch[1]) : cellText(playerCell);
    if (!ign) continue;
    const orgMatch =
      /class="stats-player-country"[^>]*>([\s\S]*?)<\/div>/i.exec(playerCell) ||
      /class="ge-text-light"[^>]*>([\s\S]*?)<\//i.exec(playerCell);
    segments.push({
      player: ign,
      org: orgMatch ? cellText(orgMatch[1]) : null,
      agents: agentsFromCell(tds[1]),
      rounds_played: cellText(tds[2]),
      rating: cellText(tds[3]),
      average_combat_score: cellText(tds[4]),
      kill_deaths: cellText(tds[5]),
      kill_assists_survived_traded: cellText(tds[6]),
      average_damage_per_round: cellText(tds[7]),
      kills_per_round: cellText(tds[8]),
      assists_per_round: cellText(tds[9]),
      first_kills_per_round: cellText(tds[10]),
      first_deaths_per_round: cellText(tds[11]),
      headshot_percentage: cellText(tds[12]),
      clutch_success_percentage: cellText(tds[13]),
      clutch_attempts: cellText(tds[14]),
      country: countryFromCell(playerCell),
    });
  }
  return segments;
}

async function main() {
  const country = (process.argv[2] || "").toLowerCase();
  const timespan = process.argv[3] || "90";
  const url = buildUrl(timespan);
  console.log(`→ scraping ${url}${country ? `  (filter flag=${country})` : ""}`);
  const html = await fetchStatsHtml(url);
  console.log(`  fetched ${html.length} bytes`);
  const all = parseVlrStats(html);
  const segs = country ? all.filter((s) => s.country === country) : all;
  console.log(`  parsed ${all.length} rows; ${segs.length} after filter`);
  console.log("");

  const sample = segs.slice(0, 8);
  console.table(
    sample.map((s) => ({
      ign: s.player,
      org: s.org,
      cc: s.country,
      agents: s.agents.join(","),
      rating: s.rating,
      acs: s.average_combat_score,
      kast: s.kill_assists_survived_traded,
      kd: s.kill_deaths,
      cl: s.clutch_attempts,
    })),
  );

  // Cheap plausibility gate so a structural break is loud, not silent.
  const ratings = segs.map((s) => Number(s.rating)).filter((n) => Number.isFinite(n));
  const acs = segs.map((s) => Number(s.average_combat_score)).filter((n) => Number.isFinite(n));
  const inBand = ratings.filter((r) => r >= 0.6 && r <= 2.0).length;
  console.log("");
  console.log(
    `rating sanity: ${inBand}/${ratings.length} in [0.6,2.0]` +
      (ratings.length ? ` (min ${Math.min(...ratings)}, max ${Math.max(...ratings)})` : ""),
  );
  if (acs.length) {
    console.log(`ACS range: ${Math.min(...acs)}–${Math.max(...acs)}`);
  }

  const minRows = country ? 10 : 20;
  if (segs.length < minRows) {
    console.error(`✗ FEWER THAN ${minRows} ROWS — vlr.gg structure may have changed.`);
    process.exit(2);
  }
  console.log("✓ scrape looks healthy.");
}

main().catch((err) => {
  console.error("✗ verify failed:", err);
  process.exit(1);
});

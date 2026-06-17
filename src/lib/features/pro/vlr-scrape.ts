/**
 * Direct vlr.gg stats scraper.
 *
 * Replaces the self-hosted vlrggapi dependency: we fetch the public
 * https://www.vlr.gg/stats/ HTML leaderboard ourselves and parse it into the
 * SAME `segment` shape the old vlrggapi `/v2/stats` returned, so the existing
 * normalize() mapping (see infra/ingest/vlr-ingest.mjs) is reused unchanged.
 *
 * vlr.gg soft-blocks bots with a 302 redirect LOOP unless you complete a cookie
 * handshake: the first request returns 302 + Set-Cookie (an `abok` token, and
 * sometimes PHPSESSID); re-requesting WITH those cookies returns 200. We do that
 * here with `redirect: "manual"`.
 *
 * Parsing is intentionally dependency-free regex against a very regular table:
 * fixed <td> column order, stable class hooks (`text-of`, `stats-player-country`,
 * `flag mod-<cc>`, `/agents/<name>.png`). If vlr.gg restructures this table,
 * scrapeVlrStats() returns [] (or rows with null stats) rather than throwing —
 * the caller logs and the ingest run is marked accordingly. Use
 * infra/verify-vlr-scrape.mjs to eyeball.
 *
 * NOTE: vlr.gg's `country=` URL param does NOT filter this stats page
 * server-side (it returns the full world board regardless). Each row instead
 * carries its country in an `<i class="flag mod-<cc>">` element, which we parse
 * into `segment.country`; the ingest filters India by that flag, not by URL.
 */

const VLR_BASE = "https://www.vlr.gg/stats/";

// A real desktop UA — vlr.gg rejects obvious bot/empty UAs.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * One leaderboard row, shaped like a vlrggapi `/v2/stats` segment so the
 * existing normalize() in the ingest can consume it without changes. The extra
 * `country` field is ignored by normalize() and used only for India filtering.
 */
export interface Segment {
  player: string;
  org: string | null;
  agents: string[];
  rounds_played: string | null;
  rating: string | null;
  average_combat_score: string | null;
  kill_deaths: string | null;
  kill_assists_survived_traded: string | null;
  average_damage_per_round: string | null;
  kills_per_round: string | null;
  assists_per_round: string | null;
  first_kills_per_round: string | null;
  first_deaths_per_round: string | null;
  headshot_percentage: string | null;
  clutch_success_percentage: string | null;
  /** "won/played", e.g. "6/15" — normalize()'s clutchAttempts() pulls the "/N". */
  clutch_attempts: string | null;
  /** ISO-2 (lowercase) from `flag mod-<cc>`, e.g. "in"; null when unknown. */
  country: string | null;
}

export interface ScrapeArgs {
  /**
   * ISO-2 country code (lowercase), e.g. "in". When set, the result is filtered
   * to that country's flag CLIENT-SIDE (vlr's `country=` URL param is a no-op on
   * this page). Omit for the full world board.
   */
  country?: string;
  /** Days as a number (e.g. 90) or "all". Coerced to vlr's `<n>d` / `all`. */
  timespan: string | number;
}

/** Build the vlr.gg stats URL for a given timespan (region is always "all"). */
function buildUrl(timespan: string | number): string {
  const ts = String(timespan).trim();
  const tsParam = ts === "all" ? "all" : `${ts.replace(/d$/i, "")}d`;
  const params = new URLSearchParams({ region: "all", timespan: tsParam });
  return `${VLR_BASE}?${params.toString()}`;
}

/**
 * Collapse a Set-Cookie header into a `name=value; name=value` Cookie string.
 * Node's fetch exposes the combined set-cookie via getSetCookie() (preferred) or
 * a comma-joined `set-cookie` header (fallback). We only need the name=value
 * pairs, so we strip attributes (Path, Expires, etc.).
 */
function cookiesFromResponse(res: Response): string {
  let raw: string[] = [];
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    raw = headers.getSetCookie();
  } else {
    const single = res.headers.get("set-cookie");
    if (single) raw = [single];
  }
  const pairs: string[] = [];
  for (const line of raw) {
    // Each Set-Cookie line: "name=value; Path=/; ...". Take the first pair only.
    const first = line.split(";")[0]?.trim();
    if (first && first.includes("=")) pairs.push(first);
  }
  return pairs.join("; ");
}

/** Fetch the stats HTML, performing the vlr.gg cookie handshake. */
async function fetchStatsHtml(url: string): Promise<string> {
  const baseHeaders = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml",
  };

  // Step 1: prime the cookie jar (vlr returns 302 + Set-Cookie).
  const primer = await fetch(url, {
    redirect: "manual",
    headers: baseHeaders,
  });
  const cookie = cookiesFromResponse(primer);

  // If the primer already returned a usable 200 with a body (no block), use it.
  if (primer.status === 200) {
    const body = await primer.text();
    if (body && body.includes("wf-table")) return body;
  }

  // Step 2: re-request WITH the handshake cookies.
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

/** Strip tags + collapse whitespace, returning a trimmed text value or null. */
function cellText(html: string): string | null {
  const txt = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return txt === "" ? null : txt;
}

/** Pull agent slugs from the agents <td> (img src `/agents/<name>.png`). */
function agentsFromCell(html: string): string[] {
  const out: string[] = [];
  const re = /\/agents\/([a-z0-9-]+)\.png/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1].toLowerCase());
  }
  return out;
}

/** ISO-2 (lowercase) from the row's `<i class="flag mod-<cc>">`; null if none/unknown. */
function countryFromCell(html: string): string | null {
  const m = /class="flag\s+mod-([a-z]{2})"/i.exec(html);
  if (!m) return null;
  const cc = m[1].toLowerCase();
  return cc === "un" ? null : cc; // mod-un = unknown flag
}

/**
 * Parse the stats table HTML into vlrggapi-shaped segments.
 *
 * Column order (0-indexed <td>): 0 Player, 1 Agents, 2 Rnd, 3 Rating, 4 ACS,
 * 5 K:D, 6 KAST, 7 ADR, 8 KPR, 9 APR, 10 FKPR, 11 FDPR, 12 HS%, 13 CL%, 14 CL.
 */
export function parseVlrStats(html: string): Segment[] {
  const bodyMatch = TBODY_RE.exec(html);
  if (!bodyMatch) return [];
  const body = bodyMatch[1];

  // Split into rows. vlr emits a lot of whitespace between <tr> and its tds.
  const rows = body.split(/<tr\b[^>]*>/i).filter((r) => /<td\b/i.test(r));
  const segments: Segment[] = [];

  for (const row of rows) {
    const tds: string[] = [];
    TD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TD_RE.exec(row)) !== null) tds.push(m[1]);
    if (tds.length < 15) continue; // not a data row

    const playerCell = tds[0];
    const ignMatch = /class="text-of"[^>]*>([\s\S]*?)<\/div>/i.exec(playerCell);
    const ign = ignMatch ? cellText(ignMatch[1]) : cellText(playerCell);
    if (!ign) continue;

    const orgMatch =
      /class="stats-player-country"[^>]*>([\s\S]*?)<\/div>/i.exec(playerCell) ||
      /class="ge-text-light"[^>]*>([\s\S]*?)<\//i.exec(playerCell);
    const org = orgMatch ? cellText(orgMatch[1]) : null;

    segments.push({
      player: ign,
      org,
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

/**
 * Scrape the vlr.gg world stats leaderboard and return vlrggapi-shaped segments.
 * If `country` is given, the rows are filtered to that flag client-side (the
 * board itself is always the world board — see file header). Throws only on a
 * hard fetch failure (non-200 after handshake); a structural change yields [].
 */
export async function scrapeVlrStats(args: ScrapeArgs): Promise<Segment[]> {
  const url = buildUrl(args.timespan);
  const html = await fetchStatsHtml(url);
  const all = parseVlrStats(html);
  if (!args.country) return all;
  const cc = args.country.toLowerCase();
  return all.filter((s) => s.country === cc);
}

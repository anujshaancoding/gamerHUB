// Heuristic: take a blog post (or raw HTML/text) and split it into carousel
// slides. Strategy in priority order:
//   1) If the HTML has <h2>/<h3>, each heading + the following text becomes a tip
//   2) If it has an <ol>/<ul> with >= 3 items, each <li> becomes a tip
//   3) Fallback: split by paragraphs, group into ~3-sentence tip chunks
//
// We cap at 8 tip slides — IG's carousel max is 10, and we reserve one for
// the cover slide and one for the CTA.

import type { CarouselSlide } from "./render-carousel";
import type { RankTier } from "./rank-themes";

const MAX_TIPS = 8;
const TIP_TITLE_MAX = 60;
const TIP_BODY_MAX = 280;

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Pull out heading-led tips: <h2|h3>HEAD</h2|h3> + following text until next heading
function extractByHeadings(html: string): { title: string; body: string }[] {
  const re = /<h(?:2|3)[^>]*>([\s\S]*?)<\/h(?:2|3)>([\s\S]*?)(?=<h(?:2|3)[^>]*>|$)/gi;
  const out: { title: string; body: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const title = stripTags(m[1]).trim();
    const body = stripTags(m[2]).trim();
    if (title && body) out.push({ title, body });
  }
  return out;
}

// Pull <ol>/<ul> items
function extractByList(html: string): { title: string; body: string }[] {
  const listMatch = html.match(/<(ol|ul)[^>]*>([\s\S]*?)<\/\1>/i);
  if (!listMatch) return [];
  const items: { title: string; body: string }[] = [];
  const itemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(listMatch[2]))) {
    const text = stripTags(m[1]).trim();
    if (!text) continue;
    // Split: first sentence (or pre-colon) becomes title, rest body
    const colonSplit = text.split(/:\s+(.+)/);
    if (colonSplit.length >= 2 && colonSplit[0].length < TIP_TITLE_MAX) {
      items.push({ title: colonSplit[0], body: colonSplit[1] });
    } else {
      const sents = splitSentences(text);
      const title = sents[0] || text;
      const body = sents.slice(1).join(" ") || sents[0] || text;
      items.push({ title, body });
    }
  }
  return items.length >= 3 ? items : [];
}

// Fallback — paragraphs into ~3-sentence groups
function extractByParagraphs(html: string): { title: string; body: string }[] {
  const text = stripTags(html);
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return [];
  return paras.map((p, i) => {
    const sents = splitSentences(p);
    const title = sents[0] || `Tip ${i + 1}`;
    const body = sents.slice(1).join(" ") || sents[0] || "";
    return { title, body };
  });
}

export interface ExtractInput {
  title: string;
  excerpt?: string | null;
  content: string;
  rank?: RankTier;
  ctaUrl?: string;
  ctaBody?: string;
}

export function extractSlides(input: ExtractInput): CarouselSlide[] {
  const rank: RankTier = input.rank ?? "all";

  // Cover slide
  const cover: CarouselSlide = {
    kind: "cover",
    rank,
    title: clamp(input.title, 80),
    body: input.excerpt ? clamp(stripTags(input.excerpt), 160) : "",
  };

  // Tip slides — try heading-led, then list-led, then paragraph fallback
  const html = input.content || "";
  let raw = extractByHeadings(html);
  if (raw.length < 2) raw = extractByList(html);
  if (raw.length < 2) raw = extractByParagraphs(html);

  const tips: CarouselSlide[] = raw.slice(0, MAX_TIPS).map((t) => ({
    kind: "tip" as const,
    rank,
    title: clamp(t.title, TIP_TITLE_MAX),
    body: clamp(t.body || t.title, TIP_BODY_MAX),
  }));

  // CTA slide
  const cta: CarouselSlide = {
    kind: "cta",
    rank,
    title: "INDIA'S VALORANT HOME",
    body:
      input.ctaBody ||
      "Read the full breakdown, save it to your profile, and grind the daily streak.",
  };

  return [cover, ...tips, cta];
}

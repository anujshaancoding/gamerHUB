/**
 * Thin analytics event endpoint.
 *
 * Records anonymous (logged-out) signup-CTA clicks as `cta_click` rows in
 * `funnel_events`. Distinguishes deliberate signup intent from passive
 * /register pageviews, and attributes intent to a discovery surface.
 *
 * Anonymous by design — user_id is always null here (a signed-in user clicking a
 * signup CTA is not a meaningful funnel signal). Rate-limited to curb bot abuse.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";
import { trackEvent } from "@/lib/analytics/track-event";
import { FUNNEL_EVENTS, isCtaSource } from "@/lib/analytics/sources";

// 30 requests per minute per IP — event endpoints are a bot-abuse target.
const rateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });

const EventSchema = z.object({
  // Only cta_click is accepted from the client for now. Activation/signup are
  // server-fired from trusted call sites and must never be client-spoofable.
  event: z.literal(FUNNEL_EVENTS.cta_click),
  source: z.string().min(1).max(64),
  page: z.string().max(512).optional(),
  sessionId: z.string().max(128).optional(),
  ref: z.string().max(128).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIdentifier(request);
    const { allowed } = rateLimiter(ip);
    if (!allowed) {
      // Silently drop — never surface analytics rate-limit to the user.
      return new NextResponse(null, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    const parsed = EventSchema.safeParse(raw);
    if (!parsed.success) {
      return new NextResponse(null, { status: 400 });
    }

    const { event, source, page, sessionId, ref } = parsed.data;

    // Reject unknown CTA sources so the funnel vocabulary stays canonical.
    if (!isCtaSource(source)) {
      return new NextResponse(null, { status: 400 });
    }

    void trackEvent(null, event, source, {
      page: page ?? null,
      session_id: sessionId ?? null,
      ref: ref ?? null,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

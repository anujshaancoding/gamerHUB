import { createAdminClient } from "@/lib/db/admin";

/**
 * Append a row to `funnel_events`. Fire-and-forget: analytics must NEVER break a
 * user-facing request, so all errors are swallowed. Always `void` this at call
 * sites (do not let a rejected promise bubble into the request path).
 *
 * @param userId  the user the event is about; pass null for anonymous events
 *                (e.g. logged-out `cta_click`).
 * @param event   'signup' | 'activation' | 'cta_click'
 * @param source  provider / activation / CTA-surface source (see lib/analytics/sources.ts)
 * @param meta    arbitrary JSON: session_id, ref, counterpart_user_id, post_id, page, etc.
 */
export async function trackEvent(
  userId: string | null,
  event: string,
  source?: string | null,
  meta?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await createAdminClient()
      .from("funnel_events")
      .insert({
        user_id: userId ?? null,
        event,
        source: source ?? null,
        meta: meta ?? null,
      });
  } catch {
    // Analytics must never break the user-facing request.
  }
}

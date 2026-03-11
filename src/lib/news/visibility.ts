/**
 * Server-side helper to check if news is hidden.
 * Use in API routes & server components.
 */

import { getSiteSetting } from "@/lib/db/site-settings";

/** Returns `true` when news should be completely hidden from the frontend. */
export async function isNewsHidden(): Promise<boolean> {
  return getSiteSetting("hide_news");
}

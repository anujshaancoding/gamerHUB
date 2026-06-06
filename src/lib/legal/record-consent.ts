import { getPool } from "@/lib/db/index";
import { logger } from "@/lib/logger";
import { POLICY_VERSION } from "./policy-version";

export type ConsentMethod = "email_signup" | "google_oauth";

/**
 * Record a user's acceptance of the Terms of Service + Privacy Policy at signup
 * (DPDP audit trail), writing the policy version, timestamp, and signup path to
 * the user's profile row.
 *
 * DEFENSIVE BY DESIGN: this must never block or break account creation. If the
 * consent columns do not exist yet (migration 015_user_consent not applied) or
 * any DB error occurs, we log a warning and return — the user's affirmative
 * action in the signup form is the operative consent; this is the durable
 * record of it. Always call as `void recordConsent(...)` (fire-and-forget).
 */
export async function recordConsent(
  userId: string,
  method: ConsentMethod,
  policyVersion: string = POLICY_VERSION
): Promise<void> {
  try {
    const sql = getPool();
    await sql`
      UPDATE profiles
      SET consent_terms_version = ${policyVersion},
          consent_privacy_version = ${policyVersion},
          consent_at = NOW(),
          consent_method = ${method}
      WHERE id = ${userId}
    `;
  } catch (err) {
    logger.warn(
      "recordConsent skipped (migration 015_user_consent may be unapplied)",
      { error_raw: err instanceof Error ? err.message : String(err) }
    );
  }
}

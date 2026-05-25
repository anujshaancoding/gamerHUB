/**
 * Email verification token helpers.
 *
 * Flow:
 *   1. Registration creates the user with `email_confirmed_at = NULL`.
 *   2. `issueEmailVerificationToken(userId, email)` generates a random
 *      token, stores its sha256 hash, and returns the plaintext token to
 *      embed in the verification URL.
 *   3. The user clicks the link; the API hashes the supplied token, looks
 *      up the row, checks `used_at IS NULL` and `expires_at > now()`,
 *      marks the user confirmed and the token used.
 *
 * Only the hash lives in the DB — even a full database dump can't be
 * used to confirm someone else's address.
 */

import { createHash, randomBytes } from "crypto";
import type postgres from "postgres";

const TOKEN_BYTES = 32;
const TTL_HOURS = 24;

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export interface IssuedToken {
  /** Raw token to embed in the email URL. Send once, never store. */
  rawToken: string;
  /** Row id of the persisted hashed token. */
  id: string;
  expiresAt: Date;
}

export async function issueEmailVerificationToken(
  sql: postgres.Sql,
  userId: string,
  email: string
): Promise<IssuedToken> {
  // Invalidate any outstanding tokens for this user — only the freshest
  // link should work. Avoids "old link from a previous attempt" footguns.
  await sql`
    UPDATE email_verification_tokens
    SET used_at = NOW()
    WHERE user_id = ${userId} AND used_at IS NULL
  `;

  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

  const rows = await sql`
    INSERT INTO email_verification_tokens (user_id, token_hash, email, expires_at)
    VALUES (${userId}, ${tokenHash}, ${email}, ${expiresAt.toISOString()})
    RETURNING id
  `;

  return {
    rawToken,
    id: rows[0].id as string,
    expiresAt,
  };
}

export interface ConsumeResult {
  ok: boolean;
  userId?: string;
  reason?: "not_found" | "used" | "expired";
}

export async function consumeEmailVerificationToken(
  sql: postgres.Sql,
  rawToken: string
): Promise<ConsumeResult> {
  const tokenHash = hashVerificationToken(rawToken);

  // Single atomic UPDATE … RETURNING — guarantees the token is marked
  // used in the same statement that flips email_confirmed_at, so two
  // concurrent clicks can't both succeed.
  const rows = await sql`
    WITH tok AS (
      SELECT id, user_id, expires_at, used_at
      FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
      FOR UPDATE
    )
    UPDATE email_verification_tokens t
    SET used_at = NOW()
    FROM tok
    WHERE t.id = tok.id
      AND tok.used_at IS NULL
      AND tok.expires_at > NOW()
    RETURNING tok.user_id, tok.expires_at, tok.used_at
  `;

  if (rows.length === 0) {
    // Token either does not exist, was already consumed, or expired.
    const probe = await sql`
      SELECT used_at, expires_at FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
    `;
    if (probe.length === 0) return { ok: false, reason: "not_found" };
    if (probe[0].used_at) return { ok: false, reason: "used" };
    return { ok: false, reason: "expired" };
  }

  const row = rows[0] as { user_id: string };
  await sql`
    UPDATE users SET email_confirmed_at = NOW()
    WHERE id = ${row.user_id} AND email_confirmed_at IS NULL
  `;
  return { ok: true, userId: row.user_id };
}

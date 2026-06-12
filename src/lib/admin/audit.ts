/**
 * Admin audit trail.
 *
 * Records sensitive/privileged admin actions to the `admin_audit` table so we
 * always know who did what (delete a user, grant admin, delete a forum post,
 * start/stop automation, …).
 *
 * Design rule: logging must NEVER break the action it records. Every failure
 * here is swallowed and logged — a missing table (pre-migration) or a DB hiccup
 * can't turn a successful delete into a 500.
 *
 * Requires migration 017_create_admin_audit.sql.
 */

import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { logger } from "@/lib/logger";

export type AuditActor = { id: string; email?: string | null };

export interface AuditEntry {
  /** Dotted action name, e.g. "user.delete_user", "forum.post.delete", "automation.stop". */
  action: string;
  targetType?: string | null;
  targetId?: string | number | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/** Best-effort: pull the client IP from proxy headers (Nginx sets x-forwarded-for on the VPS). */
export function getRequestIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

export async function logAdminAction(actor: AuditActor, entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit").insert({
      actor_id: actor.id,
      actor_email: actor.email ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId != null ? String(entry.targetId) : null,
      // jsonb column — stringify so node-postgres stores valid JSON, not "[object Object]".
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ip: entry.ip ?? null,
    });
  } catch (err) {
    logger.error("admin_audit insert failed", err);
  }
}

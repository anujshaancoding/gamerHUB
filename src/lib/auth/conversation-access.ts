/**
 * Shared guard: verify a user is a participant of a conversation before
 * reading its messages or posting into it. Prevents IDOR where an attacker
 * enumerates conversation IDs to read or inject private DMs.
 */
import type { DatabaseClient } from "@/lib/db/query-builder";

export async function isConversationMember(
  db: DatabaseClient,
  conversationId: string,
  userId: string
): Promise<boolean> {
  if (!conversationId || !userId) return false;
  const { data } = await db
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

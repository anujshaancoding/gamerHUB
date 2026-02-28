/**
 * Server-side database client for API routes and server components.
 *
 * Usage in API routes:
 *   import { createClient } from "@/lib/db/client";
 *   const db = createClient();
 *   const { data, error } = await db.from("profiles").select("*").eq("id", userId).single();
 */

import { getPool } from "./index";
import { DatabaseClient } from "./query-builder";

export function createClient(): DatabaseClient {
  return new DatabaseClient(getPool());
}

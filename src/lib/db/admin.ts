/**
 * Admin database client with elevated privileges (no RLS).
 *
 * In the self-hosted setup, the regular client already has full access (no RLS),
 * so this is functionally identical to createClient(). Kept as a separate import
 * for semantic clarity and to maintain the same import pattern as before.
 */

import { getPool } from "./index";
import { DatabaseClient } from "./query-builder";

export function createAdminClient(): DatabaseClient {
  return new DatabaseClient(getPool());
}

/**
 * Sets `app.user_id` on the current PostgreSQL session so RLS policies
 * defined in migration 011 (`public.current_app_user_id()`) can identify
 * the request's user.
 *
 * Use from API routes that connect as `app_writer` and want user-scoped
 * policies enforced at the database layer:
 *
 *   const sql = getPool();
 *   await setRequestUser(sql, user.id);
 *   const rows = await sql`SELECT * FROM messages WHERE conversation_id = ${id}`;
 *
 * IMPORTANT: this uses `set_config(..., is_local=false)` so the setting
 * persists for the connection. With pgBouncer in transaction mode this
 * would leak across requests — wrap your queries in `sql.begin(async tx =>
 * { await setRequestUser(tx, id, { transaction: true }); ... })` if you
 * deploy behind a transaction-mode pooler.
 */

import type postgres from "postgres";

interface Options {
  transaction?: boolean;
}

export async function setRequestUser(
  sql: postgres.Sql,
  userId: string | null,
  opts: Options = {}
): Promise<void> {
  const value = userId ?? "";
  const isLocal = opts.transaction === true;
  await sql`SELECT set_config('app.user_id', ${value}, ${isLocal})`;
}

export async function clearRequestUser(sql: postgres.Sql): Promise<void> {
  await sql`SELECT set_config('app.user_id', '', false)`;
}

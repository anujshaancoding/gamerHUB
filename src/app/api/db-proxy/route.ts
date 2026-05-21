import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// Tables that allow UNAUTHENTICATED read access (public, non-sensitive).
const PUBLIC_READ_TABLES = new Set([
  "games",
  "profiles",
  "clans",
  "tournaments",
  "blog_posts",
  "news_articles",
  "news_sources",
  "friend_posts",
  "listings",
  "community_challenges",
  "lfg_posts",
  "clan_recruitment_posts",
]);

// Tables that allow read access for ANY authenticated user (social / non-private
// data). DEFAULT-DENY: a table that is on neither PUBLIC_READ_TABLES nor this set
// cannot be read through the proxy at all — sensitive data (auth tokens,
// messages, payments, verifications, etc.) must go through dedicated,
// ownership-checked API routes. This is the primary mitigation for the
// "read any table" account-takeover vector.
const AUTHED_READ_TABLES = new Set([
  "user_games",
  "follows",
  "clan_members",
  "achievements",
  "user_profile_badges",
  "blog_comments",
  "blog_likes",
  "blog_comment_likes",
  "clan_activity_log",
  "post_likes",
  "post_comments",
]);

// Tables readable by an authenticated user but ONLY their own rows. A mandatory
// ownership filter is injected server-side on SELECT for these (the client
// cannot read other users' rows even if it omits/forges the filter).
const OWNED_READ_TABLES: Record<string, string> = {
  blog_bookmarks: "user_id",
  profile_views: "viewer_id",
  notification_preferences: "user_id",
};

const READ_ALLOWED_TABLES = new Set<string>([
  ...PUBLIC_READ_TABLES,
  ...AUTHED_READ_TABLES,
  ...Object.keys(OWNED_READ_TABLES),
]);

// Tables that allow write operations (insert/update/delete/upsert) from authenticated clients
const WRITE_ALLOWED_TABLES = new Set([
  "friend_posts",
  "post_likes",
  "post_comments",
  "profile_views",
  "follows",
  "listings",
  "lfg_posts",
  "clan_join_requests",
  "trait_endorsements",
  "friend_requests",
  "notification_preferences",
]);

// RPC functions that clients are allowed to call
const RPC_ALLOWLIST = new Set([
  "get_leaderboard",
  "search_profiles",
  "get_trending_posts",
  "get_community_stats",
  "increment_blog_view",
]);

// Tables where the user_id must match the authenticated user. Every
// WRITE_ALLOWED_TABLES entry MUST appear here so ownership is enforced on all
// mutations (no write-allowed table may be ownership-exempt).
const USER_OWNED_TABLES = new Set([
  "friend_posts",
  "listings",
  "lfg_posts",
  "post_comments",
  "post_likes",
  "follows",
  "clan_join_requests",
  "trait_endorsements",
  "friend_requests",
  "notification_preferences",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, operation, columns, filters, data, options, rpc, rpcParams, orderBy, rangeFrom, rangeTo, limitCount } = body;

    const user = await getUser();

    // DEFAULT-DENY for reads: a table must be explicitly allowlisted to be
    // readable through the proxy. Anything not listed (auth tokens, messages,
    // payments, verifications, …) is rejected outright.
    if (operation === "select" && table) {
      if (!READ_ALLOWED_TABLES.has(table)) {
        console.warn(`[db-proxy] Denied SELECT on non-allowlisted table: ${table}`);
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      // Reads on non-public tables require authentication.
      if (!user && !PUBLIC_READ_TABLES.has(table)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Owned-read tables: force a server-side ownership filter so a user can
      // never read another user's rows, even by omitting/forging the filter.
      if (table in OWNED_READ_TABLES) {
        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    }

    // For write operations, require authentication
    if (operation && operation !== "select" && !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = createClient();

    // Handle RPC calls
    if (rpc) {
      if (!RPC_ALLOWLIST.has(rpc)) {
        return NextResponse.json(
          { error: "RPC function not allowed" },
          { status: 403 }
        );
      }
      const { data: result, error } = await db.rpc(rpc, rpcParams || {});
      if (error) {
        return NextResponse.json({ data: null, error: { message: error.message, code: error.code } });
      }
      return NextResponse.json({ data: result, error: null });
    }

    // Build query
    if (!table || !operation) {
      return NextResponse.json(
        { error: "table and operation are required" },
        { status: 400 }
      );
    }

    // Enforce write-allowed tables for all mutating operations
    const isWriteOp = operation !== "select";
    if (isWriteOp && !WRITE_ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: "Write access denied for this table" },
        { status: 403 }
      );
    }

    // For insert AND upsert, force the authenticated user's ID on user-owned
    // tables. Spread-then-override ensures a client-supplied user_id is always
    // discarded (closes the mass-assignment / cross-user-write vector).
    let writeData = data;
    if (
      (operation === "insert" || operation === "upsert") &&
      writeData &&
      user &&
      USER_OWNED_TABLES.has(table)
    ) {
      if (Array.isArray(writeData)) {
        writeData = writeData.map((row: Record<string, unknown>) => ({ ...row, user_id: user.id }));
      } else {
        writeData = { ...(writeData as Record<string, unknown>), user_id: user.id };
      }
    }

    // For update/delete/upsert on user-owned tables, require a user_id filter matching the authenticated user
    if ((operation === "update" || operation === "delete" || operation === "upsert") && USER_OWNED_TABLES.has(table) && user) {
      const hasUserIdFilter = filters && Array.isArray(filters) && filters.some(
        (f: { method: string; args: unknown[] }) =>
          f.method === "eq" && f.args[0] === "user_id" && f.args[1] === user.id
      );
      if (!hasUserIdFilter) {
        return NextResponse.json(
          { error: "Update/delete on this table requires a user_id filter matching your account" },
          { status: 403 }
        );
      }
    }

    let query: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- dynamic query builder dispatches arbitrary methods at runtime

    switch (operation) {
      case "select": {
        query = db.from(table).select(columns || "*", options || {});
        break;
      }
      case "insert": {
        query = db.from(table).insert(writeData as never);
        if (columns) query = query.select(columns);
        break;
      }
      case "update": {
        query = db.from(table).update(writeData as never);
        if (columns) query = query.select(columns);
        break;
      }
      case "delete": {
        query = db.from(table).delete();
        break;
      }
      case "upsert": {
        query = db.from(table).upsert(writeData as never, options || {});
        if (columns) query = query.select(columns);
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }

    // Inject a mandatory ownership predicate for owned-read tables so a user
    // can only ever read their own rows through the proxy, regardless of what
    // filters the client sent.
    if (operation === "select" && user && table in OWNED_READ_TABLES) {
      query = query.eq(OWNED_READ_TABLES[table], user.id);
    }

    // Apply filters — only allow safe query-builder methods
    const ALLOWED_FILTER_METHODS = new Set([
      "eq", "neq", "gt", "gte", "lt", "lte",
      "like", "ilike", "is", "in",
      "contains", "containedBy", "overlaps",
      "not", "or", "filter", "match",
      "textSearch",
      "single", "maybeSingle",
    ]);

    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        const { method, args } = filter;
        if (!ALLOWED_FILTER_METHODS.has(method)) {
          return NextResponse.json(
            { error: `Filter method '${method}' is not allowed` },
            { status: 400 }
          );
        }
        if (typeof query[method] === "function") {
          query = query[method](...args);
        }
      }
    }

    // Apply ordering
    if (orderBy && Array.isArray(orderBy)) {
      for (const order of orderBy) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }
    }

    // Apply range
    if (rangeFrom !== undefined && rangeTo !== undefined) {
      query = query.range(rangeFrom, rangeTo);
    }

    // Apply limit
    if (limitCount !== undefined) {
      query = query.limit(limitCount);
    }

    const result = await query;
    return NextResponse.json({
      data: result.data,
      error: result.error ? { message: result.error.message, code: result.error.code } : null,
      count: result.count ?? null,
    });
  } catch (error) {
    console.error("DB proxy error:", error);
    return NextResponse.json(
      { data: null, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}

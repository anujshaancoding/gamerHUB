import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// Tables that cannot be queried from the client side
const BLOCKED_TABLES = new Set([
  "users",
  "user_credentials",
  "stripe_customers",
  "stripe_webhook_events",
  "payment_transactions",
]);

// Tables that allow unauthenticated read access
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, operation, columns, filters, data, options, rpc, rpcParams, orderBy, rangeFrom, rangeTo, limitCount } = body;

    // Block sensitive tables
    if (table && BLOCKED_TABLES.has(table)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const user = await getUser();

    // For write operations, require authentication
    if (operation && operation !== "select" && !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For reads on non-public tables, require authentication
    if (operation === "select" && !user && table && !PUBLIC_READ_TABLES.has(table)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = createClient();

    // Handle RPC calls
    if (rpc) {
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

    let query: any;

    switch (operation) {
      case "select": {
        query = db.from(table).select(columns || "*", options || {});
        break;
      }
      case "insert": {
        query = db.from(table).insert(data as never);
        if (columns) query = query.select(columns);
        break;
      }
      case "update": {
        query = db.from(table).update(data as never);
        if (columns) query = query.select(columns);
        break;
      }
      case "delete": {
        query = db.from(table).delete();
        break;
      }
      case "upsert": {
        query = db.from(table).upsert(data as never, options || {});
        if (columns) query = query.select(columns);
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }

    // Apply filters
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        const { method, args } = filter;
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

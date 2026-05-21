/**
 * Admin endpoint: list registered user emails (for marketing / outreach).
 *
 * GET /api/admin/emails               -> paginated JSON { users, total }
 * GET /api/admin/emails?format=csv    -> CSV download of ALL matching rows
 *
 * Pulls email + provider from the `users` table joined to `profiles`
 * for the username/display name. Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Escape per RFC 4180; guard against CSV/formula injection.
  const needsQuote = /[",\n\r]/.test(s) || /^[=+\-@]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const rawSearch = (searchParams.get("search") || "").trim().slice(0, 100);
    const search = rawSearch || null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const sql = getPool();
    const pattern = search ? `%${search}%` : null;
    const where = search
      ? sql`WHERE u.email ILIKE ${pattern} OR p.username ILIKE ${pattern} OR p.display_name ILIKE ${pattern}`
      : sql``;

    if (format === "csv") {
      const rows = await sql`
        SELECT u.email, u.provider, u.email_confirmed_at, u.created_at,
               p.username, p.display_name
        FROM users u
        LEFT JOIN profiles p ON p.id = u.id
        ${where}
        ORDER BY u.created_at DESC
      `;

      const header = [
        "email",
        "username",
        "display_name",
        "provider",
        "verified",
        "joined",
      ];
      const lines = [header.join(",")];
      for (const r of rows) {
        lines.push(
          [
            csvCell(r.email),
            csvCell(r.username),
            csvCell(r.display_name),
            csvCell(r.provider),
            csvCell(r.email_confirmed_at ? "yes" : "no"),
            csvCell(
              r.created_at
                ? new Date(r.created_at as string).toISOString()
                : ""
            ),
          ].join(",")
        );
      }
      // Prepend BOM so Excel reads UTF-8 correctly.
      const csv = "﻿" + lines.join("\r\n");
      const stamp = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="gglobby-emails-${stamp}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const rows = await sql`
      SELECT u.email, u.provider, u.email_confirmed_at, u.created_at,
             p.username, p.display_name
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      ${where}
    `;

    return NextResponse.json({
      users: rows,
      total: countRows[0]?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Admin emails error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

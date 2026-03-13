import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/check-pin
 * Returns whether the admin PIN cookie is set (httpOnly cookie, so client can't read it directly).
 * Used by the admin layout to check PIN verification status.
 */
export async function GET(request: NextRequest) {
  const pinCookie = request.cookies.get("admin_pin_verified");
  return NextResponse.json({ verified: pinCookie?.value === "true" });
}

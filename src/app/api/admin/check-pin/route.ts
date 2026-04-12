import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyAdminToken } from "@/lib/security/admin-token";

/**
 * GET /api/admin/check-pin
 * Returns whether the admin PIN cookie contains a valid signed token.
 * Used by the admin layout to check PIN verification status.
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ verified: false });
  }

  const pinCookie = request.cookies.get("admin_pin_verified");
  if (!pinCookie?.value) {
    return NextResponse.json({ verified: false });
  }

  const valid = verifyAdminToken(pinCookie.value, user.id);
  return NextResponse.json({ verified: valid });
}

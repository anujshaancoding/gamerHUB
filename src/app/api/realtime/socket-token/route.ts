/**
 * Issues a short-lived signed token that the browser sends in the
 * Socket.IO handshake. The Socket.IO server verifies the token using the
 * same AUTH_SECRET — this is what prevents one user from spoofing another's
 * userId on the websocket and reading their private messages.
 */

import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { signSocketToken } from "@/lib/security/socket-token";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = signSocketToken(user.id);
  return NextResponse.json({
    token,
    userId: user.id,
    expiresInSeconds: 60 * 60,
  });
}

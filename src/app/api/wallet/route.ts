import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { noCacheResponse } from "@/lib/api/cache-headers";
import { getUser } from "@/lib/auth/get-user";

// GET - Get user's wallet balance
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create wallet using RPC
    const { data: wallet, error } = await db.rpc("get_or_create_wallet", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error fetching wallet:", error);
      return NextResponse.json(
        { error: "Failed to fetch wallet" },
        { status: 500 }
      );
    }

    return noCacheResponse({
      wallet: {
        coins: wallet.coins,
        gems: wallet.gems,
        lifetime_coins_earned: wallet.lifetime_coins_earned,
        lifetime_gems_purchased: wallet.lifetime_gems_purchased,
      },
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

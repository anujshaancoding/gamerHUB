import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Purchase shop item with virtual currency
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, currencyType } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    if (!currencyType || !["coins", "gems"].includes(currencyType)) {
      return NextResponse.json(
        { error: "Valid currency type is required (coins or gems)" },
        { status: 400 }
      );
    }

    // Call the purchase function
    const { data, error } = await db.rpc("purchase_shop_item", {
      p_user_id: user.id,
      p_item_id: itemId,
      p_currency_type: currencyType,
    });

    if (error) {
      console.error("Purchase error:", error);
      return NextResponse.json(
        { error: "Failed to process purchase" },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Purchase failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase: {
        itemName: data.item_name,
        itemType: data.item_type,
        amountPaid: data.amount_paid,
        currencyType: data.currency_type,
      },
    });
  } catch (error) {
    console.error("Shop purchase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

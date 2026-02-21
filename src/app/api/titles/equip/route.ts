import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPromoPeriodActive } from "@/lib/promo";

// POST - Equip a title
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title_id } = body;

    // If title_id is null, unequip current title
    if (title_id === null) {
      const { error } = await supabase
        .from("user_progression")
        .update({ active_title_id: null } as never)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to unequip title:", error);
        return NextResponse.json(
          { error: "Failed to unequip title" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, active_title_id: null });
    }

    // Check if title requires premium (special/purchase titles are premium-only)
    const { data: titleData } = await supabase
      .from("titles")
      .select("unlock_type")
      .eq("id", title_id)
      .single();

    if (titleData?.unlock_type === "special" || titleData?.unlock_type === "purchase") {
      if (!isPromoPeriodActive()) {
        const { data: sub } = await supabase
          .from("user_subscriptions" as any)
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .single();

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (!sub && !profile?.is_premium) {
          return NextResponse.json(
            { error: "Premium required to equip this title" },
            { status: 403 }
          );
        }
      }
    }

    // Verify user owns this title
    const { data: userTitle } = await supabase
      .from("user_titles")
      .select("id")
      .eq("user_id", user.id)
      .eq("title_id", title_id)
      .single();

    if (!userTitle) {
      return NextResponse.json(
        { error: "Title not unlocked" },
        { status: 400 }
      );
    }

    // Update active title
    const { error } = await supabase
      .from("user_progression")
      .update({ active_title_id: title_id } as never)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to equip title:", error);
      return NextResponse.json(
        { error: "Failed to equip title" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, active_title_id: title_id });
  } catch (error) {
    console.error("Title equip error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

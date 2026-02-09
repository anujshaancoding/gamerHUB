import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PlayStation OAuth configuration
const PSN_CONFIG = {
  clientId: process.env.PSN_CLIENT_ID!,
  clientSecret: process.env.PSN_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/playstation/callback`,
  scope: "psn:s2s",
};

// GET - Initiate PlayStation OAuth flow or show manual entry option
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PlayStation doesn't have a public OAuth API
    // Direct users to manual entry
    return NextResponse.json({
      method: "manual",
      instructions: "Enter your PSN Online ID manually",
      connect_url: null,
    });
  } catch (error) {
    console.error("PlayStation connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate PlayStation connection" },
      { status: 500 }
    );
  }
}

// POST - Manual PSN ID connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { online_id } = await request.json();

    if (!online_id || online_id.trim().length < 3) {
      return NextResponse.json(
        { error: "Valid PSN Online ID required" },
        { status: 400 }
      );
    }

    // Check if PSN ID is already linked to another account
    const { data: existingConnection } = await supabase
      .from("console_connections")
      .select("user_id")
      .eq("platform", "playstation")
      .eq("online_id", online_id.trim())
      .neq("user_id", user.id)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { error: "This PSN ID is already linked to another account" },
        { status: 400 }
      );
    }

    // Upsert the connection
    const { data, error } = await supabase
      .from("console_connections")
      .upsert({
        user_id: user.id,
        platform: "playstation",
        platform_user_id: online_id.trim().toLowerCase(),
        platform_username: online_id.trim(),
        online_id: online_id.trim(),
        is_verified: false, // Manual connections are unverified
        verification_method: "manual",
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      })
      .select()
      .single();

    if (error) {
      console.error("PlayStation connection error:", error);
      return NextResponse.json(
        { error: "Failed to connect PlayStation account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error) {
    console.error("PlayStation connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect PlayStation account" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect PlayStation
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("console_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "playstation");

    if (error) {
      console.error("PlayStation disconnect error:", error);
      return NextResponse.json(
        { error: "Failed to disconnect PlayStation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PlayStation disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect PlayStation" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import type { CreateOverlayRequest, UpdateOverlayRequest } from "@/types/creator";
import { getCreatorTier, getMaxOverlays } from "@/types/creator";

// GET - Get all overlays for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const { data: overlays, error } = await supabase
      .from("streamer_overlays")
      .select("*")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ overlays: overlays || [] });
  } catch (error) {
    console.error("Get overlays error:", error);
    return NextResponse.json(
      { error: "Failed to get overlays" },
      { status: 500 }
    );
  }
}

// POST - Create a new overlay
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found. Please create one first." },
        { status: 404 }
      );
    }

    // Check overlay limit based on tier
    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const tier = getCreatorTier(followerCount || 0);
    const maxOverlays = getMaxOverlays(tier);

    const { count: currentOverlays } = await supabase
      .from("streamer_overlays")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id);

    if ((currentOverlays || 0) >= maxOverlays) {
      return NextResponse.json(
        {
          error: `You've reached the maximum number of overlays (${maxOverlays}) for your tier. Upgrade to create more.`,
          tier,
          maxOverlays,
        },
        { status: 403 }
      );
    }

    const body: CreateOverlayRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 1) {
      return NextResponse.json(
        { error: "Overlay name is required" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "Overlay type is required" },
        { status: 400 }
      );
    }

    // Generate unique token for overlay access
    const token = randomBytes(16).toString("hex");

    const { data: overlay, error } = await supabase
      .from("streamer_overlays")
      .insert({
        creator_id: profile.id,
        name: body.name.trim(),
        type: body.type,
        config: body.config || {},
        token,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Create overlay error:", error);
      return NextResponse.json(
        { error: "Failed to create overlay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ overlay }, { status: 201 });
  } catch (error) {
    console.error("Create overlay error:", error);
    return NextResponse.json(
      { error: "Failed to create overlay" },
      { status: 500 }
    );
  }
}

// PATCH - Update an overlay
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const overlayId = searchParams.get("id");

    if (!overlayId) {
      return NextResponse.json(
        { error: "Overlay ID is required" },
        { status: 400 }
      );
    }

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Verify overlay belongs to user
    const { data: existing, error: existingError } = await supabase
      .from("streamer_overlays")
      .select("id, config")
      .eq("id", overlayId)
      .eq("creator_id", profile.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Overlay not found" },
        { status: 404 }
      );
    }

    const body: UpdateOverlayRequest = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (body.name.trim().length < 1) {
        return NextResponse.json(
          { error: "Overlay name is required" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.config !== undefined) {
      // Merge config updates
      updates.config = { ...existing.config, ...body.config };
    }

    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    const { data: overlay, error } = await supabase
      .from("streamer_overlays")
      .update(updates)
      .eq("id", overlayId)
      .select()
      .single();

    if (error) {
      console.error("Update overlay error:", error);
      return NextResponse.json(
        { error: "Failed to update overlay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ overlay });
  } catch (error) {
    console.error("Update overlay error:", error);
    return NextResponse.json(
      { error: "Failed to update overlay" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an overlay
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const overlayId = searchParams.get("id");

    if (!overlayId) {
      return NextResponse.json(
        { error: "Overlay ID is required" },
        { status: 400 }
      );
    }

    // Get creator profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Delete overlay (RLS will verify ownership)
    const { error } = await supabase
      .from("streamer_overlays")
      .delete()
      .eq("id", overlayId)
      .eq("creator_id", profile.id);

    if (error) {
      console.error("Delete overlay error:", error);
      return NextResponse.json(
        { error: "Failed to delete overlay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete overlay error:", error);
    return NextResponse.json(
      { error: "Failed to delete overlay" },
      { status: 500 }
    );
  }
}

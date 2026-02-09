import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateDNAProfileRequest,
  UpdateDNAProfileRequest,
  DNATraits,
  DNAWeights,
} from "@/types/squad-dna";
import { DEFAULT_DNA_PROFILE, DEFAULT_DNA_WEIGHTS } from "@/types/squad-dna";

// GET - Get current user's DNA profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const gameId = searchParams.get("gameId");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get specific user's profile (public view)
    if (userId) {
      let query = supabase
        .from("squad_dna_profiles")
        .select(`
          *,
          users!inner(id, username, avatar_url)
        `)
        .eq("user_id", userId);

      if (gameId) {
        query = query.eq("game_id", gameId);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        return NextResponse.json({ profile: null });
      }

      // Return the first profile (or game-specific if found)
      const profile = profiles[0];

      return NextResponse.json({
        profile: {
          ...profile,
          user: profile.users,
          users: undefined,
        },
      });
    }

    // Get current user's profile(s)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("squad_dna_profiles")
      .select("*")
      .eq("user_id", user.id);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: profiles, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      profiles: profiles || [],
      hasProfile: profiles && profiles.length > 0,
    });
  } catch (error) {
    console.error("Get DNA profile error:", error);
    return NextResponse.json(
      { error: "Failed to get DNA profile" },
      { status: 500 }
    );
  }
}

// POST - Create a new DNA profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateDNAProfileRequest = await request.json();

    // Validate traits
    if (!body.traits) {
      return NextResponse.json(
        { error: "Traits are required" },
        { status: 400 }
      );
    }

    // Ensure at least one trait per category
    const requiredCategories: (keyof DNATraits)[] = [
      "playstyle",
      "communication",
      "schedule",
      "competitiveness",
      "social",
      "learning",
    ];

    for (const category of requiredCategories) {
      if (!body.traits[category] || body.traits[category].length === 0) {
        // Use default if missing
        body.traits[category] = DEFAULT_DNA_PROFILE[category];
      }
    }

    // Check if profile already exists for this game
    const existingQuery = supabase
      .from("squad_dna_profiles")
      .select("id")
      .eq("user_id", user.id);

    if (body.game_id) {
      existingQuery.eq("game_id", body.game_id);
    } else {
      existingQuery.is("game_id", null);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json(
        { error: "DNA profile already exists. Use PATCH to update." },
        { status: 400 }
      );
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from("squad_dna_profiles")
      .insert({
        user_id: user.id,
        game_id: body.game_id || null,
        traits: body.traits,
        weights: body.weights || DEFAULT_DNA_WEIGHTS,
      })
      .select()
      .single();

    if (error) {
      console.error("Create DNA profile error:", error);
      return NextResponse.json(
        { error: "Failed to create DNA profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Create DNA profile error:", error);
    return NextResponse.json(
      { error: "Failed to create DNA profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update DNA profile
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
    const profileId = searchParams.get("id");
    const gameId = searchParams.get("gameId");

    const body: UpdateDNAProfileRequest = await request.json();

    // Find the profile to update
    let query = supabase
      .from("squad_dna_profiles")
      .select("*")
      .eq("user_id", user.id);

    if (profileId) {
      query = query.eq("id", profileId);
    } else if (gameId) {
      query = query.eq("game_id", gameId);
    } else {
      query = query.is("game_id", null);
    }

    const { data: existing, error: fetchError } = await query.single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "DNA profile not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.traits) {
      // Merge traits
      updates.traits = { ...existing.traits, ...body.traits };
    }

    if (body.weights) {
      // Merge weights
      updates.weights = { ...existing.weights, ...body.weights };
    }

    const { data: profile, error } = await supabase
      .from("squad_dna_profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Update DNA profile error:", error);
      return NextResponse.json(
        { error: "Failed to update DNA profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Update DNA profile error:", error);
    return NextResponse.json(
      { error: "Failed to update DNA profile" },
      { status: 500 }
    );
  }
}

// DELETE - Delete DNA profile
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
    const profileId = searchParams.get("id");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("squad_dna_profiles")
      .delete()
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete DNA profile error:", error);
    return NextResponse.json(
      { error: "Failed to delete DNA profile" },
      { status: 500 }
    );
  }
}

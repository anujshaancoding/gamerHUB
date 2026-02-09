import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SetMoodRequest, GamingMood, MoodIntensity } from "@/types/mood";
import { GAMING_MOODS, DEFAULT_MOOD_DURATION } from "@/types/mood";

// GET - Get current user's mood
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current active mood
    const { data: mood, error } = await supabase
      .from("user_mood")
      .select("*")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      mood: mood || null,
      hasMood: !!mood,
    });
  } catch (error) {
    console.error("Get mood error:", error);
    return NextResponse.json(
      { error: "Failed to get mood" },
      { status: 500 }
    );
  }
}

// POST - Set current mood
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SetMoodRequest = await request.json();

    // Validate mood
    if (!body.mood || !GAMING_MOODS[body.mood as GamingMood]) {
      return NextResponse.json(
        { error: "Invalid mood" },
        { status: 400 }
      );
    }

    // Validate intensity
    const intensity: MoodIntensity = (body.intensity || 3) as MoodIntensity;
    if (intensity < 1 || intensity > 5) {
      return NextResponse.json(
        { error: "Intensity must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Calculate expiry
    const durationHours = body.duration_hours || DEFAULT_MOOD_DURATION;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    // First, expire any existing moods
    await supabase
      .from("user_mood")
      .update({ expires_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString());

    // Create new mood entry
    const { data: mood, error } = await supabase
      .from("user_mood")
      .insert({
        user_id: user.id,
        mood: body.mood,
        intensity,
        game_id: body.game_id || null,
        note: body.note?.substring(0, 200) || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Set mood error:", error);
      return NextResponse.json(
        { error: "Failed to set mood" },
        { status: 500 }
      );
    }

    // Add to mood history
    await supabase.from("mood_history").insert({
      user_id: user.id,
      mood: body.mood,
      intensity,
      game_id: body.game_id || null,
    });

    return NextResponse.json({ mood });
  } catch (error) {
    console.error("Set mood error:", error);
    return NextResponse.json(
      { error: "Failed to set mood" },
      { status: 500 }
    );
  }
}

// PATCH - Update current mood
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get current mood
    const { data: currentMood } = await supabase
      .from("user_mood")
      .select("id")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!currentMood) {
      return NextResponse.json(
        { error: "No active mood to update" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.intensity !== undefined) {
      if (body.intensity < 1 || body.intensity > 5) {
        return NextResponse.json(
          { error: "Intensity must be between 1 and 5" },
          { status: 400 }
        );
      }
      updates.intensity = body.intensity;
    }

    if (body.note !== undefined) {
      updates.note = body.note?.substring(0, 200) || null;
    }

    if (body.extend_hours !== undefined) {
      const extendMs = body.extend_hours * 60 * 60 * 1000;
      const newExpiry = new Date(Date.now() + extendMs);
      updates.expires_at = newExpiry.toISOString();
    }

    const { data: mood, error } = await supabase
      .from("user_mood")
      .update(updates)
      .eq("id", currentMood.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ mood });
  } catch (error) {
    console.error("Update mood error:", error);
    return NextResponse.json(
      { error: "Failed to update mood" },
      { status: 500 }
    );
  }
}

// DELETE - Clear current mood
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Expire all active moods
    const { error } = await supabase
      .from("user_mood")
      .update({ expires_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString());

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear mood error:", error);
    return NextResponse.json(
      { error: "Failed to clear mood" },
      { status: 500 }
    );
  }
}

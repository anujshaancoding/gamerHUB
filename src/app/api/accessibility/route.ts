import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { UpdateAccessibilitySettingsRequest } from "@/types/accessibility";
import { DEFAULT_ACCESSIBILITY_SETTINGS } from "@/types/accessibility";
import { getUser } from "@/lib/auth/get-user";

// GET - Get current accessibility settings
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings, error } = await db
      .from("accessibility_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Get accessibility settings error:", error);
      return NextResponse.json(
        { error: "Failed to get settings" },
        { status: 500 }
      );
    }

    // Return settings or defaults
    return NextResponse.json({
      settings: settings || {
        ...DEFAULT_ACCESSIBILITY_SETTINGS,
        user_id: user.id,
      },
    });
  } catch (error) {
    console.error("Get accessibility settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// POST - Create or update accessibility settings
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateAccessibilitySettingsRequest = await request.json();

    // Validate text_scale
    if (body.text_scale !== undefined) {
      if (body.text_scale < 0.75 || body.text_scale > 2.0) {
        return NextResponse.json(
          { error: "Text scale must be between 0.75 and 2.0" },
          { status: 400 }
        );
      }
    }

    // Validate volumes
    if (body.sound_effects_volume !== undefined) {
      if (body.sound_effects_volume < 0 || body.sound_effects_volume > 100) {
        return NextResponse.json(
          { error: "Volume must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    if (body.voice_chat_volume !== undefined) {
      if (body.voice_chat_volume < 0 || body.voice_chat_volume > 100) {
        return NextResponse.json(
          { error: "Volume must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // Validate TTS rate
    if (body.tts_rate !== undefined) {
      if (body.tts_rate < 0.5 || body.tts_rate > 2.0) {
        return NextResponse.json(
          { error: "TTS rate must be between 0.5 and 2.0" },
          { status: 400 }
        );
      }
    }

    // Check if settings exist
    const { data: existing } = await db
      .from("accessibility_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let settings;

    if (existing) {
      // Update existing
      const { data, error } = await db
        .from("accessibility_settings")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Update accessibility settings error:", error);
        return NextResponse.json(
          { error: "Failed to update settings" },
          { status: 500 }
        );
      }

      settings = data;
    } else {
      // Create new
      const { data, error } = await db
        .from("accessibility_settings")
        .insert({
          user_id: user.id,
          ...DEFAULT_ACCESSIBILITY_SETTINGS,
          ...body,
        })
        .select()
        .single();

      if (error) {
        console.error("Create accessibility settings error:", error);
        return NextResponse.json(
          { error: "Failed to create settings" },
          { status: 500 }
        );
      }

      settings = data;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update accessibility settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// DELETE - Reset to defaults
export async function DELETE() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await db
      .from("accessibility_settings")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Reset accessibility settings error:", error);
      return NextResponse.json(
        { error: "Failed to reset settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...DEFAULT_ACCESSIBILITY_SETTINGS,
        user_id: user.id,
      },
    });
  } catch (error) {
    console.error("Reset accessibility settings error:", error);
    return NextResponse.json(
      { error: "Failed to reset settings" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/verification/status - Get user's verification status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account verification status
    const { data: verification, error: verificationError } = await supabase
      .from("account_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (verificationError && verificationError.code !== "PGRST116") {
      console.error("Error fetching verification:", verificationError);
      return NextResponse.json(
        { error: "Failed to fetch verification status" },
        { status: 500 }
      );
    }

    // If no verification record exists, create one
    if (!verification) {
      const { data: newVerification, error: createError } = await supabase
        .from("account_verifications")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        console.error("Error creating verification:", createError);
        return NextResponse.json(
          { error: "Failed to create verification status" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        verification_level: 0,
        trust_score: 50,
        email_verified: false,
        phone_verified: false,
        game_account_verified: false,
        verified_game_accounts: [],
        verified_platforms: [],
        is_flagged: false,
        is_restricted: false,
        badges: [],
      });
    }

    // Get verified badges
    const { data: badges } = await supabase
      .from("verified_badges")
      .select(
        `
        *,
        game:games(id, slug, name, icon_url)
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true);

    return NextResponse.json({
      verification_level: verification.verification_level,
      trust_score: verification.trust_score,
      trust_factors: verification.trust_factors,
      email_verified: verification.email_verified,
      phone_verified: verification.phone_verified,
      game_account_verified: verification.game_account_verified,
      verified_game_accounts: verification.verified_game_accounts || [],
      verified_platforms: verification.verified_platforms || [],
      is_flagged: verification.is_flagged,
      flag_reason: verification.is_flagged ? verification.flag_reason : null,
      is_restricted: verification.is_restricted,
      restriction_reason: verification.is_restricted
        ? verification.restriction_reason
        : null,
      restriction_expires_at: verification.restriction_expires_at,
      captcha_required: verification.captcha_required,
      badges: badges || [],
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/verification/status - Update verification (mark email verified, etc.)
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
    const { action } = body;

    switch (action) {
      case "verify_email": {
        // Check if email is actually confirmed in auth
        if (!user.email_confirmed_at) {
          return NextResponse.json(
            { error: "Email not confirmed in authentication" },
            { status: 400 }
          );
        }

        // Update verification status
        const { error } = await supabase
          .from("account_verifications")
          .update({
            email_verified: true,
            verification_level: 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) {
          return NextResponse.json(
            { error: "Failed to update verification" },
            { status: 500 }
          );
        }

        // Create badge
        await supabase.from("verified_badges").upsert(
          {
            user_id: user.id,
            badge_type: "email_verified",
            verification_method: "email_confirmation",
            verified_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "user_id,badge_type,game_id" }
        );

        // Recalculate trust score
        await supabase.rpc("calculate_trust_score", { p_user_id: user.id });

        return NextResponse.json({
          success: true,
          message: "Email verification recorded",
        });
      }

      case "recalculate_trust": {
        const { data: score } = await supabase.rpc("calculate_trust_score", {
          p_user_id: user.id,
        });

        return NextResponse.json({
          success: true,
          trust_score: score,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Update verification status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

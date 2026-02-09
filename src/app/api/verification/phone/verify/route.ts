import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/verification/phone/verify - Verify the code
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
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Get the verification record
    const { data: verification, error: fetchError } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: "No pending verification found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if already verified
    if (verification.verified_at) {
      return NextResponse.json({
        success: true,
        message: "Phone already verified",
        verified: true,
      });
    }

    // Check if code has expired
    if (
      verification.code_expires_at &&
      new Date(verification.code_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempts
    if (verification.attempts >= verification.max_attempts) {
      return NextResponse.json(
        {
          error:
            "Too many failed attempts. Please request a new verification code.",
        },
        { status: 400 }
      );
    }

    // Verify the code
    if (verification.verification_code !== code) {
      // Increment attempts
      await supabase
        .from("phone_verifications")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);

      const attemptsRemaining =
        verification.max_attempts - (verification.attempts + 1);

      return NextResponse.json(
        {
          error: "Invalid verification code",
          attempts_remaining: attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // Code is correct - mark as verified
    const { error: updateError } = await supabase
      .from("phone_verifications")
      .update({
        verified_at: new Date().toISOString(),
        verification_code: null, // Clear the code
      })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      return NextResponse.json(
        { error: "Failed to complete verification" },
        { status: 500 }
      );
    }

    // Update account verification status
    await supabase
      .from("account_verifications")
      .update({
        phone_verified: true,
        verification_level: 2, // Phone verified level
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Create verified badge
    await supabase.from("verified_badges").upsert(
      {
        user_id: user.id,
        badge_type: "phone_verified",
        verification_method: "phone_sms",
        verified_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "user_id,badge_type,game_id" }
    );

    // Recalculate trust score
    await supabase.rpc("calculate_trust_score", { p_user_id: user.id });

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

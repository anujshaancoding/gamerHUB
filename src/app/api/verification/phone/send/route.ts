import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/verification/phone/send - Send verification code
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
    const { phone_number, country_code } = body;

    if (!phone_number || !country_code) {
      return NextResponse.json(
        { error: "Phone number and country code are required" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(phone_number.replace(/\D/g, ""))) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Check if phone is already verified by another user
    const { data: existingPhone } = await supabase
      .from("phone_verifications")
      .select("user_id, verified_at")
      .eq("phone_number", phone_number)
      .neq("user_id", user.id)
      .single();

    if (existingPhone?.verified_at) {
      return NextResponse.json(
        { error: "This phone number is already verified by another account" },
        { status: 400 }
      );
    }

    // Check rate limiting (can only send once per 60 seconds)
    const { data: existingVerification } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingVerification?.last_sent_at) {
      const lastSent = new Date(existingVerification.last_sent_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSent.getTime()) / 1000;

      if (diffSeconds < 60) {
        const waitTime = Math.ceil(60 - diffSeconds);
        return NextResponse.json(
          {
            error: `Please wait ${waitTime} seconds before requesting another code`,
            can_resend_at: new Date(
              lastSent.getTime() + 60000
            ).toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert phone verification record
    const { data, error } = await supabase
      .from("phone_verifications")
      .upsert(
        {
          user_id: user.id,
          phone_number,
          country_code,
          verification_code: verificationCode,
          code_expires_at: expiresAt.toISOString(),
          attempts: 0,
          last_sent_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error creating phone verification:", error);
      return NextResponse.json(
        { error: "Failed to create verification" },
        { status: 500 }
      );
    }

    // TODO: Integrate with SMS provider (Twilio, etc.)
    // For now, we'll log the code (in production, send via SMS)
    console.log(
      `[DEV] Verification code for ${phone_number}: ${verificationCode}`
    );

    // In production, you would:
    // await sendSMS(phone_number, `Your GamerHub verification code is: ${verificationCode}`);

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      phone_number_masked: maskPhoneNumber(phone_number),
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send verification code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return "****";
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}

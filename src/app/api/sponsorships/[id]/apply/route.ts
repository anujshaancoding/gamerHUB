import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplySponsorshipRequest } from "@/types/creator";
import { getCreatorTier, canAccessFeature } from "@/types/creator";

// POST - Apply to a sponsorship
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sponsorshipId } = await params;
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
        { error: "Creator profile required to apply for sponsorships" },
        { status: 403 }
      );
    }

    // Check tier eligibility
    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const tier = getCreatorTier(followerCount || 0);

    if (!canAccessFeature(tier, "sponsorships")) {
      return NextResponse.json({
        error: "Sponsorships require Gold tier or higher",
        currentTier: tier,
        requiredTier: "gold",
      }, { status: 403 });
    }

    // Get sponsorship details
    const { data: sponsorship, error: sponsorshipError } = await supabase
      .from("sponsorship_opportunities")
      .select("*")
      .eq("id", sponsorshipId)
      .single();

    if (sponsorshipError || !sponsorship) {
      return NextResponse.json(
        { error: "Sponsorship not found" },
        { status: 404 }
      );
    }

    // Check if sponsorship is still open
    if (sponsorship.status !== "open") {
      return NextResponse.json(
        { error: "This sponsorship is no longer accepting applications" },
        { status: 400 }
      );
    }

    // Check deadline
    if (sponsorship.application_deadline) {
      const deadline = new Date(sponsorship.application_deadline);
      if (deadline < new Date()) {
        return NextResponse.json(
          { error: "Application deadline has passed" },
          { status: 400 }
        );
      }
    }

    // Check follower requirement
    if ((followerCount || 0) < sponsorship.min_followers) {
      return NextResponse.json({
        error: `This sponsorship requires at least ${sponsorship.min_followers} followers`,
        currentFollowers: followerCount || 0,
        requiredFollowers: sponsorship.min_followers,
      }, { status: 403 });
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from("sponsorship_applications")
      .select("id, status")
      .eq("sponsorship_id", sponsorshipId)
      .eq("creator_id", profile.id)
      .single();

    if (existingApplication) {
      return NextResponse.json({
        error: "You have already applied to this sponsorship",
        applicationStatus: existingApplication.status,
      }, { status: 400 });
    }

    const body: ApplySponsorshipRequest = await request.json();

    // Validate pitch
    if (!body.pitch || body.pitch.trim().length < 50) {
      return NextResponse.json(
        { error: "Pitch must be at least 50 characters" },
        { status: 400 }
      );
    }

    // Create application
    const { data: application, error } = await supabase
      .from("sponsorship_applications")
      .insert({
        sponsorship_id: sponsorshipId,
        creator_id: profile.id,
        pitch: body.pitch.trim(),
        portfolio_urls: body.portfolio_urls || [],
        expected_deliverables: body.expected_deliverables?.trim() || null,
        additional_info: body.additional_info?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Apply to sponsorship error:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Apply to sponsorship error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// GET - Get user's application for a specific sponsorship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sponsorshipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ application: null });
    }

    const { data: application, error } = await supabase
      .from("sponsorship_applications")
      .select(`
        *,
        sponsorship_opportunities(
          title,
          brand_name,
          brand_logo,
          category,
          status
        )
      `)
      .eq("sponsorship_id", sponsorshipId)
      .eq("creator_id", profile.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({ application: application || null });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { error: "Failed to get application" },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sponsorshipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Check application exists and is pending
    const { data: application } = await supabase
      .from("sponsorship_applications")
      .select("id, status")
      .eq("sponsorship_id", sponsorshipId)
      .eq("creator_id", profile.id)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Can only withdraw pending applications" },
        { status: 400 }
      );
    }

    // Update to withdrawn status
    const { error } = await supabase
      .from("sponsorship_applications")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", application.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Withdraw application error:", error);
    return NextResponse.json(
      { error: "Failed to withdraw application" },
      { status: 500 }
    );
  }
}

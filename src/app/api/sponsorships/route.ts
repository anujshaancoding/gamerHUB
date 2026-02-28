import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { SponsorshipCategory, SponsorshipStatus } from "@/types/creator";
import { getCreatorTier, canAccessFeature } from "@/types/creator";
import { getUser } from "@/lib/auth/get-user";

// GET - Get available sponsorship opportunities
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as SponsorshipCategory | null;
    const status = searchParams.get("status") as SponsorshipStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = (page - 1) * limit;

    // Get creator profile and check eligibility
    const { data: profile } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile required to view sponsorships" },
        { status: 403 }
      );
    }

    // Check tier eligibility
    const { count: followerCount } = await db
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const tier = getCreatorTier(followerCount || 0);

    if (!canAccessFeature(tier, "sponsorships")) {
      return NextResponse.json({
        error: "Sponsorships require Gold tier or higher",
        currentTier: tier,
        requiredTier: "gold",
        followerCount: followerCount || 0,
      }, { status: 403 });
    }

    // Build query
    let query = db
      .from("sponsorship_opportunities")
      .select("*", { count: "exact" });

    // Filter by status (default to open)
    query = query.eq("status", status || "open");

    // Filter by category if provided
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by follower requirement
    query = query.lte("min_followers", followerCount || 0);

    // Execute query with pagination
    const { data: sponsorships, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get user's applications
    const sponsorshipIds = sponsorships?.map(s => s.id) || [];
    const { data: applications } = await db
      .from("sponsorship_applications")
      .select("sponsorship_id, status")
      .eq("creator_id", profile.id)
      .in("sponsorship_id", sponsorshipIds);

    const applicationMap = new Map(
      applications?.map(a => [a.sponsorship_id, a.status]) || []
    );

    // Enrich sponsorships with application status
    const enrichedSponsorships = sponsorships?.map(s => ({
      ...s,
      user_applied: applicationMap.has(s.id),
      user_application_status: applicationMap.get(s.id) || null,
    })) || [];

    return NextResponse.json({
      sponsorships: enrichedSponsorships,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      eligibility: {
        tier,
        followerCount: followerCount || 0,
      },
    });
  } catch (error) {
    console.error("Get sponsorships error:", error);
    return NextResponse.json(
      { error: "Failed to get sponsorships" },
      { status: 500 }
    );
  }
}

// POST - Create a new sponsorship opportunity (admin only)
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await db
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (!body.brand_name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const { data: sponsorship, error } = await db
      .from("sponsorship_opportunities")
      .insert({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        brand_name: body.brand_name.trim(),
        brand_logo: body.brand_logo || null,
        category: body.category,
        requirements: body.requirements || {},
        benefits: body.benefits || {},
        min_followers: body.min_followers || 0,
        application_deadline: body.application_deadline || null,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Create sponsorship error:", error);
      return NextResponse.json(
        { error: "Failed to create sponsorship" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sponsorship }, { status: 201 });
  } catch (error) {
    console.error("Create sponsorship error:", error);
    return NextResponse.json(
      { error: "Failed to create sponsorship" },
      { status: 500 }
    );
  }
}

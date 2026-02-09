import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REGIONS, type Region, type JoinRegionalCommunityRequest } from "@/types/localization";

// GET - Get communities for a specific region
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: regionCode } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Validate region
    if (!REGIONS[regionCode as Region]) {
      return NextResponse.json(
        { error: "Invalid region code" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build query
    let query = supabase
      .from("regional_communities")
      .select(`
        *,
        regional_community_members(id)
      `, { count: "exact" })
      .eq("region_code", regionCode)
      .eq("is_active", true);

    // Filter by language if provided
    if (language) {
      query = query.eq("primary_language", language);
    }

    // Execute query
    const { data: communities, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Enrich with member counts and user membership status
    const enrichedCommunities = await Promise.all(
      (communities || []).map(async (community) => {
        const memberCount = community.regional_community_members?.length || 0;

        // Get online count (users active in last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { count: onlineCount } = await supabase
          .from("regional_community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", community.id)
          .gte("last_active", fifteenMinutesAgo);

        // Check if user is a member
        let isMember = false;
        if (user) {
          const { data: membership } = await supabase
            .from("regional_community_members")
            .select("id")
            .eq("community_id", community.id)
            .eq("user_id", user.id)
            .single();

          isMember = !!membership;
        }

        return {
          ...community,
          member_count: memberCount,
          online_count: onlineCount || 0,
          is_member: isMember,
          regional_community_members: undefined, // Remove raw data
        };
      })
    );

    return NextResponse.json({
      communities: enrichedCommunities,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      region: {
        code: regionCode,
        ...REGIONS[regionCode as Region],
      },
    });
  } catch (error) {
    console.error("Get regional communities error:", error);
    return NextResponse.json(
      { error: "Failed to get communities" },
      { status: 500 }
    );
  }
}

// POST - Join a regional community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: regionCode } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate region
    if (!REGIONS[regionCode as Region]) {
      return NextResponse.json(
        { error: "Invalid region code" },
        { status: 400 }
      );
    }

    const body: JoinRegionalCommunityRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    // Verify community exists and is in the correct region
    const { data: community, error: communityError } = await supabase
      .from("regional_communities")
      .select("id, name, region_code, is_active")
      .eq("id", communityId)
      .eq("region_code", regionCode)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    if (!community.is_active) {
      return NextResponse.json(
        { error: "Community is not active" },
        { status: 400 }
      );
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from("regional_community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this community" },
        { status: 400 }
      );
    }

    // Join the community
    const { data: membership, error } = await supabase
      .from("regional_community_members")
      .insert({
        community_id: communityId,
        user_id: user.id,
        preferred_language: body.language || REGIONS[regionCode as Region].languages[0],
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Join community error:", error);
      return NextResponse.json(
        { error: "Failed to join community" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      membership,
      community: {
        id: community.id,
        name: community.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 }
    );
  }
}

// DELETE - Leave a regional community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: regionCode } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    // Leave the community
    const { error } = await supabase
      .from("regional_community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Leave community error:", error);
      return NextResponse.json(
        { error: "Failed to leave community" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json(
      { error: "Failed to leave community" },
      { status: 500 }
    );
  }
}

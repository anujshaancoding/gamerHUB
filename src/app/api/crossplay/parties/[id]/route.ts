import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { JoinCrossplayPartyRequest, UpdatePartyMemberRequest } from "@/types/console";

// GET - Get party details or join by invite code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if id is an invite code (6 alphanumeric) or UUID
    const isInviteCode = /^[A-Z0-9]{6}$/.test(id);

    let query = supabase
      .from("crossplay_parties")
      .select(`
        *,
        creator:profiles!crossplay_parties_creator_id_fkey(
          id,
          username,
          avatar_url
        ),
        game:games(
          id,
          slug,
          name,
          icon_url
        ),
        members:crossplay_party_members(
          id,
          user_id,
          platform,
          platform_username,
          is_leader,
          can_invite,
          status,
          joined_at,
          user:profiles!crossplay_party_members_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `);

    if (isInviteCode) {
      query = query.eq("invite_code", id);
    } else {
      query = query.eq("id", id);
    }

    const { data: party, error } = await query.single();

    if (error || !party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    return NextResponse.json({ party });
  } catch (error) {
    console.error("Get party error:", error);
    return NextResponse.json(
      { error: "Failed to get party" },
      { status: 500 }
    );
  }
}

// POST - Join a party
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: JoinCrossplayPartyRequest = await request.json();

    // Find the party
    const isInviteCode = /^[A-Z0-9]{6}$/.test(id);
    let partyQuery = supabase.from("crossplay_parties").select("*");

    if (isInviteCode) {
      partyQuery = partyQuery.eq("invite_code", id);
    } else {
      partyQuery = partyQuery.eq("id", id);
    }

    const { data: party, error: partyError } = await partyQuery.single();

    if (partyError || !party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Check if party is open
    if (party.status === "closed") {
      return NextResponse.json(
        { error: "This party is closed" },
        { status: 400 }
      );
    }

    if (party.status === "full" || party.current_members >= party.max_members) {
      return NextResponse.json(
        { error: "This party is full" },
        { status: 400 }
      );
    }

    // Check if party has expired
    if (new Date(party.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This party has expired" },
        { status: 400 }
      );
    }

    // Check if platform is allowed
    if (body.platform && !party.platforms_allowed.includes(body.platform)) {
      return NextResponse.json(
        { error: "Your platform is not allowed in this party" },
        { status: 400 }
      );
    }

    // Check if user is already in the party
    const { data: existingMember } = await supabase
      .from("crossplay_party_members")
      .select("id")
      .eq("party_id", party.id)
      .eq("user_id", user.id)
      .is("left_at", null)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already in this party" },
        { status: 400 }
      );
    }

    // Add user to party
    const { error: memberError } = await supabase
      .from("crossplay_party_members")
      .insert({
        party_id: party.id,
        user_id: user.id,
        platform: body.platform || "pc",
        platform_username: body.platform_username,
        is_leader: false,
        can_invite: false,
        status: "joined",
      });

    if (memberError) {
      console.error("Join party error:", memberError);
      return NextResponse.json(
        { error: "Failed to join party" },
        { status: 500 }
      );
    }

    // Update party member count
    const newMemberCount = party.current_members + 1;
    const newStatus = newMemberCount >= party.max_members ? "full" : "open";

    await supabase
      .from("crossplay_parties")
      .update({
        current_members: newMemberCount,
        status: newStatus,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", party.id);

    // Fetch updated party
    const { data: updatedParty } = await supabase
      .from("crossplay_parties")
      .select(`
        *,
        creator:profiles!crossplay_parties_creator_id_fkey(
          id,
          username,
          avatar_url
        ),
        game:games(
          id,
          slug,
          name,
          icon_url
        ),
        members:crossplay_party_members(
          id,
          user_id,
          platform,
          is_leader,
          status,
          user:profiles!crossplay_party_members_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("id", party.id)
      .single();

    return NextResponse.json({
      success: true,
      party: updatedParty,
    });
  } catch (error) {
    console.error("Join party error:", error);
    return NextResponse.json(
      { error: "Failed to join party" },
      { status: 500 }
    );
  }
}

// PATCH - Update party or member status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get the party
    const { data: party } = await supabase
      .from("crossplay_parties")
      .select("*, members:crossplay_party_members(*)")
      .eq("id", id)
      .single();

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Check if user is in the party
    const userMember = party.members.find(
      (m: { user_id: string; left_at: string | null }) =>
        m.user_id === user.id && !m.left_at
    );

    if (!userMember) {
      return NextResponse.json(
        { error: "You are not in this party" },
        { status: 403 }
      );
    }

    // Update member status if provided
    if (body.member_status) {
      const updateData: UpdatePartyMemberRequest = {
        status: body.member_status,
      };

      if (body.platform_username) {
        updateData.platform_username = body.platform_username;
      }

      await supabase
        .from("crossplay_party_members")
        .update(updateData)
        .eq("id", userMember.id);
    }

    // Leader-only actions
    if (userMember.is_leader) {
      const partyUpdates: Record<string, string | null> = {};

      if (body.title !== undefined) partyUpdates.title = body.title;
      if (body.description !== undefined) partyUpdates.description = body.description;
      if (body.voice_channel_link !== undefined)
        partyUpdates.voice_channel_link = body.voice_channel_link;
      if (body.status) partyUpdates.status = body.status;

      if (Object.keys(partyUpdates).length > 0) {
        await supabase
          .from("crossplay_parties")
          .update({
            ...partyUpdates,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", id);
      }

      // Transfer leadership
      if (body.transfer_leadership_to) {
        const newLeader = party.members.find(
          (m: { user_id: string; left_at: string | null }) =>
            m.user_id === body.transfer_leadership_to && !m.left_at
        );

        if (newLeader) {
          await supabase
            .from("crossplay_party_members")
            .update({ is_leader: false })
            .eq("id", userMember.id);

          await supabase
            .from("crossplay_party_members")
            .update({ is_leader: true, can_invite: true })
            .eq("id", newLeader.id);
        }
      }
    }

    // Fetch updated party
    const { data: updatedParty } = await supabase
      .from("crossplay_parties")
      .select(`
        *,
        creator:profiles!crossplay_parties_creator_id_fkey(
          id,
          username,
          avatar_url
        ),
        game:games(
          id,
          slug,
          name,
          icon_url
        ),
        members:crossplay_party_members(
          id,
          user_id,
          platform,
          is_leader,
          status,
          user:profiles!crossplay_party_members_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("id", id)
      .single();

    return NextResponse.json({
      success: true,
      party: updatedParty,
    });
  } catch (error) {
    console.error("Update party error:", error);
    return NextResponse.json(
      { error: "Failed to update party" },
      { status: 500 }
    );
  }
}

// DELETE - Leave or close party
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the party
    const { data: party } = await supabase
      .from("crossplay_parties")
      .select("*, members:crossplay_party_members(*)")
      .eq("id", id)
      .single();

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Find user's membership
    const userMember = party.members.find(
      (m: { user_id: string; left_at: string | null }) =>
        m.user_id === user.id && !m.left_at
    );

    if (!userMember) {
      return NextResponse.json(
        { error: "You are not in this party" },
        { status: 403 }
      );
    }

    // If leader wants to close the party
    if (userMember.is_leader) {
      // Close the party
      await supabase
        .from("crossplay_parties")
        .update({
          status: "closed",
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Mark all members as left
      await supabase
        .from("crossplay_party_members")
        .update({ left_at: new Date().toISOString() })
        .eq("party_id", id)
        .is("left_at", null);

      return NextResponse.json({
        success: true,
        action: "closed",
      });
    }

    // Regular member leaving
    await supabase
      .from("crossplay_party_members")
      .update({ left_at: new Date().toISOString() })
      .eq("id", userMember.id);

    // Update member count
    const newMemberCount = party.current_members - 1;
    const newStatus = newMemberCount < party.max_members ? "open" : "full";

    await supabase
      .from("crossplay_parties")
      .update({
        current_members: newMemberCount,
        status: newStatus,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      action: "left",
    });
  } catch (error) {
    console.error("Leave party error:", error);
    return NextResponse.json(
      { error: "Failed to leave party" },
      { status: 500 }
    );
  }
}

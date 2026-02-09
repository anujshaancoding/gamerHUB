import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ImportFriendsResponse } from "@/types/discord";

// GET - Get imported Discord friends
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchedOnly = searchParams.get("matched") === "true";

    let query = supabase
      .from("discord_friends")
      .select(`
        *,
        gamerhub_user:profiles!discord_friends_gamerhub_user_id_fkey(
          id,
          username,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("is_matched", { ascending: false })
      .order("discord_friend_username", { ascending: true });

    if (matchedOnly) {
      query = query.eq("is_matched", true);
    }

    const { data: friends, error } = await query;

    if (error) {
      console.error("Get Discord friends error:", error);
      return NextResponse.json(
        { error: "Failed to get Discord friends" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      friends,
      total: friends?.length || 0,
      matched_count: friends?.filter((f) => f.is_matched).length || 0,
    });
  } catch (error) {
    console.error("Get Discord friends error:", error);
    return NextResponse.json(
      { error: "Failed to get Discord friends" },
      { status: 500 }
    );
  }
}

// POST - Import/refresh Discord friends
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Discord settings
    const { data: settings } = await supabase
      .from("discord_settings")
      .select("discord_user_id, access_token, token_expires_at, import_friends_enabled")
      .eq("user_id", user.id)
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: "Discord not connected" },
        { status: 400 }
      );
    }

    if (!settings.import_friends_enabled) {
      return NextResponse.json(
        { error: "Friend import not enabled" },
        { status: 400 }
      );
    }

    // Note: Discord's API doesn't allow fetching friends list via OAuth
    // This would require a bot to be in a mutual server
    // For now, we'll simulate by checking Discord settings of other users
    // who might be mutual contacts

    // Find other users who have connected Discord and are in the same guilds
    const { data: potentialFriends } = await supabase
      .from("discord_settings")
      .select(`
        discord_user_id,
        discord_username,
        discord_discriminator,
        discord_avatar_hash,
        user_id,
        guilds
      `)
      .neq("user_id", user.id);

    if (!potentialFriends) {
      const response: ImportFriendsResponse = {
        imported_count: 0,
        matched_count: 0,
        friends: [],
      };
      return NextResponse.json(response);
    }

    // Get user's current guilds
    const userGuilds = new Set(
      (settings as { guilds?: { id: string }[] }).guilds?.map((g: { id: string }) => g.id) || []
    );

    // Find users in mutual guilds
    const mutualGuildUsers = potentialFriends.filter((friend) => {
      const friendGuilds = (friend.guilds as { id: string }[] || []).map((g) => g.id);
      return friendGuilds.some((guildId: string) => userGuilds.has(guildId));
    });

    // Import/update friends
    let importedCount = 0;
    let matchedCount = 0;
    const importedFriends = [];

    for (const friend of mutualGuildUsers) {
      const { data: existing } = await supabase
        .from("discord_friends")
        .select("id")
        .eq("user_id", user.id)
        .eq("discord_friend_id", friend.discord_user_id)
        .single();

      if (!existing) {
        const { data: inserted, error: insertError } = await supabase
          .from("discord_friends")
          .insert({
            user_id: user.id,
            discord_friend_id: friend.discord_user_id,
            discord_friend_username: friend.discord_username,
            discord_friend_discriminator: friend.discord_discriminator,
            discord_friend_avatar: friend.discord_avatar_hash,
            gamerhub_user_id: friend.user_id,
            is_matched: true,
          })
          .select(`
            *,
            gamerhub_user:profiles!discord_friends_gamerhub_user_id_fkey(
              id,
              username,
              avatar_url
            )
          `)
          .single();

        if (!insertError && inserted) {
          importedCount++;
          matchedCount++;
          importedFriends.push(inserted);
        }
      } else {
        // Update existing
        const { data: updated } = await supabase
          .from("discord_friends")
          .update({
            discord_friend_username: friend.discord_username,
            discord_friend_avatar: friend.discord_avatar_hash,
            gamerhub_user_id: friend.user_id,
            is_matched: true,
          })
          .eq("id", existing.id)
          .select(`
            *,
            gamerhub_user:profiles!discord_friends_gamerhub_user_id_fkey(
              id,
              username,
              avatar_url
            )
          `)
          .single();

        if (updated) {
          importedFriends.push(updated);
          matchedCount++;
        }
      }
    }

    const response: ImportFriendsResponse = {
      imported_count: importedCount,
      matched_count: matchedCount,
      friends: importedFriends,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Import Discord friends error:", error);
    return NextResponse.json(
      { error: "Failed to import Discord friends" },
      { status: 500 }
    );
  }
}

// POST - Send invite to Discord friend
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friend_id } = await request.json();

    if (!friend_id) {
      return NextResponse.json(
        { error: "Friend ID required" },
        { status: 400 }
      );
    }

    // Get the friend record
    const { data: friend, error: friendError } = await supabase
      .from("discord_friends")
      .select("*")
      .eq("id", friend_id)
      .eq("user_id", user.id)
      .single();

    if (friendError || !friend) {
      return NextResponse.json(
        { error: "Friend not found" },
        { status: 404 }
      );
    }

    if (friend.is_matched) {
      return NextResponse.json(
        { error: "Friend already on GamerHub" },
        { status: 400 }
      );
    }

    // Mark invite as sent
    const { error: updateError } = await supabase
      .from("discord_friends")
      .update({
        invite_sent: true,
        invite_sent_at: new Date().toISOString(),
      })
      .eq("id", friend_id);

    if (updateError) {
      console.error("Update invite error:", updateError);
      return NextResponse.json(
        { error: "Failed to send invite" },
        { status: 500 }
      );
    }

    // Note: Actually sending the invite would require Discord bot integration
    // For now, we just mark it as sent

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}

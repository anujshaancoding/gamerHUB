import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get overlay by public token (for OBS/streaming software)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Get overlay by token
    const { data: overlay, error } = await supabase
      .from("streamer_overlays")
      .select(`
        *,
        creator_profiles!inner(
          user_id,
          display_name,
          users!inner(username, avatar_url)
        )
      `)
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (error || !overlay) {
      return NextResponse.json(
        { error: "Overlay not found or inactive" },
        { status: 404 }
      );
    }

    // Get additional data based on overlay type
    let overlayData: Record<string, unknown> = {
      id: overlay.id,
      type: overlay.type,
      config: overlay.config,
      creator: {
        display_name: overlay.creator_profiles.display_name,
        username: overlay.creator_profiles.users.username,
        avatar_url: overlay.creator_profiles.users.avatar_url,
      },
    };

    const userId = overlay.creator_profiles.user_id;

    // Fetch type-specific data
    switch (overlay.type) {
      case "lfg_status": {
        // Get current LFG status
        const { data: lfgPost } = await supabase
          .from("lfg_posts")
          .select(`
            *,
            games(name, slug, icon_url)
          `)
          .eq("user_id", userId)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        overlayData.lfg = lfgPost || null;

        // Get user's current game stats if available
        if (lfgPost?.game_id) {
          const { data: stats } = await supabase
            .from("game_stats")
            .select("*")
            .eq("user_id", userId)
            .eq("game_id", lfgPost.game_id)
            .single();

          overlayData.stats = stats || null;
        }
        break;
      }

      case "stats": {
        // Get game stats for configured games
        const gamesConfig = overlay.config?.statsConfig?.games || [];
        if (gamesConfig.length > 0) {
          const { data: stats } = await supabase
            .from("game_stats")
            .select(`
              *,
              games(name, slug, icon_url)
            `)
            .eq("user_id", userId)
            .in("game_id", gamesConfig);

          overlayData.stats = stats || [];
        }
        break;
      }

      case "social": {
        // Get creator's social links
        const { data: profile } = await supabase
          .from("creator_profiles")
          .select("social_links, streaming_platforms")
          .eq("user_id", userId)
          .single();

        overlayData.social = profile?.social_links || {};
        overlayData.streaming_platforms = profile?.streaming_platforms || [];
        break;
      }

      case "schedule": {
        // Get user's scheduled sessions
        const { data: schedule } = await supabase
          .from("lfg_posts")
          .select(`
            id,
            title,
            scheduled_for,
            games(name, icon_url)
          `)
          .eq("user_id", userId)
          .eq("status", "open")
          .not("scheduled_for", "is", null)
          .gte("scheduled_for", new Date().toISOString())
          .order("scheduled_for", { ascending: true })
          .limit(overlay.config?.scheduleConfig?.showDays || 7);

        overlayData.schedule = schedule || [];
        break;
      }

      case "alerts": {
        // Get recent activity for alerts
        const alertTypes = overlay.config?.alertConfig?.types || [];
        const activities: unknown[] = [];

        if (alertTypes.includes("follower")) {
          const { data: recentFollows } = await supabase
            .from("follows")
            .select(`
              created_at,
              follower:users!follows_follower_id_fkey(username, avatar_url)
            `)
            .eq("following_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

          recentFollows?.forEach(f => {
            activities.push({
              type: "follower",
              data: f,
              timestamp: f.created_at,
            });
          });
        }

        if (alertTypes.includes("lfg_join")) {
          const { data: recentJoins } = await supabase
            .from("lfg_responses")
            .select(`
              created_at,
              lfg_posts!inner(user_id),
              users(username, avatar_url)
            `)
            .eq("lfg_posts.user_id", userId)
            .eq("status", "accepted")
            .order("created_at", { ascending: false })
            .limit(5);

          recentJoins?.forEach(j => {
            activities.push({
              type: "lfg_join",
              data: j,
              timestamp: j.created_at,
            });
          });
        }

        // Sort by timestamp
        activities.sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        overlayData.alerts = activities.slice(0, 10);
        break;
      }
    }

    // Track view for analytics (don't await)
    supabase.rpc("increment_overlay_views", {
      overlay_id: overlay.id
    }).then(() => {}).catch(() => {});

    // Set CORS headers for OBS browser source
    const response = NextResponse.json({ overlay: overlayData });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return response;
  } catch (error) {
    console.error("Get overlay by token error:", error);
    return NextResponse.json(
      { error: "Failed to get overlay" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateEventRequest } from "@/types/community";
import { getUser } from "@/lib/auth/get-user";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

// GET - List events
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const eventType = searchParams.get("type");
    const organizerId = searchParams.get("organizer_id");
    const upcoming = searchParams.get("upcoming") !== "false";
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("community_events")
      .select(`
        *,
        organizer:profiles!community_events_organizer_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `, { count: "exact" })
      .eq("status", "published");

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (organizerId) {
      query = query.eq("organizer_id", organizerId);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (upcoming) {
      query = query.gte("starts_at", new Date().toISOString());
    }

    query = query
      .order("starts_at", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Fetch events error:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Get user RSVPs if logged in
    let userRsvps: Record<string, string> = {};

    if (user && events && events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const { data: rsvps } = await db
        .from("event_rsvps")
        .select("event_id, status")
        .eq("user_id", user.id)
        .in("event_id", eventIds);

      if (rsvps) {
        rsvps.forEach((r) => {
          userRsvps[r.event_id] = r.status;
        });
      }
    }

    const processedEvents = events?.map((event) => ({
      ...event,
      user_rsvp: userRsvps[event.id] || null,
    }));

    return NextResponse.json({
      events: processedEvents,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateEventRequest = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.starts_at) {
      return NextResponse.json(
        { error: "Start time is required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(body.title);
    let attempts = 0;

    while (attempts < 5) {
      const { data: existingSlug } = await db
        .from("community_events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingSlug) break;

      slug = `${generateSlug(body.title)}-${Date.now().toString(36)}`;
      attempts++;
    }

    const { data: event, error } = await db
      .from("community_events")
      .insert({
        organizer_id: user.id,
        game_id: body.game_id || null,
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        cover_image_url: body.cover_image_url || null,
        event_type: body.event_type || "other",
        location_type: body.location_type || "online",
        location_details: body.location_details || null,
        external_link: body.external_link || null,
        starts_at: body.starts_at,
        ends_at: body.ends_at || null,
        timezone: body.timezone || "UTC",
        max_attendees: body.max_attendees || null,
        status: "published",
        rsvp_count: 0,
      })
      .select(`
        *,
        organizer:profiles!community_events_organizer_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `)
      .single();

    if (error) {
      console.error("Create event error:", error);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

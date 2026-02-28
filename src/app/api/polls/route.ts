import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreatePollRequest } from "@/types/community";
import { getUser } from "@/lib/auth/get-user";

// GET - List polls
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const pollType = searchParams.get("type");
    const creatorId = searchParams.get("creator_id");
    const activeOnly = searchParams.get("active") !== "false";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("community_polls")
      .select(`
        *,
        creator:profiles!community_polls_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name),
        options:poll_options(id, option_text, option_order, vote_count, image_url)
      `, { count: "exact" });

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (pollType) {
      query = query.eq("poll_type", pollType);
    }

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: polls, error, count } = await query;

    if (error) {
      console.error("Fetch polls error:", error);
      return NextResponse.json(
        { error: "Failed to fetch polls" },
        { status: 500 }
      );
    }

    // Get user's votes if logged in
    let userVotes: Record<string, string[]> = {};

    if (user && polls && polls.length > 0) {
      const pollIds = polls.map((p) => p.id);
      const { data: votes } = await db
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user.id)
        .in("poll_id", pollIds);

      if (votes) {
        votes.forEach((v) => {
          if (!userVotes[v.poll_id]) {
            userVotes[v.poll_id] = [];
          }
          userVotes[v.poll_id].push(v.option_id);
        });
      }
    }

    // Sort options and add user votes
    const processedPolls = polls?.map((poll) => ({
      ...poll,
      options: poll.options?.sort(
        (a: { option_order: number }, b: { option_order: number }) =>
          a.option_order - b.option_order
      ),
      user_votes: userVotes[poll.id] || [],
    }));

    return NextResponse.json({
      polls: processedPolls,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch polls error:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}

// POST - Create a new poll
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreatePollRequest = await request.json();

    if (!body.question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: "At least 2 options are required" },
        { status: 400 }
      );
    }

    if (body.options.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 options allowed" },
        { status: 400 }
      );
    }

    // Create the poll
    const { data: poll, error: pollError } = await db
      .from("community_polls")
      .insert({
        creator_id: user.id,
        game_id: body.game_id || null,
        question: body.question.trim(),
        description: body.description?.trim() || null,
        poll_type: body.poll_type || "general",
        allow_multiple: body.allow_multiple ?? false,
        is_anonymous: body.is_anonymous ?? false,
        ends_at: body.ends_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (pollError) {
      console.error("Create poll error:", pollError);
      return NextResponse.json(
        { error: "Failed to create poll" },
        { status: 500 }
      );
    }

    // Create options
    const optionsToInsert = body.options.map((option, index) => ({
      poll_id: poll.id,
      option_text: option.text.trim(),
      option_order: index,
      image_url: option.image_url || null,
      vote_count: 0,
    }));

    const { error: optionsError } = await db
      .from("poll_options")
      .insert(optionsToInsert);

    if (optionsError) {
      console.error("Create options error:", optionsError);
      await db.from("community_polls").delete().eq("id", poll.id);
      return NextResponse.json(
        { error: "Failed to create poll options" },
        { status: 500 }
      );
    }

    // Fetch complete poll
    const { data: fullPoll } = await db
      .from("community_polls")
      .select(`
        *,
        creator:profiles!community_polls_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name),
        options:poll_options(id, option_text, option_order, vote_count, image_url)
      `)
      .eq("id", poll.id)
      .single();

    return NextResponse.json({
      success: true,
      poll: fullPoll,
    });
  } catch (error) {
    console.error("Create poll error:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
}

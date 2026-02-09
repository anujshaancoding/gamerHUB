import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { option_ids }: { option_ids: string[] } = await request.json();

    if (!option_ids || option_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one option is required" },
        { status: 400 }
      );
    }

    // Get the poll
    const { data: poll, error: pollError } = await supabase
      .from("community_polls")
      .select(`
        *,
        options:poll_options(id, option_text, vote_count)
      `)
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Check if poll is active
    if (!poll.is_active) {
      return NextResponse.json(
        { error: "This poll is no longer active" },
        { status: 400 }
      );
    }

    // Check if poll has ended
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return NextResponse.json(
        { error: "This poll has ended" },
        { status: 400 }
      );
    }

    // Check if multiple votes are allowed
    if (!poll.allow_multiple && option_ids.length > 1) {
      return NextResponse.json(
        { error: "Only one vote is allowed for this poll" },
        { status: 400 }
      );
    }

    // Validate option IDs
    const validOptionIds = poll.options.map((o: { id: string }) => o.id);
    const invalidOptions = option_ids.filter(
      (id) => !validOptionIds.includes(id)
    );

    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: "Invalid option(s) selected" },
        { status: 400 }
      );
    }

    // Check existing votes
    const { data: existingVotes } = await supabase
      .from("poll_votes")
      .select("id, option_id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id);

    const existingOptionIds = existingVotes?.map((v) => v.option_id) || [];

    // Determine votes to add and remove
    const votesToAdd = option_ids.filter(
      (id) => !existingOptionIds.includes(id)
    );
    const votesToRemove = existingOptionIds.filter(
      (id) => !option_ids.includes(id)
    );

    // Remove old votes
    if (votesToRemove.length > 0) {
      await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .in("option_id", votesToRemove);

      // Decrement vote counts
      for (const optionId of votesToRemove) {
        const option = poll.options.find(
          (o: { id: string }) => o.id === optionId
        );
        if (option) {
          await supabase
            .from("poll_options")
            .update({ vote_count: Math.max(0, option.vote_count - 1) })
            .eq("id", optionId);
        }
      }
    }

    // Add new votes
    if (votesToAdd.length > 0) {
      const newVotes = votesToAdd.map((optionId) => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      }));

      await supabase.from("poll_votes").insert(newVotes);

      // Increment vote counts
      for (const optionId of votesToAdd) {
        const option = poll.options.find(
          (o: { id: string }) => o.id === optionId
        );
        if (option) {
          await supabase
            .from("poll_options")
            .update({ vote_count: option.vote_count + 1 })
            .eq("id", optionId);
        }
      }
    }

    // Update total votes
    const voteChange = votesToAdd.length - votesToRemove.length;
    if (voteChange !== 0) {
      await supabase
        .from("community_polls")
        .update({ total_votes: poll.total_votes + voteChange })
        .eq("id", pollId);
    }

    // Fetch updated poll
    const { data: updatedPoll } = await supabase
      .from("community_polls")
      .select(`
        *,
        creator:profiles!community_polls_creator_id_fkey(id, username, avatar_url),
        options:poll_options(id, option_text, option_order, vote_count, image_url)
      `)
      .eq("id", pollId)
      .single();

    return NextResponse.json({
      success: true,
      poll: {
        ...updatedPoll,
        options: updatedPoll.options?.sort(
          (a: { option_order: number }, b: { option_order: number }) =>
            a.option_order - b.option_order
        ),
        user_votes: option_ids,
      },
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

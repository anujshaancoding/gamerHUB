import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubmitReviewRequest } from "@/types/coaching";

// GET - Get reviews for a coach
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sort") || "recent"; // "recent", "helpful", "rating_high", "rating_low"

    let query = supabase
      .from("coach_reviews")
      .select(`
        *,
        student:users!student_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("coach_id", id);

    // Apply sorting
    switch (sortBy) {
      case "helpful":
        query = query.order("helpful_count", { ascending: false });
        break;
      case "rating_high":
        query = query.order("rating", { ascending: false });
        break;
      case "rating_low":
        query = query.order("rating", { ascending: true });
        break;
      default: // recent
        query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get rating distribution
    const { data: ratingDist } = await supabase
      .from("coach_reviews")
      .select("rating")
      .eq("coach_id", id);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (ratingDist || []).forEach((r: { rating: number }) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      distribution,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 }
    );
  }
}

// POST - Submit a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coachId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SubmitReviewRequest = await request.json();

    // Validate rating
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate content
    if (!body.title || body.title.length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (!body.content || body.content.length < 20) {
      return NextResponse.json(
        { error: "Review must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Check if coach exists
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", coachId)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }

    // Cannot review yourself
    if (coach.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot review yourself" },
        { status: 400 }
      );
    }

    // Check if user already reviewed this coach
    const { data: existingReview } = await supabase
      .from("coach_reviews")
      .select("id")
      .eq("coach_id", coachId)
      .eq("student_id", user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this coach" },
        { status: 400 }
      );
    }

    // Check if review is linked to a verified session
    let verifiedSession = false;
    if (body.session_id) {
      const { data: session } = await supabase
        .from("coaching_sessions")
        .select("id")
        .eq("id", body.session_id)
        .eq("coach_id", coachId)
        .eq("student_id", user.id)
        .eq("status", "completed")
        .single();

      verifiedSession = !!session;
    }

    // Create review
    const { data: review, error } = await supabase
      .from("coach_reviews")
      .insert({
        coach_id: coachId,
        student_id: user.id,
        session_id: body.session_id || null,
        rating: body.rating,
        title: body.title,
        content: body.content,
        pros: body.pros || [],
        cons: body.cons || [],
        would_recommend: body.would_recommend !== false,
        verified_session: verifiedSession,
        helpful_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Submit review error:", error);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    // Update coach average rating
    const { data: allReviews } = await supabase
      .from("coach_reviews")
      .select("rating")
      .eq("coach_id", coachId);

    if (allReviews && allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await supabase
        .from("coach_profiles")
        .update({
          average_rating: Math.round(avgRating * 10) / 10,
          rating_count: allReviews.length,
        })
        .eq("id", coachId);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

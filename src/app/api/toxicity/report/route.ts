import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
import { getUser } from "@/lib/auth/get-user";
  type ReportPlayerRequest,
  REPORT_SEVERITY,
  calculateNewScore,
  getBehaviorRating,
} from "@/types/verified-queue";

// POST /api/toxicity/report - Report a player for toxic behavior
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReportPlayerRequest = await request.json();
    const { user_id, game_id, session_id, reason, description, evidence_urls } = body;

    if (!user_id || !game_id || !reason) {
      return NextResponse.json(
        { error: "user_id, game_id, and reason are required" },
        { status: 400 }
      );
    }

    if (user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot report yourself" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!REPORT_SEVERITY[reason]) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    // Check for recent duplicate reports
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingReport } = await db
      .from("player_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", user_id)
      .gte("created_at", oneHourAgo)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: "You recently reported this player. Please wait before reporting again." },
        { status: 429 }
      );
    }

    // Create the report
    const { data: report, error: reportError } = await db
      .from("player_reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: user_id,
        game_id,
        session_id,
        reason,
        description,
        evidence_urls,
        status: "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Failed to create report:", reportError);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 }
      );
    }

    // Update reported user's verified profile (if they have one)
    const { data: reportedProfile } = await db
      .from("verified_profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (reportedProfile) {
      const reportInfo = REPORT_SEVERITY[reason];
      const totalInteractions =
        reportedProfile.positive_endorsements + reportedProfile.negative_reports;

      // Calculate new score (reports have smaller immediate impact, reviewed later)
      const immediateImpact = Math.round(reportInfo.points * 0.3); // 30% immediate impact
      const newScore = calculateNewScore(
        reportedProfile.behavior_score,
        immediateImpact,
        totalInteractions
      );
      const newRating = getBehaviorRating(newScore);

      await db
        .from("verified_profiles")
        .update({
          behavior_score: newScore,
          behavior_rating: newRating,
          negative_reports: reportedProfile.negative_reports + 1,
          last_behavior_update: new Date().toISOString(),
        })
        .eq("user_id", user_id);
    }

    // Track reporter's report history (for detecting false reporters)
    await db.from("report_history").insert({
      reporter_id: user.id,
      report_id: report.id,
      reason,
      severity: REPORT_SEVERITY[reason].severity,
    });

    return NextResponse.json({
      report,
      message: "Report submitted successfully. Thank you for helping keep our community safe.",
    });
  } catch (error) {
    console.error("Report player error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/toxicity/report - Get user's reports (submitted and received)
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "submitted"; // submitted or received

    if (type === "received") {
      // Get reports received (limited info for privacy)
      const { data: reports, error } = await db
        .from("player_reports")
        .select("id, reason, status, created_at, action_taken")
        .eq("reported_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json(
          { error: "Failed to get reports" },
          { status: 500 }
        );
      }

      // Aggregate stats
      const stats = {
        total: reports?.length || 0,
        pending: reports?.filter((r) => r.status === "pending").length || 0,
        actioned: reports?.filter((r) => r.status === "actioned").length || 0,
        dismissed: reports?.filter((r) => r.status === "dismissed").length || 0,
      };

      return NextResponse.json({ reports, stats });
    }

    // Get reports submitted by user
    const { data: reports, error } = await db
      .from("player_reports")
      .select(
        `
        id,
        reason,
        description,
        status,
        action_taken,
        created_at,
        reported_user:profiles!player_reports_reported_user_id_fkey(
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: "Failed to get reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

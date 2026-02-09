import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportType } from "@/types/verification";

// GET /api/reports - Get user's submitted reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("user_reports")
      .select(
        `
        *,
        reported_user:profiles!user_reports_reported_user_id_fkey(id, username, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: reports, error, count } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      reported_user_id,
      report_type,
      report_category,
      description,
      evidence_urls,
      context_type,
      context_id,
    } = body;

    // Validation
    if (!reported_user_id) {
      return NextResponse.json(
        { error: "Reported user ID is required" },
        { status: 400 }
      );
    }

    if (!report_type) {
      return NextResponse.json(
        { error: "Report type is required" },
        { status: 400 }
      );
    }

    const validReportTypes: ReportType[] = [
      "bot",
      "fake_account",
      "harassment",
      "spam",
      "toxic",
      "cheating",
      "impersonation",
      "other",
    ];

    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    // Can't report yourself
    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      );
    }

    // Check if reported user exists
    const { data: reportedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", reported_user_id)
      .single();

    if (!reportedUser) {
      return NextResponse.json(
        { error: "Reported user not found" },
        { status: 404 }
      );
    }

    // Check for duplicate reports (same reporter, same user, same type within 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingReport } = await supabase
      .from("user_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", reported_user_id)
      .eq("report_type", report_type)
      .gte("created_at", oneDayAgo)
      .single();

    if (existingReport) {
      return NextResponse.json(
        {
          error:
            "You have already submitted a similar report for this user recently",
        },
        { status: 400 }
      );
    }

    // Determine priority based on report type
    let priority = "normal";
    if (["cheating", "harassment"].includes(report_type)) {
      priority = "high";
    }
    if (report_type === "impersonation") {
      priority = "critical";
    }

    // Create the report
    const { data: report, error: createError } = await supabase
      .from("user_reports")
      .insert({
        reporter_id: user.id,
        reported_user_id,
        report_type,
        report_category,
        description,
        evidence_urls: evidence_urls || [],
        context_type,
        context_id,
        priority,
        status: "pending",
      })
      .select(
        `
        *,
        reported_user:profiles!user_reports_reported_user_id_fkey(id, username, avatar_url)
      `
      )
      .single();

    if (createError) {
      console.error("Error creating report:", createError);
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      );
    }

    // Record behavioral signal for the reported user
    await supabase.from("behavioral_signals").insert({
      user_id: reported_user_id,
      signal_type: "user_report_received",
      signal_data: {
        report_type,
        reporter_id: user.id,
        report_id: report.id,
      },
      risk_score: report_type === "bot" ? 30 : 10,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted successfully",
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

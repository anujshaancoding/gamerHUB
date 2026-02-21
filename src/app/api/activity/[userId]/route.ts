import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const days = Math.min(parseInt(searchParams.get("days") || "365"), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data: activityDays, error } = await supabase
      .from("user_activity_days" as never)
      .select("*")
      .eq("user_id" as never, userId)
      .gte("activity_date" as never, startDateStr)
      .order("activity_date" as never, { ascending: true });

    if (error) {
      console.error("Activity fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity data" },
        { status: 500 }
      );
    }

    const records = (activityDays || []) as Array<{
      activity_date: string;
      minutes_online: number;
      first_seen_at: string;
      last_seen_at: string;
    }>;

    const totalMinutes = records.reduce((sum, d) => sum + d.minutes_online, 0);
    const totalHoursOnline = Math.round((totalMinutes / 60) * 10) / 10;
    const activeDaysCount = records.filter((d) => d.minutes_online > 0).length;
    const averageDailyMinutes =
      activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;

    // Build set of active dates for streak calculations
    const activeDates = new Set(
      records.filter((d) => d.minutes_online > 0).map((d) => d.activity_date)
    );

    // Current streak: walk backwards from today
    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (activeDates.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Longest streak: walk forward through all dates
    let longestStreak = 0;
    let streak = 0;
    if (records.length > 0) {
      const first = new Date(records[0].activity_date);
      const last = new Date(records[records.length - 1].activity_date);
      const cursor = new Date(first);
      while (cursor <= last) {
        if (activeDates.has(cursor.toISOString().split("T")[0])) {
          streak++;
          longestStreak = Math.max(longestStreak, streak);
        } else {
          streak = 0;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return NextResponse.json({
      days: records,
      totalHoursOnline,
      averageDailyMinutes,
      longestStreak,
      currentStreak,
      activeDaysCount,
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/db/site-settings";

// GET - Public endpoint for site feature flags (cached 30s)
export async function GET() {
  try {
    const settings = await getSiteSettings();

    // Only expose specific flags the frontend needs
    return NextResponse.json(
      {
        hide_news: settings.hide_news,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Public settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

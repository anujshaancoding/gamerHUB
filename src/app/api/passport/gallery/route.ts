import { NextRequest, NextResponse } from "next/server";
import { getPassportGallery } from "@/lib/features/passport-gallery";

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 24);
    const passports = await getPassportGallery(Number.isFinite(limitParam) ? limitParam : 24);
    return NextResponse.json({ passports });
  } catch (error) {
    console.error("Passport gallery error:", error);
    return NextResponse.json({ passports: [], unavailable: true });
  }
}

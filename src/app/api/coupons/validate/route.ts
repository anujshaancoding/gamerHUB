import { NextRequest, NextResponse } from "next/server";

// Coupon definitions
// In production, these would be stored in a database table
const COUPONS: Record<
  string,
  {
    code: string;
    discount_percent: number;
    discount_label: string;
    max_uses: number | null; // null = unlimited
    uses: number;
    expires_at: string | null; // null = never expires
    is_active: boolean;
  }
> = {
  GAMERHUB100: {
    code: "GAMERHUB100",
    discount_percent: 100,
    discount_label: "100% off",
    max_uses: null,
    uses: 0,
    expires_at: null,
    is_active: true,
  },
  GAMER50: {
    code: "GAMER50",
    discount_percent: 50,
    discount_label: "50% off",
    max_uses: 100,
    uses: 0,
    expires_at: null,
    is_active: true,
  },
  WELCOME25: {
    code: "WELCOME25",
    discount_percent: 25,
    discount_label: "25% off",
    max_uses: null,
    uses: 0,
    expires_at: null,
    is_active: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const coupon = COUPONS[code.toUpperCase()];

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    if (!coupon.is_active) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_label: coupon.discount_label,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

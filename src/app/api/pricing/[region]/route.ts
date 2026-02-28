import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { REGIONS, REGIONAL_PRICING, type Region, formatPrice } from "@/types/localization";

// Base prices in INR
const BASE_PRICES = {
  premium_monthly: 99,
  premium_yearly: 999,
  creator_boost: 49,
  tournament_entry: 29,
  clan_premium: 149,
};

// GET - Get regional pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string }> }
) {
  try {
    const { region: regionCode } = await params;

    // Validate region
    if (!REGIONS[regionCode as Region]) {
      return NextResponse.json(
        { error: "Invalid region code" },
        { status: 400 }
      );
    }

    const region = regionCode as Region;
    const pricing = REGIONAL_PRICING[region];
    const regionInfo = REGIONS[region];

    // Calculate regional prices
    const prices = Object.entries(BASE_PRICES).map(([product, basePrice]) => {
      const regionalPrice = basePrice * pricing.multiplier;

      // Convert to local currency if needed
      let localAmount = regionalPrice;
      let exchangeRate = 1;

      switch (pricing.currency) {
        case "BRL":
          exchangeRate = 5;
          localAmount = regionalPrice * exchangeRate;
          break;
        case "INR":
          exchangeRate = 83;
          localAmount = regionalPrice * exchangeRate;
          break;
        case "RUB":
          exchangeRate = 90;
          localAmount = regionalPrice * exchangeRate;
          break;
        case "AUD":
          exchangeRate = 1.5;
          localAmount = regionalPrice * exchangeRate;
          break;
        case "EUR":
          exchangeRate = 0.92;
          localAmount = regionalPrice * exchangeRate;
          break;
      }

      return {
        product,
        basePrice: {
          amount: basePrice,
          currency: "INR",
          formatted: `₹${basePrice.toFixed(2)}`,
        },
        regionalPrice: {
          amount: Math.round(localAmount * 100) / 100,
          currency: pricing.currency,
          formatted: `${pricing.currencySymbol}${localAmount.toFixed(2)}`,
        },
        discount: Math.round((1 - pricing.multiplier) * 100),
        exchangeRate,
      };
    });

    return NextResponse.json({
      region: {
        code: region,
        name: regionInfo.name,
        currency: pricing.currency,
        currencySymbol: pricing.currencySymbol,
        discount: Math.round((1 - pricing.multiplier) * 100),
      },
      prices,
    });
  } catch (error) {
    console.error("Get regional pricing error:", error);
    return NextResponse.json(
      { error: "Failed to get pricing" },
      { status: 500 }
    );
  }
}

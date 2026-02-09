import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    const { data: endorsements, error } = await supabase
      .from("trait_endorsements")
      .select("friendly, team_player, leader, communicative, reliable")
      .eq("endorsed_id", userId);

    if (error) throw error;

    const total = endorsements?.length || 0;

    if (total === 0) {
      return NextResponse.json({
        traits: {
          friendly: 0,
          teamPlayer: 0,
          leader: 0,
          communicative: 0,
          reliable: 0,
          totalEndorsers: 0,
        },
      });
    }

    // Count how many endorsers endorsed each trait
    const friendly = endorsements.filter((e) => e.friendly).length;
    const teamPlayer = endorsements.filter((e) => e.team_player).length;
    const leader = endorsements.filter((e) => e.leader).length;
    const communicative = endorsements.filter((e) => e.communicative).length;
    const reliable = endorsements.filter((e) => e.reliable).length;

    return NextResponse.json({
      traits: {
        friendly,
        teamPlayer,
        leader,
        communicative,
        reliable,
        totalEndorsers: total,
      },
    });
  } catch (error) {
    console.error("Fetch trait endorsements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

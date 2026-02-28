import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      endorsedId,
      endorsementType = "positive",
      // Positive traits
      friendly,
      teamPlayer,
      leader,
      communicative,
      reliable,
      // Negative traits (premium+ only)
      toxic,
      quitter,
      uncooperative,
      uncommunicative,
      unreliable,
      gameId,
      playedAs,
      positiveNote,
    } = body;

    if (!endorsedId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    if (endorsedId === user.id) {
      return NextResponse.json(
        { error: "Cannot endorse yourself" },
        { status: 400 }
      );
    }

    // Negative endorsements require premium+
    if (endorsementType === "negative") {
      const permCtx = await getUserPermissionContext(db);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (!can.giveNegativeEndorsement(tier)) {
        return NextResponse.json(
          { error: "Negative endorsements require Premium membership" },
          { status: 403 }
        );
      }
    }

    // Check if target user is frozen
    const { data: targetTrust } = await db
      .from("account_trust")
      .select("is_frozen")
      .eq("user_id", endorsedId)
      .single();

    if (targetTrust?.is_frozen) {
      return NextResponse.json(
        { error: "This user's endorsements are currently under review" },
        { status: 403 }
      );
    }

    // Check rate limits
    const { data: rateLimitResult } = await db.rpc(
      "check_endorsement_rate_limit",
      { endorser_user_id: user.id }
    );

    const rateLimit = rateLimitResult as unknown as {
      allowed: boolean;
      reason: string | null;
      daily_remaining: number;
      weekly_remaining: number;
    };

    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.reason,
          rateLimited: true,
          dailyRemaining: rateLimit.daily_remaining,
          weeklyRemaining: rateLimit.weekly_remaining,
        },
        { status: 429 }
      );
    }

    // Anti-mob detection: check for patterns
    const mobCheckResults = await detectMobPatterns(
      db,
      user.id,
      endorsedId
    );
    if (mobCheckResults.flagged) {
      // Insert flag record
      await db.from("rating_flags").insert({
        target_user_id: endorsedId,
        flag_type: mobCheckResults.flagType,
        evidence: mobCheckResults.evidence,
        status: "flagged",
      } as never);

      // If severe, freeze the target's endorsement acceptance
      if (mobCheckResults.severity === "high") {
        await db
          .from("account_trust")
          .update({
            is_frozen: true,
            frozen_reason: `Auto-frozen: ${mobCheckResults.flagType} detected`,
          } as never)
          .eq("user_id", endorsedId);
      }
    }

    // Check if user has already endorsed this player (one endorsement per pair)
    const { data: existingEndorsement } = await db
      .from("trait_endorsements")
      .select("id")
      .eq("endorser_id", user.id)
      .eq("endorsed_id", endorsedId)
      .maybeSingle();

    if (existingEndorsement) {
      return NextResponse.json(
        { error: "You have already endorsed this player" },
        { status: 409 }
      );
    }

    // Validate that at least one trait is selected
    if (endorsementType === "negative") {
      const hasNegativeTrait =
        toxic || quitter || uncooperative || uncommunicative || unreliable;
      if (!hasNegativeTrait) {
        return NextResponse.json(
          { error: "At least one negative trait must be selected" },
          { status: 400 }
        );
      }
    } else {
      const hasPositiveTrait =
        friendly || teamPlayer || leader || communicative || reliable;
      if (!hasPositiveTrait) {
        return NextResponse.json(
          { error: "At least one trait must be endorsed" },
          { status: 400 }
        );
      }
    }

    // Build upsert data
    const endorsementData: Record<string, unknown> = {
      endorser_id: user.id,
      endorsed_id: endorsedId,
      endorsement_type: endorsementType,
      friendly: endorsementType === "positive" ? !!friendly : false,
      team_player: endorsementType === "positive" ? !!teamPlayer : false,
      leader: endorsementType === "positive" ? !!leader : false,
      communicative: endorsementType === "positive" ? !!communicative : false,
      reliable: endorsementType === "positive" ? !!reliable : false,
      toxic: endorsementType === "negative" ? !!toxic : false,
      quitter: endorsementType === "negative" ? !!quitter : false,
      uncooperative: endorsementType === "negative" ? !!uncooperative : false,
      uncommunicative: endorsementType === "negative" ? !!uncommunicative : false,
      unreliable: endorsementType === "negative" ? !!unreliable : false,
      game_id: gameId || null,
      played_as: playedAs || null,
      positive_note: endorsementType === "positive" ? (positiveNote || null) : null,
      updated_at: new Date().toISOString(),
    };

    // Insert endorsement (one per endorser-endorsed pair, no updates allowed)
    const { data, error } = await db
      .from("trait_endorsements")
      .insert(endorsementData as never)
      .select()
      .single();

    if (error) throw error;

    // Update rate limit counter
    await db.from("rating_limits").upsert(
      {
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        daily_count: (rateLimit?.daily_remaining !== undefined
          ? 3 - rateLimit.daily_remaining
          : 0) + 1,
        last_rating_at: new Date().toISOString(),
      } as never,
      { onConflict: "user_id,date" }
    );

    return NextResponse.json(
      {
        endorsement: data,
        dailyRemaining: Math.max(0, (rateLimit?.daily_remaining ?? 3) - 1),
        weeklyRemaining: Math.max(0, (rateLimit?.weekly_remaining ?? 10) - 1),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Endorsement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Anti-mob detection logic
async function detectMobPatterns(
  db: Awaited<ReturnType<typeof createClient>>,
  endorserId: string,
  endorsedId: string
): Promise<{
  flagged: boolean;
  flagType?: string;
  evidence?: Record<string, unknown>;
  severity?: "low" | "medium" | "high";
}> {
  // 1. Same clan mob: 5+ endorsements from same clan to same target in 24h
  try {
    // Get endorser's clan
    const { data: endorserClans } = await db
      .from("clan_members")
      .select("clan_id")
      .eq("user_id", endorserId);

    if (endorserClans && endorserClans.length > 0) {
      const clanIds = endorserClans.map((c) => c.clan_id);

      // Get clan members who endorsed this target in last 24h
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      for (const clanId of clanIds) {
        const { data: clanMembers } = await db
          .from("clan_members")
          .select("user_id")
          .eq("clan_id", clanId);

        if (clanMembers) {
          const memberIds = clanMembers.map((m) => m.user_id);
          const { count } = await db
            .from("trait_endorsements")
            .select("*", { count: "exact", head: true })
            .eq("endorsed_id", endorsedId)
            .in("endorser_id", memberIds)
            .gte("created_at", oneDayAgo);

          if (count && count >= 5) {
            return {
              flagged: true,
              flagType: "clan_mob",
              evidence: {
                clan_id: clanId,
                endorsement_count: count,
                time_window: "24h",
              },
              severity: "high",
            };
          }
        }
      }
    }
  } catch {
    // Clan tables may not exist - skip
  }

  // 2. Time burst: 10+ endorsements for target in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: burstCount } = await db
    .from("trait_endorsements")
    .select("*", { count: "exact", head: true })
    .eq("endorsed_id", endorsedId)
    .gte("created_at", oneHourAgo);

  if (burstCount && burstCount >= 10) {
    return {
      flagged: true,
      flagType: "time_burst",
      evidence: {
        endorsement_count: burstCount,
        time_window: "1h",
      },
      severity: "medium",
    };
  }

  // 3. Sudden spike: compare last 7 days average with today
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: weekCount } = await db
    .from("trait_endorsements")
    .select("*", { count: "exact", head: true })
    .eq("endorsed_id", endorsedId)
    .gte("created_at", sevenDaysAgo);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await db
    .from("trait_endorsements")
    .select("*", { count: "exact", head: true })
    .eq("endorsed_id", endorsedId)
    .gte("created_at", todayStart.toISOString());

  const weeklyAvg = (weekCount || 0) / 7;
  if (weeklyAvg > 0 && (todayCount || 0) > weeklyAvg * 5) {
    return {
      flagged: true,
      flagType: "spike",
      evidence: {
        today_count: todayCount,
        weekly_average: weeklyAvg,
        spike_ratio: (todayCount || 0) / weeklyAvg,
      },
      severity: "medium",
    };
  }

  return { flagged: false };
}

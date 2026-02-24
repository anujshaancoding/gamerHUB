import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ clanId: string; missionId: string }>;
}

// PATCH - Update mission progress or contribute
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, missionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();

    // Handle contribution (any member can contribute)
    if (body.contribute) {
      const amount = Math.max(1, parseInt(body.amount || "1"));

      // Check mission exists and is not completed
      const { data: mission } = await supabase
        .from("clan_weekly_missions")
        .select("*")
        .eq("id", missionId)
        .eq("clan_id", clanId)
        .single();

      if (!mission) {
        return NextResponse.json(
          { error: "Mission not found" },
          { status: 404 }
        );
      }

      if ((mission as any).is_completed) {
        return NextResponse.json(
          { error: "Mission already completed" },
          { status: 400 }
        );
      }

      // Record contribution
      await supabase
        .from("clan_mission_contributions")
        .insert({
          mission_id: missionId,
          user_id: user.id,
          amount,
        } as never);

      // Update progress
      const newProgress = Math.min(
        (mission as any).current_progress + amount,
        (mission as any).goal_target
      );
      const isCompleted = newProgress >= (mission as any).goal_target;

      const updates: Record<string, unknown> = {
        current_progress: newProgress,
      };
      if (isCompleted) {
        updates.is_completed = true;
        updates.completed_at = new Date().toISOString();
      }

      const { data: updated, error } = await supabase
        .from("clan_weekly_missions")
        .update(updates as never)
        .eq("id", missionId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update progress" },
          { status: 500 }
        );
      }

      // Award XP to clan if completed
      if (isCompleted) {
        const xpReward = (mission as any).xp_reward || 0;
        if (xpReward > 0) {
          await supabase.rpc("increment_clan_xp" as never, {
            p_clan_id: clanId,
            p_xp: xpReward,
          } as never).catch(() => {
            // RPC may not exist yet, update directly
            supabase
              .from("clans")
              .update({
                clan_xp: ((mission as any).clan_xp || 0) + xpReward,
              } as never)
              .eq("id", clanId);
          });
        }

        // Log activity
        await supabase.from("clan_activity_log").insert({
          clan_id: clanId,
          user_id: user.id,
          activity_type: "mission_completed",
          description: `Mission "${(mission as any).title}" completed! +${xpReward} XP`,
        } as never);
      }

      return NextResponse.json({ mission: updated });
    }

    // Handle admin updates (leaders only)
    if (
      !["leader", "co_leader"].includes((membership as any).role)
    ) {
      return NextResponse.json(
        { error: "Only leaders can update missions" },
        { status: 403 }
      );
    }

    const allowedFields = [
      "title",
      "description",
      "goal_target",
      "xp_reward",
      "current_progress",
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clan_weekly_missions")
      .update(updates as never)
      .eq("id", missionId)
      .eq("clan_id", clanId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update mission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mission: data });
  } catch (error) {
    console.error("Update mission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete mission (leaders only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, missionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    if (
      !membership ||
      !["leader", "co_leader"].includes((membership as any).role)
    ) {
      return NextResponse.json(
        { error: "Only leaders can delete missions" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("clan_weekly_missions")
      .delete()
      .eq("id", missionId)
      .eq("clan_id", clanId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete mission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete mission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

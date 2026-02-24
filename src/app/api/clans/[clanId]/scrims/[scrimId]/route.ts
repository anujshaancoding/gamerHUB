import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ clanId: string; scrimId: string }>;
}

// PATCH - Update scrim (status, room details, result) or RSVP
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, scrimId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Handle RSVP (any member)
    if (body.rsvp !== undefined) {
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

      const rsvpStatus = body.rsvp as string;
      if (!["confirmed", "maybe", "declined"].includes(rsvpStatus)) {
        return NextResponse.json(
          { error: "Invalid RSVP status" },
          { status: 400 }
        );
      }

      // Check slot availability
      if (rsvpStatus === "confirmed") {
        const { data: scrim } = await supabase
          .from("clan_scrims")
          .select("max_slots")
          .eq("id", scrimId)
          .single();

        const { count: confirmedCount } = await supabase
          .from("clan_scrim_participants")
          .select("*", { count: "exact", head: true })
          .eq("scrim_id", scrimId)
          .eq("status", "confirmed")
          .neq("user_id", user.id);

        if (
          scrim &&
          confirmedCount !== null &&
          confirmedCount >= (scrim as any).max_slots
        ) {
          return NextResponse.json(
            { error: "Scrim is full" },
            { status: 400 }
          );
        }
      }

      // Upsert participant
      const { error } = await supabase
        .from("clan_scrim_participants")
        .upsert(
          {
            scrim_id: scrimId,
            user_id: user.id,
            status: rsvpStatus,
          } as never,
          { onConflict: "scrim_id,user_id" }
        );

      if (error) {
        console.error("RSVP error:", error);
        return NextResponse.json(
          { error: "Failed to RSVP" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, status: rsvpStatus });
    }

    // Handle scrim update (creator or leaders only)
    const { data: scrim } = await supabase
      .from("clan_scrims")
      .select("created_by")
      .eq("id", scrimId)
      .eq("clan_id", clanId)
      .single();

    if (!scrim) {
      return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
    }

    const isCreator = (scrim as any).created_by === user.id;
    if (!isCreator) {
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
          { error: "Only scrim creator or leaders can update" },
          { status: 403 }
        );
      }
    }

    const allowedFields = [
      "title",
      "description",
      "scheduled_at",
      "max_slots",
      "room_id",
      "room_password",
      "status",
      "result",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("clan_scrims")
      .update(updates as never)
      .eq("id", scrimId)
      .eq("clan_id", clanId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update scrim" },
        { status: 500 }
      );
    }

    return NextResponse.json({ scrim: updated });
  } catch (error) {
    console.error("Update scrim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete scrim
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, scrimId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scrim } = await supabase
      .from("clan_scrims")
      .select("created_by")
      .eq("id", scrimId)
      .eq("clan_id", clanId)
      .single();

    if (!scrim) {
      return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
    }

    const isCreator = (scrim as any).created_by === user.id;
    if (!isCreator) {
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
          { error: "Only scrim creator or leaders can delete" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("clan_scrims")
      .delete()
      .eq("id", scrimId)
      .eq("clan_id", clanId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete scrim" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete scrim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateContractRequest, CommitmentStatus } from "@/types/commitment";

// GET - List user's commitments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CommitmentStatus | null;
    const includeCompleted = searchParams.get("include_completed") === "true";

    // Get contracts where user is a participant
    const { data: participations } = await supabase
      .from("commitment_participants")
      .select("contract_id")
      .eq("user_id", user.id);

    const contractIds = participations?.map((p) => p.contract_id) || [];

    if (contractIds.length === 0) {
      return NextResponse.json({ contracts: [] });
    }

    let query = supabase
      .from("commitment_contracts")
      .select(`
        *,
        participants:commitment_participants (
          id,
          user_id,
          accepted,
          contribution_count,
          streak,
          users!user_id (
            username,
            avatar_url
          )
        ),
        check_ins:commitment_check_ins (
          id,
          user_id,
          note,
          created_at
        )
      `)
      .in("id", contractIds)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    } else if (!includeCompleted) {
      query = query.in("status", ["pending", "active"]);
    }

    const { data: contracts, error } = await query;

    if (error) {
      throw error;
    }

    // Map participants with user info
    const mappedContracts = (contracts || []).map((contract: any) => ({
      ...contract,
      participants: contract.participants.map((p: any) => ({
        ...p,
        username: p.users?.username,
        avatar_url: p.users?.avatar_url,
      })),
    }));

    return NextResponse.json({ contracts: mappedContracts });
  } catch (error) {
    console.error("List commitments error:", error);
    return NextResponse.json(
      { error: "Failed to list commitments" },
      { status: 500 }
    );
  }
}

// POST - Create a new commitment contract
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateContractRequest = await request.json();

    // Validate
    if (!body.title || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!body.participant_ids || body.participant_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one participant is required" },
        { status: 400 }
      );
    }

    if (body.target_count < 1) {
      return NextResponse.json(
        { error: "Target count must be at least 1" },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from("commitment_contracts")
      .insert({
        title: body.title.trim(),
        description: body.description || null,
        type: body.type,
        status: "pending",
        game_id: body.game_id,
        creator_id: user.id,
        target_count: body.target_count,
        frequency: body.frequency,
        current_count: 0,
        start_date: body.start_date,
        end_date: body.end_date,
        has_stakes: body.has_stakes || false,
        stakes_description: body.stakes_description || null,
        require_photo_proof: body.require_photo_proof || false,
        auto_verify: false,
      })
      .select()
      .single();

    if (contractError) {
      throw contractError;
    }

    // Add creator as participant (auto-accepted)
    const participants = [
      {
        contract_id: contract.id,
        user_id: user.id,
        accepted: true,
        accepted_at: new Date().toISOString(),
        contribution_count: 0,
        streak: 0,
      },
      // Add other participants (pending acceptance)
      ...body.participant_ids
        .filter((id) => id !== user.id)
        .map((userId) => ({
          contract_id: contract.id,
          user_id: userId,
          accepted: false,
          contribution_count: 0,
          streak: 0,
        })),
    ];

    const { error: participantError } = await supabase
      .from("commitment_participants")
      .insert(participants);

    if (participantError) {
      // Rollback contract creation
      await supabase.from("commitment_contracts").delete().eq("id", contract.id);
      throw participantError;
    }

    // TODO: Send notifications to invited participants

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Create commitment error:", error);
    return NextResponse.json(
      { error: "Failed to create commitment" },
      { status: 500 }
    );
  }
}

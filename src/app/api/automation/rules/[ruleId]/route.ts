import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AutomationRule, AutomationLog } from "@/types/database";

interface RouteParams {
  params: Promise<{ ruleId: string }>;
}

// Type for rule with relations
interface RuleWithRelations extends AutomationRule {
  clan?: { id: string; name: string; slug: string };
  created_by_profile?: { username: string; display_name: string | null; avatar_url: string | null };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ruleId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get rule with clan info
    const { data: ruleData, error } = await supabase
      .from("automation_rules")
      .select(`
        *,
        clan:clans(id, name, slug),
        created_by_profile:profiles!automation_rules_created_by_fkey(username, display_name, avatar_url)
      `)
      .eq("id", ruleId)
      .single();

    if (error || !ruleData) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    const rule = ruleData as unknown as RuleWithRelations;

    // Check if user is clan member
    const { data: membershipData } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", rule.clan_id)
      .eq("user_id", user.id)
      .single();

    if (!membershipData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const membership = membershipData as { role: string };

    // Get recent logs
    const { data: logs } = await supabase
      .from("automation_logs")
      .select("*")
      .eq("rule_id", ruleId)
      .order("executed_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      rule,
      logs: logs || [],
      canEdit: ["owner", "admin"].includes(membership.role),
    });
  } catch (error) {
    console.error("Get rule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { ruleId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing rule
    const { data: existingRuleData, error: fetchError } = await supabase
      .from("automation_rules")
      .select("clan_id")
      .eq("id", ruleId)
      .single();

    if (fetchError || !existingRuleData) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    const existingRule = existingRuleData as { clan_id: string };

    // Check if user is clan admin
    const { data: membershipData } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", existingRule.clan_id)
      .eq("user_id", user.id)
      .single();

    const membership = membershipData as { role: string } | null;
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "description",
      "trigger_conditions",
      "action_config",
      "is_enabled",
      "cooldown_minutes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert camelCase to snake_case
        const dbField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates[dbField] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // Update rule - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ruleData, error } = await (supabase as any)
      .from("automation_rules")
      .update(updates)
      .eq("id", ruleId)
      .select(`
        *,
        created_by_profile:profiles!automation_rules_created_by_fkey(username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error updating rule:", error);
      return NextResponse.json(
        { error: "Failed to update rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule: ruleData });
  } catch (error) {
    console.error("Update rule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { ruleId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing rule
    const { data: existingRuleData, error: fetchError } = await supabase
      .from("automation_rules")
      .select("clan_id")
      .eq("id", ruleId)
      .single();

    if (fetchError || !existingRuleData) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    const existingRule = existingRuleData as { clan_id: string };

    // Check if user is clan admin
    const { data: membershipData } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", existingRule.clan_id)
      .eq("user_id", user.id)
      .single();

    const membership = membershipData as { role: string } | null;
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete rule (cascade deletes logs)
    const { error } = await supabase
      .from("automation_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      console.error("Error deleting rule:", error);
      return NextResponse.json(
        { error: "Failed to delete rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

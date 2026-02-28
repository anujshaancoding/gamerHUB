import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = (admin as any)
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, is_admin, admin_role, gaming_style, region, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Admin users list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch account verifications separately to avoid PostgREST join issues
    let usersWithVerifications = data || [];
    if (usersWithVerifications.length > 0) {
      const userIds = usersWithVerifications.map((u: any) => u.id);
      const { data: verifications } = await (admin as any)
        .from("account_verifications")
        .select(
          "user_id, verification_level, trust_score, is_flagged, flag_reason, is_restricted, restriction_reason, restriction_expires_at"
        )
        .in("user_id", userIds);

      const verificationMap = new Map(
        (verifications || []).map((v: any) => [v.user_id, v])
      );

      usersWithVerifications = usersWithVerifications.map((user: any) => ({
        ...user,
        account_verifications: verificationMap.get(user.id) || null,
      }));
    }

    return NextResponse.json({
      users: usersWithVerifications,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id || !action) {
      return NextResponse.json(
        { error: "user_id and action are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "flag": {
        const { reason } = body;
        await (admin as any)
          .from("account_verifications")
          .update({
            is_flagged: true,
            flag_reason: reason || "Flagged by admin",
            flagged_at: new Date().toISOString(),
            flagged_by: user.id,
          })
          .eq("user_id", user_id);
        break;
      }
      case "unflag": {
        await (admin as any)
          .from("account_verifications")
          .update({
            is_flagged: false,
            flag_reason: null,
            flagged_at: null,
            flagged_by: null,
          })
          .eq("user_id", user_id);
        break;
      }
      case "restrict": {
        const { reason, expires_at } = body;
        await (admin as any)
          .from("account_verifications")
          .update({
            is_restricted: true,
            restriction_reason: reason || "Restricted by admin",
            restriction_expires_at: expires_at || null,
          })
          .eq("user_id", user_id);
        break;
      }
      case "unrestrict": {
        await (admin as any)
          .from("account_verifications")
          .update({
            is_restricted: false,
            restriction_reason: null,
            restriction_expires_at: null,
          })
          .eq("user_id", user_id);
        break;
      }
      case "make_admin": {
        if (profile.admin_role !== "super_admin") {
          return NextResponse.json(
            { error: "Only super admins can grant admin access" },
            { status: 403 }
          );
        }
        const { admin_role } = body;
        await (admin as any)
          .from("profiles")
          .update({
            is_admin: true,
            admin_role: admin_role || "moderator",
          })
          .eq("id", user_id);
        break;
      }
      case "remove_admin": {
        if (profile.admin_role !== "super_admin") {
          return NextResponse.json(
            { error: "Only super admins can revoke admin access" },
            { status: 403 }
          );
        }
        if (user_id === user.id) {
          return NextResponse.json(
            { error: "You cannot remove your own admin access" },
            { status: 400 }
          );
        }
        await (admin as any)
          .from("profiles")
          .update({ is_admin: false, admin_role: null })
          .eq("id", user_id);
        break;
      }
      case "delete_user": {
        if (profile.admin_role !== "super_admin") {
          return NextResponse.json(
            { error: "Only super admins can delete users" },
            { status: 403 }
          );
        }
        if (user_id === user.id) {
          return NextResponse.json(
            { error: "You cannot delete your own account" },
            { status: 400 }
          );
        }
        // Delete the user (cascades to profiles via FK)
        const { error: deleteError } = await admin.auth.admin.deleteUser(user_id);
        if (deleteError) {
          console.error("Delete user error:", deleteError);
          return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
          );
        }
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

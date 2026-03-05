import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

async function verifyAdmin() {
  const user = await getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return { user, admin };
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await auth.admin
      .from("news_sources")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
    }

    return NextResponse.json({ sources: data || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
    }

    const { data, error } = await auth.admin
      .from("news_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
    }

    return NextResponse.json({ source: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, url, slug, region } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const { data, error } = await auth.admin
      .from("news_sources")
      .insert({
        name: name.trim(),
        url: url.trim(),
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        region: region || "india",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
    }

    return NextResponse.json({ source: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Source ID is required" }, { status: 400 });
    }

    const { error } = await auth.admin
      .from("news_sources")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

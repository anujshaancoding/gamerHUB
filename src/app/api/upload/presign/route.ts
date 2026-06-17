/**
 * Presigned upload route — issues a short-lived PUT URL so the browser can
 * upload large video clips DIRECTLY to R2, bypassing the serverless function
 * body cap (and ffmpeg, which doesn't exist on serverless).
 *
 *   POST /api/upload/presign  { path, contentType }
 *     -> { uploadUrl, publicUrl, storagePath, headers }
 *
 * Video only. Images are small enough to keep going through /api/upload. On the
 * local driver this returns 409 (use the normal POST path with ffmpeg).
 */

import { NextRequest, NextResponse } from "next/server";
import { extname } from "path";
import { getUser } from "@/lib/auth/get-user";
import { getStorage } from "@/lib/storage";
import {
  presetForPath,
  userOwnsPath,
  VIDEO_EXTENSIONS,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MB,
} from "@/lib/services/upload-policy";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { path?: string; contentType?: string; size?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { path: rawPath, contentType, size } = body;
    if (!rawPath || !contentType) {
      return NextResponse.json({ error: "path and contentType are required" }, { status: 400 });
    }

    // Normalize + guard the path.
    const normalizedPath = rawPath.replace(/\.\./g, "").replace(/^\//, "");
    if (!normalizedPath) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const ext = extname(normalizedPath).toLowerCase();
    const preset = presetForPath(normalizedPath);

    // Presign is for VIDEO only — and only where the surface permits video
    // (the media gallery). Images stay on the normal multipart route.
    if (!VIDEO_EXTENSIONS.has(ext) || !preset.allow.has(ext)) {
      return NextResponse.json(
        { error: "Presigned upload is only for video on the media surface." },
        { status: 400 }
      );
    }

    // Content-Type must match the extension's allowlist.
    if (!ALLOWED_TYPES[ext]?.includes(contentType)) {
      return NextResponse.json({ error: "contentType does not match the file extension." }, { status: 400 });
    }

    // Declared size guard (the real size is enforced by the client + R2; this
    // rejects obviously-too-large requests up front).
    const cap = Math.min(preset.maxBytes, MAX_FILE_SIZE);
    if (typeof size === "number" && size > cap) {
      return NextResponse.json(
        { error: `File too large (max ${Math.round(cap / MB)}MB).` },
        { status: 400 }
      );
    }

    // Ownership: the path must contain the user's id, else admin-only.
    if (!userOwnsPath(user.id, normalizedPath)) {
      const { createAdminClient } = await import("@/lib/db/admin");
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: "You can only upload to your own directory" },
          { status: 403 }
        );
      }
    }

    const storage = getStorage();
    const uploadUrl = await storage.presignUpload(normalizedPath, contentType);
    if (!uploadUrl) {
      // Local driver — no presign; the client should use POST /api/upload.
      return NextResponse.json(
        { error: "Direct upload not available on this storage backend; use /api/upload." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      uploadUrl,
      publicUrl: storage.publicUrl(normalizedPath, { versioned: true }),
      storagePath: normalizedPath,
      // The browser must PUT with exactly this header so R2 stores the right type.
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}

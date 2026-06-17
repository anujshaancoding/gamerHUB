/**
 * Cloudflare R2 storage driver (S3-compatible) via aws4fetch.
 *
 * aws4fetch is a tiny, zero-dependency SigV4 signer that works on Node AND the
 * edge/Workers runtime — so the same driver carries us from Netlify functions
 * to Cloudflare later. Files are PUT to the R2 S3 endpoint and served from the
 * public R2 URL (or a Cloudflare custom domain in front of it).
 *
 * Activated by STORAGE_DRIVER=r2. Requires:
 *   R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL
 */

import { AwsClient } from "aws4fetch";
import { normalizeStoragePath } from "./paths";
import type { StorageDriver } from "./index";

// Types we serve inline; anything else is forced to download (anti-XSS), the
// same allowlist the /uploads route uses.
const INLINE_MIME: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

function extOf(p: string): string {
  return p.split(".").pop()?.toLowerCase() || "";
}

/** Percent-encode each path segment but keep the slashes. */
function encodeKey(relPath: string): string {
  return normalizeStoragePath(relPath).split("/").map(encodeURIComponent).join("/");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required for the R2 storage driver`);
  return v;
}

export class R2StorageDriver implements StorageDriver {
  readonly kind = "r2" as const;

  private client: AwsClient;
  private endpoint: string;
  private bucket: string;
  private publicBase: string;

  constructor() {
    this.endpoint = requireEnv("R2_ENDPOINT").replace(/\/+$/, "");
    this.bucket = requireEnv("R2_BUCKET");
    this.publicBase = requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
    this.client = new AwsClient({
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      region: "auto",
      service: "s3",
    });
  }

  private objectUrl(relPath: string): string {
    return `${this.endpoint}/${this.bucket}/${encodeKey(relPath)}`;
  }

  async writeFile(relPath: string, data: Buffer): Promise<void> {
    const known = INLINE_MIME[extOf(relPath)];
    const headers: Record<string, string> = {
      "Content-Type": known || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    // Non-allowlisted types are never served inline — force download, mirroring
    // the /uploads route's stored-XSS defense at the object level.
    if (!known) headers["Content-Disposition"] = "attachment";

    const res = await this.client.fetch(this.objectUrl(relPath), {
      method: "PUT",
      body: new Uint8Array(data),
      headers,
    });
    if (!res.ok) {
      throw new Error(`R2 PUT failed (${res.status}) for ${relPath}`);
    }
  }

  async readFile(relPath: string): Promise<Buffer | null> {
    const res = await this.client.fetch(this.objectUrl(relPath), { method: "GET" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }

  async deleteFile(relPath: string): Promise<void> {
    try {
      await this.client.fetch(this.objectUrl(relPath), { method: "DELETE" });
    } catch {
      // best-effort — cleanup must never fail the request
    }
  }

  publicUrl(relPath: string, opts?: { versioned?: boolean }): string {
    const url = `${this.publicBase}/${encodeKey(relPath)}`;
    return opts?.versioned ? `${url}?v=${Date.now()}` : url;
  }

  /**
   * Presigned PUT URL for direct browser->R2 upload (large video bypasses the
   * function body cap). Host-signed only, so the browser sets Content-Type on
   * the PUT; the caller restricts which paths/types ever get a URL.
   */
  async presignUpload(
    relPath: string,
    _contentType: string,
    expiresSeconds = 600,
  ): Promise<string | null> {
    const url = new URL(this.objectUrl(relPath));
    url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
    const signed = await this.client.sign(url.toString(), {
      method: "PUT",
      aws: { signQuery: true },
    });
    return signed.url;
  }
}

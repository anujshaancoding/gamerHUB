/**
 * Tiny helper that parses a request's JSON body with a zod schema and
 * returns a NextResponse on failure. Saves the same 6-line try/catch from
 * being copy-pasted into every API route.
 *
 *   const parsed = await validateBody(req, MySchema);
 *   if (!parsed.ok) return parsed.response;
 *   const { foo, bar } = parsed.data;
 */

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; response: NextResponse };

export async function validateBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<Ok<T> | Err> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".") || "body";
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Validation failed: ${path} — ${issue?.message ?? "invalid"}` },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

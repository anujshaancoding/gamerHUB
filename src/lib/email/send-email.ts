/**
 * Provider-agnostic transactional email sender.
 *
 * Uses Resend (https://resend.com) over plain `fetch` when `RESEND_API_KEY` is
 * configured — no extra dependency required. If no provider is configured the
 * send is treated as a hard failure so callers do NOT report success to the
 * user (and we never log secrets such as reset tokens).
 *
 * Required env:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — verified sender, e.g. "ggLobby <no-reply@gglobby.in>"
 */

import { logger } from "@/lib/logger";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email provider not configured (missing RESEND_API_KEY/EMAIL_FROM)");
    this.name = "EmailNotConfiguredError";
  }
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    // Do NOT log the body/links — they may contain reset tokens.
    logger.error("Email not sent: provider not configured", { to, subject });
    throw new EmailNotConfiguredError();
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("Email provider returned an error", {
      to,
      subject,
      status: res.status,
      // Truncate to avoid dumping anything sensitive in logs.
      detail: detail.slice(0, 300),
    });
    throw new Error(`Email send failed (status ${res.status})`);
  }
}

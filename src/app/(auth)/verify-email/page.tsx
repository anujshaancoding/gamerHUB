"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

type Status = "loading" | "ok" | "expired" | "used" | "invalid";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("ok");
        } else if (data?.reason === "expired") {
          setStatus("expired");
        } else if (data?.reason === "used") {
          setStatus("used");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const resend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendSent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your email…</p>
          </>
        )}

        {status === "ok" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-bold">Email verified</h1>
            <p className="text-muted-foreground">You can now sign in to your account.</p>
            <Link href="/login"><Button>Go to sign in</Button></Link>
          </>
        )}

        {(status === "expired" || status === "used" || status === "invalid") && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold">
              {status === "expired"
                ? "Link expired"
                : status === "used"
                  ? "Link already used"
                  : "Invalid link"}
            </h1>
            <p className="text-muted-foreground">
              {status === "expired"
                ? "Verification links expire after 24 hours. Send yourself a new one."
                : status === "used"
                  ? "This link has already been used. If you already verified, just sign in."
                  : "We couldn't verify this token. Send yourself a new link or try signing in."}
            </p>

            {!resendSent ? (
              <div className="space-y-3 mt-4">
                <input
                  type="email"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="your-email@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button onClick={resend} disabled={resending || !resendEmail}>
                  {resending ? "Sending…" : "Send a new verification email"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                If an account exists for that email, we&apos;ve sent a new link.
              </p>
            )}

            <div>
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

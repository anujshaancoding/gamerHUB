"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import { AGENTS, agentPortrait } from "@/lib/data/valorant-agents";

const EMAIL_NOT_VERIFIED_SENTINEL = "EMAIL_NOT_VERIFIED";

function getUserFriendlyAuthError(message: string): string {
  if (message === EMAIL_NOT_VERIFIED_SENTINEL) {
    return "Your email isn't verified yet. Check your inbox for the confirmation link — or resend it below.";
  }
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not verified")) {
    return "Your email isn't verified yet. Check your inbox for the confirmation link — or resend it below.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Too many login attempts. Please wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Unable to connect. Please check your internet connection and try again.";
  }
  return message;
}

interface AuthFormProps {
  mode: "login" | "register";
}

/**
 * Lightweight password-strength scorer used for the inline indicator. Returns a
 * 0–3 score and a label/color so users get real-time feedback instead of a
 * submit-time error. Matches the signup validation rules (8+ chars, a letter
 * and a number).
 */
function scorePassword(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: V.border };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) score += 1;
  if (score <= 1) return { score: 1, label: "Weak", color: V.red };
  if (score === 2) return { score: 2, label: "Good", color: "#e0a526" };
  return { score: 3, label: "Strong", color: V.teal };
}

const HERO = AGENTS.find((a) => a.slug === "jett")!;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/agents");
    }
  }, [user, authLoading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const isLogin = mode === "login";
  const strength = scorePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setShowResend(false);
    setResendState("idle");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        router.push("/agents");
      } else {
        if (username.length < 3) throw new Error("Username must be at least 3 characters");
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
          throw new Error("Password must contain at least one letter and one number");
        }
        const { data, error } = await signUpWithEmail(email, password, username);
        if (error) throw error;
        const signUpData = data as { session?: unknown } | null;
        if (signUpData?.session) {
          router.push("/onboarding");
        } else {
          setSuccessMessage("Check your email for a confirmation link to complete signup.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setShowResend(message === EMAIL_NOT_VERIFIED_SENTINEL);
      setError(getUserFriendlyAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendState("sending");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Endpoint is anti-enumeration (always succeeds); show a neutral confirmation.
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  };

  const handleOAuth = async (provider: "google") => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none transition-colors";
  const inputStyle: React.CSSProperties = {
    background: V.bgDeep,
    border: `1px solid ${V.border}`,
    color: V.cream,
  };
  const labelCls =
    "mb-1.5 block text-[11px] font-black uppercase tracking-widest";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT — brand / agent panel (STREET style, like homepage) */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{ background: V.bgDeep }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(60% 60% at 30% 20%, ${V.red}33, transparent 70%)`,
          }}
        />
        <span className="relative text-2xl font-black italic tracking-tight">
          gg<span style={{ color: V.red }}>Lobby</span>
        </span>

        <div className="relative z-10">
          <div
            className="-skew-x-12 inline-block px-3 py-1 text-xs font-black uppercase tracking-widest"
            style={{ background: V.red, color: V.bg }}
          >
            <span className="inline-block skew-x-12">
              The Indian VALORANT community
            </span>
          </div>
          <h1 className="mt-5 text-6xl font-black uppercase italic leading-[0.82] tracking-tighter">
            {isLogin ? (
              <>
                Welcome
                <br />
                <span style={{ WebkitTextStroke: `2px ${V.red}`, color: "transparent" }}>
                  back.
                </span>
              </>
            ) : (
              <>
                Build your
                <br />
                <span style={{ WebkitTextStroke: `2px ${V.red}`, color: "transparent" }}>
                  identity.
                </span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-sm text-sm" style={{ color: V.textMuted }}>
            {isLogin
              ? "Back to the grind. Sign in and pick up where you left off."
              : "One profile for everything you are in VALORANT — rank, clips, skins, milestones. Own the lobby."}
          </p>
        </div>

        <Image
          src={agentPortrait(HERO.uuid)}
          alt=""
          width={520}
          height={680}
          priority
          className="pointer-events-none absolute -bottom-6 -right-10 h-auto w-[420px] opacity-90 drop-shadow-2xl"
        />
      </div>

      {/* RIGHT — form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* mobile brand */}
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-black italic tracking-tight">
              gg<span style={{ color: V.red }}>Lobby</span>
            </span>
          </div>

          <h2 className="text-3xl font-black uppercase italic tracking-tight">
            {isLogin ? "Sign in" : "Join the lobby"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: V.textMuted }}>
            {isLogin
              ? "Continue your VALORANT journey."
              : "Create your free profile and start showing off."}
          </p>

          <div
            className="mt-7 rounded-2xl p-6"
            style={{ background: V.surface, border: `1px solid ${V.border}` }}
          >
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
              style={{ background: V.bgDeep, border: `1px solid ${V.border}`, color: V.cream }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: V.border }} />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: V.textDim }}
              >
                or email
              </span>
              <div className="h-px flex-1" style={{ background: V.border }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className={labelCls} style={{ color: V.textMuted }}>
                    Gamer tag
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: V.textDim }}
                    />
                    <input
                      type="text"
                      placeholder="Your gamer tag"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      maxLength={30}
                      className={inputBase}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls} style={{ color: V.textMuted }}>
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: V.textDim }}
                  />
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputBase}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ color: V.textMuted }}>
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: V.textDim }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputBase}
                    style={inputStyle}
                    aria-describedby={!isLogin ? "password-strength" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: V.textDim }}
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Inline password strength — register only */}
                {!isLogin && (
                  <div id="password-strength" aria-live="polite">
                    {password ? (
                      <div className="mt-2">
                        <div className="flex gap-1.5" aria-hidden="true">
                          {[1, 2, 3].map((bar) => (
                            <div
                              key={bar}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{
                                background:
                                  strength.score >= bar ? strength.color : V.border,
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="mt-1.5 text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: strength.color }}
                        >
                          {strength.label} password
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[11px]" style={{ color: V.textDim }}>
                        8+ characters, mix of letters &amp; numbers
                      </p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: `${V.red}1a`, border: `1px solid ${V.red}55`, color: V.red }}
                >
                  <p>{error}</p>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendState !== "idle"}
                      className="mt-2 text-xs font-black uppercase tracking-wider underline disabled:opacity-60"
                      style={{ color: V.red }}
                    >
                      {resendState === "sent"
                        ? "Verification email sent — check your inbox"
                        : resendState === "sending"
                        ? "Sending…"
                        : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              {successMessage && (
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: `${V.teal}1a`, border: `1px solid ${V.teal}55`, color: V.teal }}
                >
                  {successMessage}
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <Link
                    href="/reset-password"
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: V.textMuted }}
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full -skew-x-12 items-center justify-center gap-2 py-3.5 text-sm font-black uppercase tracking-wider transition-opacity disabled:opacity-60"
                style={{ background: V.red, color: V.cream }}
              >
                <span className="flex skew-x-12 items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sign in" : "Create profile"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: V.textMuted }}>
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-black uppercase tracking-wider"
              style={{ color: V.red }}
            >
              {isLogin ? "Create profile" : "Sign in"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

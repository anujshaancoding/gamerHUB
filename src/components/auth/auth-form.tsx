"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { Logo } from "@/components/layout/logo";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        router.push("/community");
      } else {
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const { data, error } = await signUpWithEmail(email, password, username);
        if (error) throw error;
        // If Supabase returns a session, the user is immediately authenticated
        const signUpData = data as { session?: unknown } | null;
        if (signUpData?.session) {
          router.push("/onboarding");
        } else {
          // Email confirmation is required
          setSuccessMessage("Check your email for a confirmation link to complete signup.");
        }
      }
    } catch (err: unknown) {
      console.error("[AuthForm] Full error object:", err);
      const message = err instanceof Error ? err.message : String(err);
      const status = (err as { status?: number })?.status;
      const cause = (err as { cause?: unknown })?.cause;
      console.error("[AuthForm] Parsed:", { message, status, cause });
      setError(status ? `${message} (status: ${status})` : message);
    } finally {
      setLoading(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Logo showText={true} size="lg" href={undefined} />
        </div>
        <h1 className="text-2xl font-bold text-text">
          {isLogin ? "Welcome back, Gamer!" : "Join the Lobby"}
        </h1>
        <p className="text-text-muted mt-2">
          {isLogin
            ? "Sign in to continue your gaming journey"
            : "Create your account and start connecting"}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            leftIcon={
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface px-2 text-text-muted">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Username"
              type="text"
              placeholder="Enter your gamer tag"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
              minLength={3}
              maxLength={30}
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            required
            minLength={6}
          />
          {!isLogin && (
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              required
              minLength={6}
            />
          )}

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
              {successMessage}
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

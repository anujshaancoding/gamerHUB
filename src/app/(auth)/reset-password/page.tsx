"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Gamepad2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
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
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gamepad2 className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold text-glow-primary">GamerHub</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Reset Your Password</h1>
        <p className="text-text-muted mt-2">
          {success
            ? "Check your email for the reset link"
            : "Enter your email and we'll send you a reset link"}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">
                Check Your Email
              </h3>
              <p className="text-text-muted text-sm">
                We've sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Send Reset Link
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-text-muted hover:text-text transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

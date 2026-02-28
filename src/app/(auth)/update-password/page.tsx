"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Gamepad2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setSuccess(true);
      setTimeout(() => router.push("/community"), 2000);
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
        <h1 className="text-2xl font-bold text-text">Set New Password</h1>
        <p className="text-text-muted mt-2">
          {success
            ? "Your password has been updated!"
            : "Enter your new password below"}
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
                Password Updated
              </h3>
              <p className="text-text-muted text-sm">
                Redirecting you to the app...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
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
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
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

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

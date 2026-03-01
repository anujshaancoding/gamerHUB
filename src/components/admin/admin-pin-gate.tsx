"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export function AdminPinGate({ onVerified }: { onVerified: () => void }) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newPin.every((d) => d !== "")) {
      submitPin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullPin = pin.join("");
      if (fullPin.length === 6) {
        submitPin(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newPin = [...pin];
    for (let i = 0; i < pasted.length; i++) {
      newPin[i] = pasted[i];
    }
    setPin(newPin);

    if (pasted.length === 6) {
      submitPin(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const submitPin = async (fullPin: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });

      if (res.ok) {
        onVerified();
      } else {
        const data = await res.json();
        if (res.status === 429) {
          setError(data.error || "Too many attempts. Please wait.");
        } else if (data.remaining !== undefined) {
          setError(`Invalid PIN. ${data.remaining} attempt${data.remaining !== 1 ? "s" : ""} remaining.`);
        } else {
          setError(data.error || "Invalid PIN");
        }
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Connection error. Try again.");
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
      <div className="text-center max-w-sm w-full px-6">
        <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-violet-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Admin Verification</h1>
        <p className="text-white/40 text-sm mb-8">
          Enter your 6-digit admin PIN to continue
        </p>

        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-12 h-14 text-center text-xl font-mono font-bold rounded-lg
                bg-white/5 border border-white/10 text-white
                focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none
                disabled:opacity-50 transition-colors"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getStripe } from "@/lib/stripe-client";

interface CheckoutButtonProps {
  priceId: string;
  mode?: "subscription" | "payment";
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}

export function CheckoutButton({
  priceId,
  mode = "subscription",
  successUrl,
  cancelUrl,
  metadata,
  children,
  className,
  variant = "default",
  size = "default",
  disabled,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode,
          successUrl,
          cancelUrl,
          metadata,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url, sessionId } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

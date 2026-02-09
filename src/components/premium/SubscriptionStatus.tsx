"use client";

import { useSubscription } from "@/lib/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getSubscriptionStatusLabel, getSubscriptionStatusColor } from "@/lib/stripe";

export function SubscriptionStatus() {
  const {
    subscription,
    isPremium,
    premiumUntil,
    isLoadingSubscription,
    manageBilling,
    cancel,
    resume,
    isManagingBilling,
    isCanceling,
    isResuming,
  } = useSubscription();

  if (isLoadingSubscription) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </Card>
    );
  }

  if (!subscription && !isPremium) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="text-center py-4">
          <p className="text-zinc-400 mb-4">You don&apos;t have an active subscription</p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/premium")}
          >
            View Plans
          </Button>
        </div>
      </Card>
    );
  }

  const statusLabel = subscription
    ? getSubscriptionStatusLabel(subscription.status)
    : isPremium
    ? "Active"
    : "None";
  const statusColor = subscription
    ? getSubscriptionStatusColor(subscription.status)
    : isPremium
    ? "text-green-500"
    : "text-zinc-500";

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Crown className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">
              {subscription?.plan?.name || "GamerHub Premium"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColor}>
                {statusLabel}
              </Badge>
              {subscription?.billing_cycle && (
                <span className="text-sm text-zinc-400">
                  ({subscription.billing_cycle})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {subscription?.cancel_at_period_end && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-200">
              Your subscription will end on{" "}
              {subscription.current_period_end &&
                format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-yellow-400 p-0 h-auto"
              onClick={() => resume()}
              disabled={isResuming}
            >
              {isResuming ? "Resuming..." : "Resume subscription"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {subscription?.current_period_end && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-400">
              {subscription.cancel_at_period_end ? "Access until" : "Renews"}{" "}
              {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => manageBilling()}
          disabled={isManagingBilling}
          className="flex-1"
        >
          {isManagingBilling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Manage Billing"
          )}
        </Button>

        {subscription && !subscription.cancel_at_period_end && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Are you sure you want to cancel your subscription?")) {
                cancel();
              }
            }}
            disabled={isCanceling}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            {isCanceling ? "Canceling..." : "Cancel"}
          </Button>
        )}
      </div>
    </Card>
  );
}

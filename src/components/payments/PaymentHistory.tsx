"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatAmount, getPaymentTypeLabel } from "@/lib/stripe";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "canceled";
  payment_type: "subscription" | "battle_pass" | "currency_pack" | "one_time";
  created_at: string;
  metadata: Record<string, unknown>;
}

async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/payments/history");
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions || [];
}

function getStatusBadge(status: Transaction["status"]) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    succeeded: "bg-green-500/20 text-green-400 border-green-500/50",
    failed: "bg-red-500/20 text-red-400 border-red-500/50",
    refunded: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    canceled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/50",
  };

  return (
    <Badge variant="outline" className={styles[status] || styles.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function PaymentHistory() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["payment-history"],
    queryFn: fetchTransactions,
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <p className="text-center text-zinc-400 py-8">No payment history yet</p>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">Payment History</h3>
      </div>

      <div className="divide-y divide-zinc-800">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {getPaymentTypeLabel(transaction.payment_type)}
              </p>
              <p className="text-sm text-zinc-400">
                {format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {getStatusBadge(transaction.status)}
              <span className="font-semibold text-white min-w-[80px] text-right">
                {formatAmount(transaction.amount, transaction.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

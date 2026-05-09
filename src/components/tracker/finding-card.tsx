"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { VerdictPill } from "./verdict-pill";
import { ArrowRight } from "lucide-react";
import type { InsightFinding } from "@/lib/tracker/types";

export function FindingCard({ finding }: { finding: InsightFinding }) {
  return (
    <Card variant="outlined" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-text-muted">{finding.metric}</p>
          <p className="text-2xl font-bold text-text">{finding.value}</p>
        </div>
        <VerdictPill verdict={finding.verdict} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {finding.message}
      </p>
      {finding.suggestion ? (
        <p className="mt-2 rounded-lg bg-surface-light/60 px-3 py-2 text-xs text-text-muted">
          <span className="font-semibold text-text">Try this: </span>
          {finding.suggestion}
        </p>
      ) : null}
      {finding.drillLink ? (
        <Link
          href={finding.drillLink.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {finding.drillLink.label} <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </Card>
  );
}

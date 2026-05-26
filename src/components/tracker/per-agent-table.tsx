"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { UserCircle, User } from "lucide-react";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import type { PerAgentStat } from "@/lib/tracker/types";

export function PerAgentTable({ agents }: { agents: PerAgentStat[] }) {
  if (!agents.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <UserCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text sm:text-lg">Top Agents</h3>
          <p className="text-xs text-text-muted sm:text-sm">
            Performance by agent across the sampled matches.
          </p>
        </div>
      </div>

      <Card variant="outlined" className="overflow-hidden p-0">
        {/* Desktop / tablet — table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-light/40 text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Agent</th>
                <th className="px-3 py-2.5 text-right font-semibold">Matches</th>
                <th className="px-3 py-2.5 text-right font-semibold">Win %</th>
                <th className="px-3 py-2.5 text-right font-semibold">K/D</th>
                <th className="px-3 py-2.5 text-right font-semibold">ADR</th>
                <th className="px-3 py-2.5 text-right font-semibold">ACS</th>
                <th className="px-3 py-2.5 text-right font-semibold">Best Map</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <AgentRow key={a.agentId} agent={a} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile — stacked cards */}
        <div className="sm:hidden divide-y divide-border">
          {agents.map((a) => (
            <AgentCardMobile key={a.agentId} agent={a} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function AgentAvatar({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-light text-text-muted">
        <User className="h-4 w-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxyAssetUrl("agent", agentId)}
      alt={agentName}
      className="h-8 w-8 rounded-md object-cover bg-surface-light"
      onError={() => setErr(true)}
    />
  );
}

function wrTone(wr: number): string {
  if (wr >= 60) return "text-success";
  if (wr >= 45) return "text-text";
  return "text-error";
}

function kdTone(kd: number): string {
  if (kd >= 1.1) return "text-success";
  if (kd >= 0.9) return "text-text";
  return "text-error";
}

function AgentRow({ agent }: { agent: PerAgentStat }) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-light/30">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <AgentAvatar agentId={agent.agentId} agentName={agent.agentName} />
          <span className="font-medium text-text">{agent.agentName}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
        {agent.matches}
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${wrTone(agent.winRate)}`}>
        {agent.winRate}%
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${kdTone(agent.kd)}`}>
        {agent.kd.toFixed(2)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-text">
        {agent.adr}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-text">
        {agent.acs}
      </td>
      <td className="px-3 py-2.5 text-right text-text-secondary">
        {agent.bestMap ? (
          <span>
            {agent.bestMap}{" "}
            <span className={`text-xs ${wrTone(agent.bestMapWinRate)}`}>
              {agent.bestMapWinRate}% WR
            </span>
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
    </tr>
  );
}

function AgentCardMobile({ agent }: { agent: PerAgentStat }) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AgentAvatar agentId={agent.agentId} agentName={agent.agentName} />
          <div>
            <p className="font-semibold text-text">{agent.agentName}</p>
            <p className="text-xs text-text-muted">
              {agent.matches} matches · {agent.wins}W
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold tabular-nums ${wrTone(agent.winRate)}`}>
            {agent.winRate}%
          </p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Win Rate</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniMetric label="K/D" value={agent.kd.toFixed(2)} tone={kdTone(agent.kd)} />
        <MiniMetric label="ADR" value={agent.adr.toString()} />
        <MiniMetric label="ACS" value={agent.acs.toString()} />
      </div>
      {agent.bestMap && (
        <p className="mt-2 text-center text-xs text-text-muted">
          Best on <span className="text-text">{agent.bestMap}</span>{" "}
          <span className={wrTone(agent.bestMapWinRate)}>
            ({agent.bestMapWinRate}% WR)
          </span>
        </p>
      )}
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-surface-light/50 px-1.5 py-1.5">
      <p className={`text-sm font-bold tabular-nums ${tone ?? "text-text"}`}>{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}

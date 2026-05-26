"use client";

import { Calendar } from "lucide-react";

export function ActFilter({
  acts,
  current,
  onChange,
}: {
  acts: string[];
  current: string;
  onChange: (act: string) => void;
}) {
  if (acts.length <= 1) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-light/40 px-3 py-2">
      <Calendar className="h-4 w-4 text-text-muted" />
      <label htmlFor="act-filter" className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Act
      </label>
      <select
        id="act-filter"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-text outline-none cursor-pointer"
      >
        {acts.map((a) => (
          <option key={a} value={a} className="bg-surface text-text">
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}

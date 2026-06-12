import Link from "next/link";
import { VALORANT as V } from "@/lib/features/theme/valorant-theme";

const links = [
  { href: "/demo/arena", n: "01 Arena" },
  { href: "/demo/hub", n: "02 Hub" },
  { href: "/demo/cinematic", n: "03 Cinematic" },
  { href: "/demo/street", n: "04 Street" },
];

export function DemoSwitcher() {
  return (
    <div
      className="sticky bottom-0 z-30 flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3 text-xs"
      style={{ background: V.bgDeep, borderColor: V.border }}
    >
      <span style={{ color: V.textDim }}>Compare designs:</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded px-2 py-1 font-bold uppercase tracking-wider"
          style={{ background: V.surface, color: V.textMuted }}
        >
          {l.n}
        </Link>
      ))}
      <Link
        href="/demo"
        className="rounded px-2 py-1 font-bold uppercase tracking-wider"
        style={{ background: V.red, color: V.cream }}
      >
        Index
      </Link>
    </div>
  );
}

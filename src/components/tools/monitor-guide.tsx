"use client";

import { useMemo, useState } from "react";
import { Monitor, Zap, Timer, Eye } from "lucide-react";

const HZ_TABLE = [
  { hz: 60,  frameMs: 1000 / 60,  note: "Bare minimum. Visible motion blur even with sample-and-hold." },
  { hz: 75,  frameMs: 1000 / 75,  note: "Slightly smoother than 60. Common on budget IPS panels." },
  { hz: 120, frameMs: 1000 / 120, note: "Big jump. Most laptops and consoles target this." },
  { hz: 144, frameMs: 1000 / 144, note: "Comp-FPS minimum. Cheap, widely available, big diff vs 60." },
  { hz: 165, frameMs: 1000 / 165, note: "Marginal gain over 144 — same panels, mild overclock." },
  { hz: 240, frameMs: 1000 / 240, note: "Noticeable for flicks & tracking. Diminishing returns kick in here." },
  { hz: 360, frameMs: 1000 / 360, note: "Pro-tier. Difference vs 240 is real but small. Frametime ≈ 2.8 ms." },
  { hz: 480, frameMs: 1000 / 480, note: "Bleeding edge. Useful only if your GPU consistently hits 400+ FPS." },
];

export function MonitorGuide() {
  const [diagInches, setDiagInches] = useState("24");
  const [aspect, setAspect] = useState("16:9");

  const recDistance = useMemo(() => {
    const d = Number(diagInches) || 0;
    const [w, h] = aspect.split(":").map(Number);
    const ratio = w && h ? w / h : 16 / 9;
    // height in inches = diag / sqrt(1 + ratio^2)
    const heightIn = d / Math.sqrt(1 + ratio * ratio);
    // Optimal FPS distance ≈ 1.6× height (so you can see edges without head-turn)
    const cm = heightIn * 1.6 * 2.54;
    return { cmLow: cm * 0.9, cmHigh: cm * 1.1 };
  }, [diagInches, aspect]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Refresh rate — what each step buys you</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-text-muted text-xs uppercase tracking-wider">
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3">Hz</th>
                <th className="text-left py-2 pr-3">Frametime</th>
                <th className="text-left py-2">What it actually means</th>
              </tr>
            </thead>
            <tbody>
              {HZ_TABLE.map((r) => (
                <tr key={r.hz} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold text-text">{r.hz}</td>
                  <td className="py-2 pr-3 font-mono text-text-secondary">{r.frameMs.toFixed(1)} ms</td>
                  <td className="py-2 text-text-secondary">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">
          Frametime is the gap between displayed frames. Halving it (60 → 120) feels much bigger than
          shaving 2 ms off a fast monitor (240 → 360). Spend on the first jump, save on the last.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Response time vs input lag — not the same thing</h2>
        </div>
        <dl className="space-y-3 text-sm text-text-secondary">
          <div>
            <dt className="font-semibold text-text">Response time (GtG / MPRT)</dt>
            <dd className="leading-relaxed mt-0.5">
              How fast a pixel changes shade. Lower = less ghosting on fast-moving targets. 1 ms IPS is
              effectively the floor for FPS — any faster won&apos;t be visible. Don&apos;t pay extra past it.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Input lag (end-to-end latency)</dt>
            <dd className="leading-relaxed mt-0.5">
              Time from mouse click → pixel changing. Dominated by display processing and engine
              render queue, <em>not</em> pixel transition. Look for &lt;10 ms display lag on review sites
              like RTINGS. NVIDIA Reflex / AMD Anti-Lag shaves another 10–30 ms when supported.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Panel type — TN / IPS / OLED</dt>
            <dd className="leading-relaxed mt-0.5">
              TN is old; only useful if you find a 360 Hz one cheap. IPS is the default for FPS now —
              fast enough, much better colours. OLED is the best motion clarity money can buy, but
              burn-in is a real risk with static HUDs (BGMI minimap, Val map). Use it for non-comp too.
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Viewing distance — find your sweet spot</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">Monitor size (inches diagonal)</span>
            <input
              type="number"
              value={diagInches}
              onChange={(e) => setDiagInches(e.target.value)}
              className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">Aspect ratio</span>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
            >
              <option>16:9</option>
              <option>16:10</option>
              <option>21:9</option>
              <option>32:9</option>
              <option>4:3</option>
            </select>
          </label>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Recommended distance (FPS)</p>
          <p className="text-2xl font-bold text-text mt-1 font-mono">
            {recDistance.cmLow.toFixed(0)}–{recDistance.cmHigh.toFixed(0)} cm
          </p>
          <p className="text-xs text-text-muted mt-1">
            ~1.6× the monitor&apos;s height — close enough to see edges without head-turn, far enough to take in flick-shots.
          </p>
        </div>
        <p className="text-xs text-text-muted">
          Cinematic / browsing benefits from 2×–2.5× height. FPS players sit closer than the spec sheet expects.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">TL;DR — what to buy in 2026</h2>
        </div>
        <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1.5 leading-relaxed">
          <li><strong>Budget FPS (&lt; ₹20k):</strong> 24&quot; 1080p IPS, 165–180 Hz, 1 ms. LG / AOC / BenQ.</li>
          <li><strong>Mid (₹25k–₹45k):</strong> 27&quot; 1440p IPS, 240 Hz. Best $/perf tier right now.</li>
          <li><strong>High-end (₹60k+):</strong> 27&quot; QD-OLED 240 Hz or 360 Hz IPS. Burn-in risk on OLED with static HUDs.</li>
          <li><strong>Avoid:</strong> 4K for competitive FPS (GPU bottleneck), VA panels (smearing on dark scenes), anything over 32&quot; for FPS.</li>
        </ul>
      </section>
    </div>
  );
}

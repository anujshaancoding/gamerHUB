import type { Metadata } from "next";
import { MonitorGuide } from "@/components/gaming/tools/monitor-guide";

export const metadata: Metadata = {
  title: "Monitor & Hz Guide — Refresh rate, response time, input lag for FPS",
  description:
    "What refresh rate, response time, panel type and viewing distance actually matter for FPS gaming. Includes a viewing-distance calculator and an Hz frame-time table.",
  alternates: { canonical: "/tools/monitor" },
};

export default function MonitorPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Monitor &amp; Hz guide</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          The numbers that actually matter for FPS — refresh rate, response time,
          input lag, viewing distance. Plus a frame-time table so you know what
          jumping from 144 Hz to 240 Hz really buys you.
        </p>
      </header>

      <MonitorGuide />
    </div>
  );
}

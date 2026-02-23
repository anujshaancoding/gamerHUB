"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CallWrapper = dynamic(
  () => import("./call-wrapper").then((mod) => mod.CallWrapper),
  { ssr: false }
);

export function LazyCallWrapper({ children }: { children: ReactNode }) {
  return <CallWrapper>{children}</CallWrapper>;
}

"use client";

import { ReactNode } from "react";
import { CallProvider } from "./call-provider";
import { IncomingCallModal } from "./incoming-call-modal";
import { CallRoom } from "./call-room";
import { useCall } from "./call-provider";

interface CallWrapperProps {
  children: ReactNode;
}

export function CallWrapper({ children }: CallWrapperProps) {
  return (
    <CallProvider>
      {children}
      <IncomingCallModal />
      <ActiveCallRoom />
    </CallProvider>
  );
}

function ActiveCallRoom() {
  const { activeCall } = useCall();
  if (!activeCall) return null;
  return <CallRoom />;
}

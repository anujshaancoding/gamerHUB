"use client";

import { use } from "react";
import { PlayerForm } from "@/components/admin/pro/player-form";

export default function EditProPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PlayerForm playerId={id} />;
}

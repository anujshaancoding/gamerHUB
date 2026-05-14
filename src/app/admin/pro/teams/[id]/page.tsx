"use client";

import { use } from "react";
import { TeamForm } from "@/components/admin/pro/team-form";

export default function EditProTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TeamForm teamId={id} />;
}

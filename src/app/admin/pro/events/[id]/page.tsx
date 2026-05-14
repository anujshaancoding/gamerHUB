"use client";

import { use } from "react";
import { EventForm } from "@/components/admin/pro/event-form";

export default function EditProEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EventForm eventId={id} />;
}

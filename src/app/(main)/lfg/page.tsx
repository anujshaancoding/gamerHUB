import { redirect } from "next/navigation";

export default function LFGPage() {
  redirect("/find-gamers?tab=lfg");
}

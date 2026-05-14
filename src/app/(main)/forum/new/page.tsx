import { redirect } from "next/navigation";
import { listForumCategories } from "@/lib/pro/forum-queries";
import { getUser } from "@/lib/auth/get-user";
import { NewThreadForm } from "@/components/forum/new-thread-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "New thread — ggLobby Forum",
};

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/forum/new");

  const { category: preselectedSlug } = await searchParams;
  const cats = await listForumCategories();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-5">
      <Link href="/forum" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text">
        <ChevronLeft className="h-3 w-3" /> Forum
      </Link>
      <h1 className="text-2xl font-bold text-text">Start a new thread</h1>
      <NewThreadForm categories={cats.filter((c) => !c.is_locked)} preselected={preselectedSlug} />
    </div>
  );
}

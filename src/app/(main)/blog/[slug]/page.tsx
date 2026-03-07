import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostRedirect({ params }: Props) {
  const { slug } = await params;
  const db = createClient();

  const { data: post } = await db
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (post) {
    redirect(`/community/post/${post.id}`);
  }

  redirect("/community?tab=blog");
}

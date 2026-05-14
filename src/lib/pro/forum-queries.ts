import { createAdminClient } from "@/lib/db/admin";

export interface ForumCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  game_id: string | null;
  post_count: number;
  is_locked: boolean;
  display_order: number;
}

export interface ForumThreadAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ForumThreadRow {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  post_type: string;
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_score: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  author: ForumThreadAuthor | null;
  last_reply_author?: ForumThreadAuthor | null;
  category?: { id: string; slug: string; name: string; icon: string | null; color: string | null } | null;
}

export interface ForumReplyRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  vote_score: number;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author: ForumThreadAuthor | null;
  children?: ForumReplyRow[];
}

export async function listForumCategories(): Promise<ForumCategoryRow[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("forum_categories")
    .select("id, slug, name, description, icon, color, game_id, post_count, is_locked, display_order")
    .eq("is_hidden", false)
    .order("display_order");
  if (error) {
    console.error("listForumCategories error", error);
    return [];
  }
  return (data || []) as ForumCategoryRow[];
}

export async function getForumCategoryBySlug(slug: string): Promise<ForumCategoryRow | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("forum_categories")
    .select("id, slug, name, description, icon, color, game_id, post_count, is_locked, display_order")
    .eq("slug", slug)
    .single();
  return (data as ForumCategoryRow) || null;
}

export async function listForumThreadsByCategory(
  categoryId: string,
  sort: "latest" | "popular" = "latest",
  limit = 30
): Promise<ForumThreadRow[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (admin as any)
    .from("forum_posts")
    .select(`
      id, category_id, title, slug, content, post_type, tags,
      is_pinned, is_locked, is_solved,
      view_count, reply_count, vote_score,
      last_reply_at, created_at, updated_at,
      author:profiles!author_id (id, username, display_name, avatar_url),
      last_reply_author:profiles!last_reply_by (id, username, display_name, avatar_url)
    `)
    .eq("category_id", categoryId)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false });

  if (sort === "popular") {
    q = q.order("vote_score", { ascending: false }).order("created_at", { ascending: false });
  } else {
    q = q.order("last_reply_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  }

  q = q.range(0, limit - 1);
  const { data, error } = await q;
  if (error) {
    console.error("listForumThreadsByCategory error", error);
    return [];
  }
  return (data || []) as ForumThreadRow[];
}

export async function getForumThread(categoryId: string, slug: string): Promise<ForumThreadRow | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("forum_posts")
    .select(`
      id, category_id, title, slug, content, post_type, tags,
      is_pinned, is_locked, is_solved,
      view_count, reply_count, vote_score,
      last_reply_at, created_at, updated_at,
      author:profiles!author_id (id, username, display_name, avatar_url),
      category:forum_categories!category_id (id, slug, name, icon, color)
    `)
    .eq("category_id", categoryId)
    .eq("slug", slug)
    .eq("is_deleted", false)
    .single();
  return (data as ForumThreadRow) || null;
}

export async function listForumReplies(postId: string): Promise<ForumReplyRow[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("forum_replies")
    .select(`
      id, post_id, parent_id, content, vote_score, is_solution,
      created_at, updated_at,
      author:profiles!author_id (id, username, display_name, avatar_url)
    `)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("is_solution", { ascending: false })
    .order("created_at", { ascending: true });
  const rows = ((data || []) as ForumReplyRow[]);
  const tops = rows.filter((r) => !r.parent_id);
  const kids = rows.filter((r) => r.parent_id);
  return tops.map((t) => ({ ...t, children: kids.filter((k) => k.parent_id === t.id) }));
}

export async function listLatestForumThreads(limit = 12): Promise<ForumThreadRow[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("forum_posts")
    .select(`
      id, category_id, title, slug, post_type,
      reply_count, vote_score, last_reply_at, created_at,
      author:profiles!author_id (id, username, display_name, avatar_url),
      category:forum_categories!category_id (id, slug, name, icon, color)
    `)
    .eq("is_deleted", false)
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
  return (data || []) as ForumThreadRow[];
}

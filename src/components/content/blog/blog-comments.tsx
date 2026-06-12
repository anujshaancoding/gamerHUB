"use client";

import { ContentComments, type Comment } from "@/components/system/engagement/ContentComments";
import { useBlogComments, useAddBlogComment, useLikeBlogComment } from "@/lib/hooks/useBlog";

interface BlogCommentsProps {
  postSlug: string;
}

export function BlogComments({ postSlug }: BlogCommentsProps) {
  const { comments, allowComments, loading, refetch } = useBlogComments(postSlug);
  const { addComment, isAdding } = useAddBlogComment();
  const { toggleCommentLike, isLikingComment } = useLikeBlogComment(postSlug);

  return (
    <ContentComments
      contentId={postSlug}
      comments={comments as unknown as Comment[]}
      allowComments={allowComments}
      loading={loading}
      onAddComment={async ({ content, parent_id }) => {
        await addComment({ post_id: postSlug, content, parent_id });
      }}
      isAdding={isAdding}
      onRefetch={refetch}
      onLikeComment={async (commentId) => { await toggleCommentLike(commentId); }}
    />
  );
}

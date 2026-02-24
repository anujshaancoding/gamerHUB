"use client";

import { ContentComments } from "@/components/engagement/ContentComments";
import {
  useNewsComments,
  useAddNewsComment,
  useLikeNewsComment,
} from "@/lib/hooks/useNewsComments";

interface NewsCommentsProps {
  articleId: string;
}

export function NewsComments({ articleId }: NewsCommentsProps) {
  const { comments, allowComments, loading, refetch } =
    useNewsComments(articleId);
  const { addComment, isAdding } = useAddNewsComment();
  const { toggleCommentLike } = useLikeNewsComment(articleId);

  return (
    <ContentComments
      contentId={articleId}
      comments={comments}
      allowComments={allowComments}
      loading={loading}
      onAddComment={async ({ content, parent_id }) => {
        await addComment({ article_id: articleId, content, parent_id });
      }}
      isAdding={isAdding}
      onRefetch={refetch}
      onLikeComment={async (commentId) => {
        await toggleCommentLike(commentId);
      }}
    />
  );
}

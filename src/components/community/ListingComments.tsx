"use client";

import { ContentComments } from "@/components/engagement/ContentComments";
import { useListingComments, useAddListingComment, useLikeListingComment } from "@/lib/hooks/useListings";

interface ListingCommentsProps {
  listingId: string;
}

export function ListingComments({ listingId }: ListingCommentsProps) {
  const { comments, allowComments, loading, refetch } = useListingComments(listingId);
  const { addComment, isAdding } = useAddListingComment();
  const { toggleCommentLike, isLikingComment } = useLikeListingComment(listingId);

  return (
    <ContentComments
      contentId={listingId}
      comments={comments}
      allowComments={allowComments}
      loading={loading}
      onAddComment={async ({ content, parent_id }) => {
        await addComment({ listing_id: listingId, content, parent_id });
      }}
      isAdding={isAdding}
      onRefetch={refetch}
      onLikeComment={async (commentId) => { await toggleCommentLike(commentId); }}
    />
  );
}

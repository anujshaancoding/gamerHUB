"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level?: number;
  title?: string | null;
}

interface ForumReply {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  vote_score: number;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author: Author;
  user_vote?: number | null;
  children?: ForumReply[];
}

interface ReplyCardProps {
  reply: ForumReply;
  postAuthorId?: string;
  currentUserId?: string;
  isQuestion?: boolean;
  onVote: (replyId: string, voteType: 1 | -1) => void;
  onReply: (replyId: string) => void;
  onMarkSolution?: (replyId: string) => void;
  isVoting?: boolean;
  depth?: number;
}

export function ReplyCard({
  reply,
  postAuthorId,
  currentUserId,
  isQuestion,
  onVote,
  onReply,
  onMarkSolution,
  isVoting,
  depth = 0,
}: ReplyCardProps) {
  const [showChildren, setShowChildren] = useState(true);
  const canMarkSolution =
    isQuestion &&
    !reply.is_solution &&
    currentUserId === postAuthorId &&
    reply.author.id !== postAuthorId;

  return (
    <div className={cn(depth > 0 && "ml-8 border-l-2 border-zinc-800 pl-4")}>
      <Card
        className={cn(
          "p-4 bg-zinc-900/50 border-zinc-800",
          reply.is_solution && "border-green-500/50 bg-green-500/5"
        )}
      >
        <div className="flex gap-4">
          {/* Vote Controls */}
          <div className="flex flex-col items-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0",
                reply.user_vote === 1
                  ? "text-green-400"
                  : "text-zinc-500 hover:text-green-400"
              )}
              onClick={() => onVote(reply.id, 1)}
              disabled={isVoting}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span
              className={cn(
                "font-semibold text-sm",
                reply.vote_score > 0
                  ? "text-green-400"
                  : reply.vote_score < 0
                  ? "text-red-400"
                  : "text-zinc-500"
              )}
            >
              {reply.vote_score}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0",
                reply.user_vote === -1
                  ? "text-red-400"
                  : "text-zinc-500 hover:text-red-400"
              )}
              onClick={() => onVote(reply.id, -1)}
              disabled={isVoting}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${reply.author.username}`}
                  className="flex items-center gap-2 hover:opacity-80"
                >
                  <Avatar className="h-6 w-6">
                    {reply.author.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reply.author.avatar_url}
                        alt={reply.author.username}
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-700 flex items-center justify-center text-xs">
                        {reply.author.username[0].toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                  <span className="font-medium text-white text-sm">
                    {reply.author.display_name || reply.author.username}
                  </span>
                </Link>

                {reply.author.level && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-500/20 text-purple-300"
                  >
                    Lvl {reply.author.level}
                  </Badge>
                )}

                {reply.author.title && (
                  <Badge variant="outline" className="text-xs text-zinc-400">
                    {reply.author.title}
                  </Badge>
                )}

                {reply.is_solution && (
                  <Badge className="text-xs bg-green-500 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Solution
                  </Badge>
                )}
              </div>

              <span className="text-xs text-zinc-500">
                {formatDistanceToNow(new Date(reply.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
              <p className="whitespace-pre-wrap">{reply.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-500 hover:text-white"
                onClick={() => onReply(reply.id)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {canMarkSolution && onMarkSolution && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-green-500 hover:text-green-400"
                  onClick={() => onMarkSolution(reply.id)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark as Solution
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Nested Replies */}
      {reply.children && reply.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {!showChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500"
              onClick={() => setShowChildren(true)}
            >
              Show {reply.children.length} replies
            </Button>
          ) : (
            <>
              {reply.children.map((child) => (
                <ReplyCard
                  key={child.id}
                  reply={child}
                  postAuthorId={postAuthorId}
                  currentUserId={currentUserId}
                  isQuestion={isQuestion}
                  onVote={onVote}
                  onReply={onReply}
                  onMarkSolution={onMarkSolution}
                  isVoting={isVoting}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

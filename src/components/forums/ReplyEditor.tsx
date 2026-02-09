"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, X } from "lucide-react";

interface ReplyEditorProps {
  user?: {
    username: string;
    avatar_url: string | null;
  };
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
  replyingTo?: string;
  autoFocus?: boolean;
}

export function ReplyEditor({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  placeholder = "Write your reply...",
  replyingTo,
  autoFocus,
}: ReplyEditorProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 2) return;
    onSubmit(content.trim());
    setContent("");
  };

  const isValid = content.trim().length >= 2;

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800">
      {replyingTo && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800">
          <span className="text-sm text-zinc-400">
            Replying to <span className="text-white">{replyingTo}</span>
          </span>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {user && (
            <Avatar className="h-8 w-8 shrink-0">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-zinc-700 flex items-center justify-center text-sm">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </Avatar>
          )}

          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="bg-zinc-800 border-zinc-700 min-h-[100px] resize-none"
              autoFocus={autoFocus}
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {content.length > 0 && content.length < 2
                  ? "Reply must be at least 2 characters"
                  : "Supports markdown formatting"}
              </p>

              <div className="flex gap-2">
                {onCancel && !replyingTo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isValid || isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    "Post Reply"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}

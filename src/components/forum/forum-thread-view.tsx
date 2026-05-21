"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "@/components/ui";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ForumReplyRow } from "@/lib/pro/forum-queries";

interface Props {
  postId: string;
  initialReplies: ForumReplyRow[];
  initialScore: number;
  isLocked: boolean;
}

export function ForumThreadView({ postId, initialReplies, initialScore, isLocked }: Props) {
  const [replies, setReplies] = useState<ForumReplyRow[]>(initialReplies);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(`/api/forums/posts/${postId}/replies`);
    if (!res.ok) return;
    const json = await res.json();
    setReplies(json.replies || []);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <MessageSquare className="h-4 w-4" />
        {replies.reduce((s, r) => s + 1 + (r.children?.length ?? 0), 0)} replies
        <span>·</span>
        <span>score: <span className="font-mono text-text-secondary">{initialScore}</span></span>
      </div>

      <ul className="space-y-3">
        {replies.map((r, idx) => (
          <ReplyNode
            key={r.id}
            reply={r}
            index={idx + 1}
            postId={postId}
            onReplied={() => { setReplyTo(null); refresh(); }}
            isLocked={isLocked}
            replyOpen={replyTo === r.id}
            openReply={() => setReplyTo(replyTo === r.id ? null : r.id)}
          />
        ))}
        {replies.length === 0 && (
          <li className="rounded-xl border border-border bg-surface p-6 text-sm text-text-muted text-center">No replies yet — be the first.</li>
        )}
      </ul>

      {!isLocked && (
        <NewReplyForm postId={postId} parentId={null} onPosted={refresh} />
      )}
      {isLocked && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted text-center">This thread is locked.</div>
      )}
    </section>
  );
}

function ReplyNode({
  reply,
  index,
  postId,
  isLocked,
  replyOpen,
  openReply,
  onReplied,
}: {
  reply: ForumReplyRow;
  index: number;
  postId: string;
  isLocked: boolean;
  replyOpen: boolean;
  openReply: () => void;
  onReplied: () => void;
}) {
  const [score, setScore] = useState(reply.vote_score);
  const [vote, setVote] = useState<1 | -1 | null>(null);
  const { user } = useAuth();

  const doVote = async (v: 1 | -1) => {
    if (!user) { window.location.href = "/login"; return; }
    const res = await fetch(`/api/forums/replies/${reply.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType: v }),
    });
    if (!res.ok) return;
    const json = await res.json();
    setScore(json.score);
    setVote((p) => (p === v ? null : v));
  };

  return (
    <li className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-2 bg-surface-light/30 border-b border-border flex items-center justify-between text-xs text-text-muted">
        <span className="font-mono">#{index}</span>
        <div className="flex items-center gap-2">
          <Avatar src={reply.author?.avatar_url ?? undefined} size="xs" alt={reply.author?.username || ""} fallback={(reply.author?.display_name || reply.author?.username || "?")[0]} />
          <span className="text-text-secondary font-medium">{reply.author?.display_name || reply.author?.username || "anon"}</span>
          <span>·</span>
          <RelativeTime date={reply.created_at} />
          {reply.is_solution && <span className="text-success">· solution</span>}
        </div>
      </div>
      <div className="p-4 flex gap-4">
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button onClick={() => doVote(1)} className={cn("p-1 rounded hover:bg-primary/10", vote === 1 && "text-primary")} aria-label="upvote">
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-text">{score}</span>
          <button onClick={() => doVote(-1)} className={cn("p-1 rounded hover:bg-error/10", vote === -1 && "text-error")} aria-label="downvote">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{reply.content}</p>
          {!isLocked && (
            <button onClick={openReply} className="mt-2 text-xs text-text-muted hover:text-primary inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Reply
            </button>
          )}

          {reply.children && reply.children.length > 0 && (
            <ul className="mt-3 pl-4 border-l border-border space-y-2">
              {reply.children.map((c, ci) => (
                <ReplyNode
                  key={c.id}
                  reply={c}
                  index={ci + 1}
                  postId={postId}
                  isLocked={isLocked}
                  replyOpen={false}
                  openReply={() => {}}
                  onReplied={onReplied}
                />
              ))}
            </ul>
          )}

          {replyOpen && (
            <div className="mt-3">
              <NewReplyForm postId={postId} parentId={reply.id} onPosted={onReplied} compact />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function NewReplyForm({ postId, parentId, onPosted, compact = false }: { postId: string; parentId: string | null; onPosted: () => void; compact?: boolean }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const submit = async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (content.trim().length < 2) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forums/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Failed to reply");
        return;
      }
      setContent("");
      onPosted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("rounded-xl border border-border bg-surface", compact ? "p-3" : "p-4")}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={user ? (parentId ? "Reply to this comment…" : "Add to the discussion…") : "Sign in to reply"}
        rows={compact ? 2 : 3}
        disabled={!user}
        className="w-full bg-surface-light/40 border border-border rounded-lg px-3 py-2 text-sm text-text resize-y focus:outline-none focus:border-primary/50 disabled:opacity-50"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" variant="primary" onClick={submit} disabled={submitting || content.trim().length < 2}>
          <Send className="h-3.5 w-3.5 mr-1.5" /> {submitting ? "Posting…" : "Reply"}
        </Button>
      </div>
    </div>
  );
}

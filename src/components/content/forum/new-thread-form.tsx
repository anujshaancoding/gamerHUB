"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { ForumCategoryRow } from "@/lib/pro/forum-queries";

const POST_TYPES = [
  { id: "discussion",   label: "Discussion" },
  { id: "question",     label: "Question" },
  { id: "guide",        label: "Guide" },
  { id: "lfg",          label: "LFG" },
];

export function NewThreadForm({ categories, preselected }: { categories: ForumCategoryRow[]; preselected?: string }) {
  const router = useRouter();
  const initial = preselected ? categories.find((c) => c.slug === preselected)?.id ?? categories[0]?.id ?? "" : categories[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(initial);
  const [postType, setPostType] = useState("discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (title.trim().length < 5) return setError("Title must be at least 5 characters.");
    if (content.trim().length < 10) return setError("Body must be at least 10 characters.");
    if (!categoryId) return setError("Pick a section.");

    setSubmitting(true);
    try {
      const tags = tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
      const res = await fetch("/api/forums/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, title: title.trim(), content: content.trim(), postType, tags }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to publish");
        return;
      }
      router.push(`/forum/${json.categorySlug}/${json.slug}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Section</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Type</span>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
          >
            {POST_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Title (5–200 chars)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="A clear, specific title…"
          className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Body</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Make your case, share your setup, ask away — whatever the section is for."
          className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text resize-y focus:outline-none focus:border-primary/50"
        />
      </label>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Tags (comma-separated, up to 5)</span>
        <input
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="ranked, sens, scrims"
          className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        />
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end">
        <Button variant="primary" onClick={submit} disabled={submitting}>
          {submitting ? "Publishing…" : "Publish thread"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  is_locked: boolean;
}

interface PostEditorProps {
  categories: Category[];
  initialCategoryId?: string;
  onSubmit: (data: {
    categoryId: string;
    title: string;
    content: string;
    postType: string;
    tags: string[];
  }) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

const postTypes = [
  { value: "discussion", label: "Discussion" },
  { value: "question", label: "Question" },
  { value: "guide", label: "Guide" },
  { value: "lfg", label: "Looking for Group" },
];

export function PostEditor({
  categories,
  initialCategoryId,
  onSubmit,
  isSubmitting,
  onCancel,
}: PostEditorProps) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const availableCategories = categories.filter((c) => !c.is_locked);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim() || !content.trim()) return;

    onSubmit({
      categoryId,
      title: title.trim(),
      content: content.trim(),
      postType,
      tags,
    });
  };

  const isValid = categoryId && title.trim().length >= 5 && content.trim().length >= 10;

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category & Type Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Post Type</label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title..."
            className="bg-zinc-800 border-zinc-700"
            maxLength={200}
          />
          <p className="text-xs text-zinc-500">{title.length}/200 characters</p>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content..."
            className="bg-zinc-800 border-zinc-700 min-h-[200px]"
          />
          <p className="text-xs text-zinc-500">
            Supports markdown formatting. Minimum 10 characters.
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Tags (optional, max 5)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-zinc-800 text-zinc-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {tags.length < 5 && (
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="bg-zinc-800 border-zinc-700 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Posting...
              </>
            ) : (
              "Create Post"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

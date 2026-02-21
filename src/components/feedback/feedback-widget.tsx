"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, ImagePlus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "bug", label: "Bug", emoji: "🐛" },
  { value: "feature", label: "Idea", emoji: "💡" },
  { value: "design", label: "Design", emoji: "🎨" },
  { value: "general", label: "Other", emoji: "💬" },
] as const;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const reset = () => {
    setMessage("");
    setCategory("general");
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if attached
      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() || "png";
        const path = `feedback/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("media")
          .upload(path, imageFile, { cacheControl: "31536000", upsert: false });

        if (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          // Continue without image — feedback text is more important
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("media").getPublicUrl(path);
          imageUrl = publicUrl;
        }
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          image_url: imageUrl,
          page_url: pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send feedback");
      }

      toast.success("Thanks for your feedback!");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-700 hover:shadow-purple-500/40 active:scale-95"
        aria-label="Send feedback"
      >
        {open ? (
          <X className="h-4 w-4" />
        ) : (
          <MessageSquarePlus className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{open ? "Close" : "Feedback"}</span>
      </button>

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-zinc-700/50 bg-zinc-900 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-sm font-semibold text-white">Send Feedback</p>
            <p className="text-xs text-zinc-400">
              Help us improve — bugs, ideas, anything!
            </p>
          </div>

          {/* Body */}
          <div className="space-y-3 p-4">
            {/* Category pills */}
            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    category === c.value
                      ? "bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/40"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Attached"
                  className="h-24 w-full rounded-lg border border-zinc-700 object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-zinc-300 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  title="Attach screenshot"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Screenshot
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

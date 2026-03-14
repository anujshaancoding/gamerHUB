"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, ImagePlus, Loader2 } from "lucide-react";
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
        const ext = imageFile.name.split(".").pop() || "png";
        const path = `feedback/${Date.now()}.${ext}`;

        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("path", `media/${path}`);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          console.error("Image upload failed:", uploadData.error);
          // Continue without image — feedback text is more important
        } else {
          imageUrl = uploadData.publicUrl;
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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-text shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
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
        <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-border/50 bg-surface shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text">Send Feedback</p>
            <p className="text-xs text-text-muted">
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
                      ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                      : "bg-surface-light text-text-muted hover:text-text-secondary"
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
              className="w-full resize-none rounded-lg border border-border bg-surface-light/50 px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Attached"
                  className="h-24 w-full rounded-lg border border-border object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-text-secondary hover:text-text"
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
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-light hover:text-text-secondary"
                  title="Attach screenshot"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Screenshot
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-text transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
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

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { EmojiPicker } from "./emoji-picker";
import { optimizedUpload, createPreview } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (content: string, type?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  currentUserId: string;
}

export function MessageInput({
  onSend,
  onTyping,
  disabled,
  currentUserId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 120; // ~4 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleTyping = useCallback(() => {
    if (!onTyping) return;
    onTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  }, [onTyping]);

  const handleSend = async () => {
    if (sending || disabled) return;

    // Send image if attached
    if (imageFile) {
      setSending(true);
      setUploading(true);
      try {
        const result = await optimizedUpload(
          imageFile,
          "media",
          currentUserId
        );
        await onSend(result.publicUrl, "image");
        setImagePreview(null);
        setImageFile(null);
      } catch (err) {
        console.error("Image upload error:", err);
        toast.error(err instanceof Error ? err.message : "Failed to send image");
      } finally {
        setSending(false);
        setUploading(false);
      }
      return;
    }

    // Send text
    const text = message.trim();
    if (!text) return;

    setSending(true);
    try {
      await onSend(text, "text");
      setMessage("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping?.(false);
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, GIF, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    try {
      setImageFile(file);
      const preview = await createPreview(file);
      setImagePreview(preview);
    } catch {
      toast.error("Failed to load image preview");
      setImageFile(null);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = (message.trim().length > 0 || imageFile) && !sending && !disabled;

  return (
    <div className="border-t border-border/30 bg-surface/80 backdrop-blur-xl">
      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-auto rounded-lg border border-border/30"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 p-1 bg-error rounded-full text-white hover:bg-error/80 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-text-muted hover:text-accent transition-colors flex-shrink-0"
          title="Attach image"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Emoji button */}
        <EmojiPicker onSelect={handleEmojiSelect} />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            rows={1}
            className={cn(
              "w-full resize-none bg-surface-light/50 backdrop-blur-sm text-text text-sm",
              "border border-border/30 rounded-xl px-4 py-2.5",
              "focus:outline-none focus:border-primary/50 focus:shadow-[0_0_12px_rgba(0,255,136,0.08)]",
              "placeholder:text-text-muted/50 transition-all",
              "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
            )}
          />
        </div>

        {/* Send button */}
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0"
        >
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "rounded-xl h-10 w-10 p-0 transition-all",
              canSend
                ? "bg-primary text-background hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:bg-primary/90"
                : "bg-surface-light text-text-muted"
            )}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

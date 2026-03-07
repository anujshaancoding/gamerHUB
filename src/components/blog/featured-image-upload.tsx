"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeaturedImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  authorId?: string;
}

export function FeaturedImageUpload({ value, onChange, authorId }: FeaturedImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
      const timestamp = Date.now();
      const storagePath = authorId
        ? `blog/${authorId}/${timestamp}.${ext}`
        : `blog/thumbnails/${timestamp}.${ext}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", storagePath);
      if (value && value.startsWith("/uploads/")) {
        const oldPath = value.split("/uploads/")[1]?.split("?")[0];
        if (oldPath) formData.append("oldPath", oldPath);
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
        Featured Image
      </label>

      {/* Upload area */}
      <div className="flex gap-3 mb-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload below"
          className="flex-1 px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="relative inline-block mt-1">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-auto rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

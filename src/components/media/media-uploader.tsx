"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Image,
  Video,
  X,
  Gamepad2,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { SUPPORTED_GAMES } from "@/lib/constants/games";
import { optimizedMediaUpload, createPreview } from "@/lib/upload";

interface MediaUploaderProps {
  onSuccess: () => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (will be compressed)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function MediaUploader({ onSuccess }: MediaUploaderProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "",
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate file type
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video file");
      return;
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (selectedFile.size > maxSize) {
      setError(
        `File too large. Maximum size: ${isVideo ? "50MB" : "10MB"}`
      );
      return;
    }

    setFile(selectedFile);
    setPreview(await createPreview(selectedFile));
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setLoading(true);
    setError(null);

    try {
      const isImage = file.type.startsWith("image/");

      let url: string;
      let thumbnailUrl: string | null = null;
      let fileSize: number;

      if (isImage) {
        // Compress, convert to WebP, and generate thumbnail
        const result = await optimizedMediaUpload(file, user.id);
        url = result.image.publicUrl;
        thumbnailUrl = result.thumbnail.publicUrl;
        fileSize = result.image.fileSize;
      } else {
        // Videos: upload as-is (no compression)
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        url = publicUrl;
        fileSize = file.size;
      }

      // Get game ID
      let gameId: string | null = null;
      if (formData.game) {
        const { data: game } = await supabase
          .from("games")
          .select("id")
          .eq("slug", formData.game)
          .single();
        gameId = (game as { id: string } | null)?.id ?? null;
      }

      // Create media record
      const { error: mediaError } = await supabase.from("media").insert({
        user_id: user.id,
        game_id: gameId,
        type: isImage ? "image" : "video",
        url,
        thumbnail_url: thumbnailUrl,
        title: formData.title || null,
        description: formData.description || null,
        file_size: fileSize,
        is_public: true,
      } as never);

      if (mediaError) throw mediaError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      {!file ? (
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-text-muted">
            Images (PNG, JPG, GIF) up to 10MB — auto-compressed to WebP
          </p>
          <p className="text-sm text-text-muted">
            Videos (MP4, WebM) up to 50MB
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-light">
            {file.type.startsWith("video/") ? (
              <video
                src={preview || undefined}
                className="w-full h-full object-contain"
                controls
              />
            ) : (
              <img
                src={preview || undefined}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-error/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
            {file.type.startsWith("video/") ? (
              <Video className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <span>{file.name}</span>
            <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        </div>
      )}

      {/* Form */}
      {file && (
        <>
          <Input
            label="Title"
            placeholder="Give your media a title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <Textarea
            label="Description"
            placeholder="Add a description..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
          />

          <Select
            label="Game (Optional)"
            options={[
              { value: "", label: "No game selected" },
              ...SUPPORTED_GAMES.map((g) => ({ value: g.slug, label: g.name })),
            ]}
            value={formData.game}
            onChange={(e) =>
              setFormData({ ...formData, game: e.target.value })
            }
          />
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={clearFile}
          disabled={!file || loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          isLoading={loading}
          className="flex-1"
        >
          Upload
        </Button>
      </div>
    </div>
  );
}

-- Tighten storage bucket limits now that all uploads are compressed to WebP client-side.
-- Previous limit was 50 MB (way too generous for images).
-- New limit: 5 MB per file — images are compressed to <1 MB before upload,
-- so this is a safety net, not a bottleneck. Videos remain unsupported at bucket level.

UPDATE storage.buckets
SET
  file_size_limit = 5242880,  -- 5 MB
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
WHERE id = 'media';

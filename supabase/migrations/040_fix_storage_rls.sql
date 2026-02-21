-- Fix storage RLS policies to allow all authenticated upload paths
-- The previous policy only allowed 'avatars/{user_id}/' and 'banners/{user_id}/'
-- but the app also uploads clan media, general media, etc.

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;

-- New INSERT policy: authenticated users can upload to the 'media' bucket
-- as long as their user ID is part of the path (for ownership)
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (
    -- Profile avatars/banners: avatars/{user_id}/... or banners/{user_id}/...
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Clan media: clan-avatars/{clan_id}-... or clan-banners/{clan_id}-...
    -- (clan ownership is enforced at API level, not storage level)
    (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR
    -- General media uploads: {user_id}/...
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Drop and recreate UPDATE policy to also cover clan media
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Drop and recreate DELETE policy to also cover clan media
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

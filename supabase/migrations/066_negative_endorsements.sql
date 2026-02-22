-- Negative Endorsements for Premium+ Users
-- Migration: 066_negative_endorsements.sql
-- Adds negative endorsement support to the trait endorsement system

-- Add endorsement type column (positive or negative)
ALTER TABLE public.trait_endorsements
ADD COLUMN IF NOT EXISTS endorsement_type VARCHAR(10) DEFAULT 'positive'
  CHECK (endorsement_type IN ('positive', 'negative'));

-- Add negative trait columns (mirror of positive traits)
ALTER TABLE public.trait_endorsements
ADD COLUMN IF NOT EXISTS toxic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quitter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uncooperative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uncommunicative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unreliable BOOLEAN DEFAULT false;

-- Index for filtering by endorsement type
CREATE INDEX IF NOT EXISTS idx_trait_endorsements_type
  ON public.trait_endorsements(endorsement_type);

-- Add editor_notes column to blog_posts for editor suggestions
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS editor_notes TEXT;

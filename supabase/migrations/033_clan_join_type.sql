-- Add CoC-style join types and clan progression
-- Migration: 033_clan_join_type.sql

-- Add join_type column: open (anyone joins), invite_only (officers invite), closed (request + approve)
ALTER TABLE public.clans ADD COLUMN join_type VARCHAR(20) DEFAULT 'closed'
  CHECK (join_type IN ('open', 'invite_only', 'closed'));

-- Add clan progression
ALTER TABLE public.clans ADD COLUMN clan_level INT DEFAULT 1;
ALTER TABLE public.clans ADD COLUMN clan_xp INT DEFAULT 0;

-- Index for filtering by join type
CREATE INDEX idx_clans_join_type ON clans(join_type);

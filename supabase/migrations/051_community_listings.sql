-- Community Listings (Tournaments & Giveaways)
-- Lightweight announcement board for tournaments/giveaways organized by
-- YouTubers, pros, or any community member.

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.community_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,

  -- Type: tournament or giveaway
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('tournament', 'giveaway')),

  -- Organizer info (could be a YouTuber, pro, anyone)
  organizer_name VARCHAR(100),
  organizer_url TEXT,

  -- Time period
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',

  -- Rules
  rules TEXT,
  external_link TEXT,
  prize_description TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- Engagement
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Winners table (many winners per listing)
CREATE TABLE public.community_listing_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- For winners who may not be on the platform
  display_name VARCHAR(100) NOT NULL,
  placement INTEGER,
  prize_awarded TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE public.community_listing_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_community_listings_creator ON community_listings(creator_id);
CREATE INDEX idx_community_listings_game ON community_listings(game_id);
CREATE INDEX idx_community_listings_type ON community_listings(listing_type);
CREATE INDEX idx_community_listings_status ON community_listings(status);
CREATE INDEX idx_community_listings_active ON community_listings(status, starts_at DESC) WHERE status = 'active';
CREATE INDEX idx_community_listings_created ON community_listings(created_at DESC);

CREATE INDEX idx_listing_winners_listing ON community_listing_winners(listing_id);
CREATE INDEX idx_listing_winners_user ON community_listing_winners(user_id);

CREATE INDEX idx_listing_bookmarks_listing ON community_listing_bookmarks(listing_id);
CREATE INDEX idx_listing_bookmarks_user ON community_listing_bookmarks(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_listing_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_listing_bookmarks ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Active listings are viewable by everyone"
  ON community_listings FOR SELECT
  USING (status IN ('active', 'completed') OR creator_id = auth.uid());

CREATE POLICY "Users can create listings"
  ON community_listings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their listings"
  ON community_listings FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their listings"
  ON community_listings FOR DELETE
  USING (creator_id = auth.uid());

-- Winners policies
CREATE POLICY "Winners are viewable by everyone"
  ON community_listing_winners FOR SELECT
  USING (true);

CREATE POLICY "Listing creators can manage winners"
  ON community_listing_winners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

CREATE POLICY "Listing creators can update winners"
  ON community_listing_winners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

CREATE POLICY "Listing creators can delete winners"
  ON community_listing_winners FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON community_listing_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark listings"
  ON community_listing_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their bookmarks"
  ON community_listing_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_community_listings_updated_at
  BEFORE UPDATE ON community_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add template and color palette columns to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'classic' NOT NULL,
  ADD COLUMN IF NOT EXISTS color_palette TEXT DEFAULT 'neon_surge' NOT NULL;

-- Add check constraints for valid values
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_template_check CHECK (
    template IN ('classic', 'magazine', 'cyberpunk', 'minimal', 'card_grid', 'gaming_stream')
  ),
  ADD CONSTRAINT blog_posts_color_palette_check CHECK (
    color_palette IN ('neon_surge', 'crimson_fire', 'ocean_depth', 'phantom_violet', 'arctic_frost', 'toxic_waste')
  );

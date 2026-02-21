export type GameSlug = 'valorant' | 'bgmi' | 'freefire';

export type NewsCategory = 'patch' | 'tournament' | 'event' | 'update' | 'roster' | 'meta' | 'general';

export type NewsRegion = 'india' | 'asia' | 'sea' | 'global';

export type NewsStatus = 'pending' | 'approved' | 'rejected' | 'published';

export type NewsSourceType = 'rss' | 'api' | 'scraper';

export interface NewsSource {
  id: string;
  name: string;
  slug: string;
  source_type: NewsSourceType;
  url: string;
  game_slug: GameSlug;
  region: NewsRegion;
  is_active: boolean;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  source_id: string | null;
  external_id: string | null;
  original_title: string;
  original_url: string;
  original_content: string | null;
  original_published_at: string | null;
  title: string;
  summary: string | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  game_slug: GameSlug;
  category: NewsCategory;
  region: NewsRegion;
  tags: string[];
  ai_relevance_score: number;
  ai_processed: boolean;
  ai_processing_error: string | null;
  status: NewsStatus;
  moderated_by: string | null;
  moderated_at: string | null;
  rejection_reason: string | null;
  views_count: number;
  published_at: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  source?: NewsSource;
}

export interface NewsFetchLog {
  id: string;
  source_id: string;
  status: 'started' | 'completed' | 'failed';
  articles_found: number;
  articles_new: number;
  articles_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface NewsFilters {
  game?: GameSlug;
  category?: NewsCategory;
  region?: NewsRegion;
  search?: string;
  featured?: boolean;
}

export const NEWS_CATEGORIES: Record<NewsCategory, { label: string; color: string }> = {
  patch: { label: 'Patch Notes', color: 'green' },
  tournament: { label: 'Tournament', color: 'purple' },
  event: { label: 'Event', color: 'blue' },
  update: { label: 'Update', color: 'cyan' },
  roster: { label: 'Roster', color: 'orange' },
  meta: { label: 'Meta', color: 'yellow' },
  general: { label: 'General', color: 'gray' },
};

export const NEWS_REGIONS: Record<NewsRegion, { label: string }> = {
  india: { label: 'India' },
  asia: { label: 'Asia' },
  sea: { label: 'Southeast Asia' },
  global: { label: 'Global' },
};

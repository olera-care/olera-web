-- 021: Add Google review snippet storage + page view tracking
-- Supports tiered refresh strategy for cost-efficient Google Places API usage

-- JSONB column to cache Google review data (rating, count, 2 reviews)
-- Updated by monthly cron + on-demand backfill
ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS google_reviews_data JSONB DEFAULT NULL;

-- Tracks when a provider page was last viewed (server-rendered)
-- Powers Tier 2 refresh: only refresh providers visited in last 30 days
-- Debounced: only updated if >24h stale to avoid write spam
ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ DEFAULT NULL;

-- Index for tiered cron queries:
-- Tier 1: claimed providers needing refresh
-- Tier 2: recently viewed providers needing refresh
-- Tier 3: long-tail providers needing quarterly refresh
CREATE INDEX IF NOT EXISTS idx_providers_google_review_refresh
  ON "olera-providers" (place_id, last_viewed_at)
  WHERE place_id IS NOT NULL AND deleted = false;

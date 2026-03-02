-- Migration: Create reviews table for provider reviews
-- Families leave reviews on provider pages. Published immediately.
-- Status field supports future moderation workflow.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  reviewer_name TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL CHECK (char_length(comment) >= 50),
  relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'under_review', 'rejected', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_account ON reviews(account_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- One review per user per provider (excluding removed)
CREATE UNIQUE INDEX idx_reviews_unique_per_user
  ON reviews(provider_id, account_id)
  WHERE status != 'removed';

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published reviews"
  ON reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

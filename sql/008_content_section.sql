-- Add section column to content_articles
-- Allows articles to be categorized into different site sections:
--   'caregiver-support' (default) — educational blog
--   'research-and-press' — company news, research, announcements

ALTER TABLE content_articles
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'caregiver-support';

-- Index for efficient section-based queries
CREATE INDEX IF NOT EXISTS idx_content_articles_section
  ON content_articles (section);

-- Composite index for public listing queries (section + status + published_at)
CREATE INDEX IF NOT EXISTS idx_content_articles_section_status_published
  ON content_articles (section, status, published_at DESC);

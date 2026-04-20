-- Add reviewed_at timestamp to content_articles.
--
-- Unlike updated_at (which bumps on any admin edit — dirty signal), reviewed_at
-- only gets set when admin explicitly marks an article as medically reviewed
-- via the "Mark as reviewed" button or a direct date-picker edit. This is the
-- field the public byline reads to claim "Verified [date]" truthfully.
ALTER TABLE content_articles
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

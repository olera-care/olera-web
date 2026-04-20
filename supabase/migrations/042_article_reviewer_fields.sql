-- Add reviewer (verified by) fields to content_articles.
--
-- Originally authored by Chantel (0dd777b6) as migration 019; renumbered to 042
-- to slot after current staging head (041) and avoid collision with the existing
-- 019_medjobs_foundation.sql.
ALTER TABLE content_articles
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS reviewer_role text;

-- Seed Dr. Logan DuBose as medical reviewer on the Texas pay-for-care guide.
-- Other articles fall back to the hardcoded default in the page renderer until
-- admin explicitly assigns a reviewer via /admin/content/[articleId].
UPDATE content_articles
SET
  reviewer_name = 'Dr. Logan DuBose',
  reviewer_role = 'Co-founder & MD',
  updated_at = now()
WHERE slug = 'how-to-pay-for-senior-care-in-texas'
  AND reviewer_name IS NULL;

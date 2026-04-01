-- Add reviewer (verified by) fields to content_articles
ALTER TABLE content_articles
  ADD COLUMN IF NOT EXISTS reviewer_name text,
  ADD COLUMN IF NOT EXISTS reviewer_role text;

-- Set author and reviewer for "how-to-pay-for-senior-care-in-texas"
UPDATE content_articles
SET
  author_name = 'TJ Falohun',
  author_role = 'Co-founder & CEO',
  author_avatar = '/images/for-providers/team/tj.jpg',
  reviewer_name = 'Dr. Logan DuBose',
  reviewer_role = 'Co-founder & MD',
  updated_at = now()
WHERE slug = 'how-to-pay-for-senior-care-in-texas';

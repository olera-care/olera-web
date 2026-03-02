-- Remove the 50-character minimum on review comments to reduce friction
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_comment_check;

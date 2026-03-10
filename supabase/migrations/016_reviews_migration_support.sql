-- Migration: Prepare reviews table for v1.0 data import
-- - Make account_id nullable (migrated reviews have no v2.0 account)
-- - Make relationship nullable (v1.0 didn't track this)
-- - Add migration_source column to distinguish imported vs organic reviews

-- Allow NULL account_id for migrated reviews
ALTER TABLE reviews ALTER COLUMN account_id DROP NOT NULL;

-- Allow NULL relationship for migrated reviews
ALTER TABLE reviews ALTER COLUMN relationship DROP NOT NULL;

-- Track where reviews came from (NULL = organic v2.0, 'olera_v1' = imported)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS migration_source TEXT;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_reviews_migration_source ON reviews(migration_source)
  WHERE migration_source IS NOT NULL;

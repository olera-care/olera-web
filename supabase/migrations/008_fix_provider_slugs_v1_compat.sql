-- Fix Provider Slugs — v1.0 Compatibility
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Created: 2026-03-09
-- Purpose: Regenerate slugs to match v1.0's algorithm so existing indexed URLs
--          continue to work after DNS cutover.
--
-- v1.0 algorithm (reverse-engineered from sitemap + live pages):
--   1. slugify(provider_name) — if unique, done
--   2. slugify(provider_name) + "-" + lower(state) — if unique, done
--   3. slugify(provider_name) + "-" + lower(state) + "-" + slugify(city) — final
--
-- v2.0's 007_provider_slugs.sql always appended state, breaking ~60% of URLs.

-- ============================================
-- STEP 0: BACKUP current slugs (safety net)
-- ============================================

ALTER TABLE "olera-providers" ADD COLUMN IF NOT EXISTS slug_v2_backup TEXT;

UPDATE "olera-providers"
SET slug_v2_backup = slug
WHERE slug IS NOT NULL AND slug_v2_backup IS NULL;

-- ============================================
-- STEP 0.5: DROP existing unique index
-- (must happen before Step 1 creates temporary duplicates)
-- ============================================

DROP INDEX IF EXISTS idx_olera_providers_slug;

-- ============================================
-- HELPER: slugify function
-- ============================================

CREATE OR REPLACE FUNCTION slugify_text(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(COALESCE(input, '')),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 1: Generate name-only slugs for all
-- ============================================

UPDATE "olera-providers"
SET slug = slugify_text(provider_name)
WHERE (deleted IS NULL OR deleted = false)
  AND provider_name IS NOT NULL;

-- ============================================
-- STEP 2: For duplicate name-only slugs,
--         append state abbreviation
-- ============================================

-- Find which slugs have duplicates
WITH dupes AS (
  SELECT slug
  FROM "olera-providers"
  WHERE (deleted IS NULL OR deleted = false)
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE "olera-providers" p
SET slug = slugify_text(p.provider_name)
         || CASE WHEN p.state IS NOT NULL
                 THEN '-' || lower(p.state)
                 ELSE '' END
FROM dupes d
WHERE p.slug = d.slug
  AND (p.deleted IS NULL OR p.deleted = false);

-- ============================================
-- STEP 3: For STILL-duplicate slugs (same name
--         + same state = franchise locations),
--         append city
-- ============================================

WITH dupes AS (
  SELECT slug
  FROM "olera-providers"
  WHERE (deleted IS NULL OR deleted = false)
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE "olera-providers" p
SET slug = slugify_text(p.provider_name)
         || CASE WHEN p.state IS NOT NULL
                 THEN '-' || lower(p.state)
                 ELSE '' END
         || CASE WHEN p.city IS NOT NULL
                 THEN '-' || slugify_text(p.city)
                 ELSE '' END
FROM dupes d
WHERE p.slug = d.slug
  AND (p.deleted IS NULL OR p.deleted = false);

-- ============================================
-- STEP 4: Handle any remaining edge-case dupes
--         (same name, state, city) with numeric suffix
-- ============================================

WITH ranked AS (
  SELECT
    provider_id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY provider_id) AS rn
  FROM "olera-providers"
  WHERE (deleted IS NULL OR deleted = false)
    AND slug IS NOT NULL
)
UPDATE "olera-providers" p
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE p.provider_id = ranked.provider_id
  AND ranked.rn > 1;

-- ============================================
-- STEP 5: Recreate unique index
-- ============================================

CREATE UNIQUE INDEX idx_olera_providers_slug
  ON "olera-providers" (slug)
  WHERE slug IS NOT NULL;

-- ============================================
-- STEP 6: Cleanup helper function
-- ============================================

DROP FUNCTION IF EXISTS slugify_text(TEXT);

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================

-- Check sample slugs match v1.0 format:
-- SELECT provider_name, city, state, slug, slug_v2_backup
-- FROM "olera-providers"
-- WHERE provider_name IN ('Ready2Nurse Home Health', 'Home Instead', 'Caring Hands Caregivers', 'TheKey')
--   AND (deleted IS NULL OR deleted = false)
-- ORDER BY provider_name, city;

-- Check for remaining duplicates (should be 0):
-- SELECT slug, COUNT(*)
-- FROM "olera-providers"
-- WHERE slug IS NOT NULL AND (deleted IS NULL OR deleted = false)
-- GROUP BY slug
-- HAVING COUNT(*) > 1;

-- Count null slugs (should be 0 for non-deleted):
-- SELECT COUNT(*) FROM "olera-providers"
-- WHERE slug IS NULL AND (deleted IS NULL OR deleted = false);

-- Compare old vs new for a franchise:
-- SELECT provider_name, city, state, slug, slug_v2_backup
-- FROM "olera-providers"
-- WHERE provider_name = 'Home Instead'
--   AND (deleted IS NULL OR deleted = false)
-- ORDER BY state, city
-- LIMIT 20;

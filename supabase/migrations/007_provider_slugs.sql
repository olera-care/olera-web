-- Provider Slugs Migration
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Created: 2026-03-01
-- Purpose: Add human-readable URL slugs to olera-providers table
--
-- Pattern: {slugified-name}-{state-abbrev-lowercase}
-- Example: "Accel at College Station" + "TX" → "accel-at-college-station-tx"

-- ============================================
-- 1. ADD SLUG COLUMN
-- ============================================

ALTER TABLE "olera-providers" ADD COLUMN IF NOT EXISTS slug TEXT;

-- ============================================
-- 2. GENERATE SLUGS FROM PROVIDER NAME + STATE
-- ============================================

-- Step 2a: Generate initial slugs (name + state)
UPDATE "olera-providers"
SET slug = concat(
  -- Slugify the provider name: lowercase, replace non-alphanumeric with hyphens,
  -- collapse multiple hyphens, trim leading/trailing hyphens
  regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(provider_name),
        '[^a-z0-9]+', '-', 'g'    -- non-alphanumeric → hyphen
      ),
      '-+', '-', 'g'              -- collapse multiple hyphens
    ),
    '^-|-$', '', 'g'              -- trim leading/trailing hyphens
  ),
  -- Append state abbreviation if present
  CASE WHEN state IS NOT NULL THEN '-' || lower(state) ELSE '' END
)
WHERE slug IS NULL;

-- ============================================
-- 3. HANDLE DUPLICATE SLUGS
-- Append -2, -3, etc. for providers with identical slugs
-- ============================================

WITH ranked AS (
  SELECT
    provider_id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY provider_id) AS rn
  FROM "olera-providers"
  WHERE slug IS NOT NULL
)
UPDATE "olera-providers" p
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE p.provider_id = ranked.provider_id
  AND ranked.rn > 1;

-- ============================================
-- 4. CREATE UNIQUE INDEX FOR FAST LOOKUPS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_olera_providers_slug
  ON "olera-providers" (slug)
  WHERE slug IS NOT NULL;

-- ============================================
-- 5. VERIFICATION QUERIES (run these to check)
-- ============================================

-- Check a sample of generated slugs:
-- SELECT provider_id, provider_name, state, slug
-- FROM "olera-providers"
-- ORDER BY provider_name
-- LIMIT 20;

-- Check for any remaining duplicates (should be 0):
-- SELECT slug, COUNT(*)
-- FROM "olera-providers"
-- WHERE slug IS NOT NULL
-- GROUP BY slug
-- HAVING COUNT(*) > 1;

-- Check null slugs (should be 0):
-- SELECT COUNT(*) FROM "olera-providers" WHERE slug IS NULL;

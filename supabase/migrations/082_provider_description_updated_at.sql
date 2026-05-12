-- Migration 082: description_updated_at column on olera-providers
--
-- Adds a per-provider timestamp recording when provider_description was last
-- (re)written, so the sitemaps (app/sitemap.ts and app/api/sitemap/route.ts)
-- can emit an honest <lastmod>. Today every provider URL is emitted with
-- lastModified = new Date() on every fetch — i.e. "this page changed right now"
-- for all ~75K pages, every time — which is a lie Google has long since learned
-- to ignore. After regenerating ~21K boilerplate descriptions on 2026-05-11
-- (see SCRATCHPAD, Project 6) we want the sitemap to tell Google "these 21K
-- pages just changed, recrawl them" and leave the rest alone.
--
-- Sitemap reads: lastModified = COALESCE(description_updated_at, cleansed_at, created_at).
--
-- The codebase has no migration tracker; migrations are applied by hand via the
-- Supabase dashboard SQL editor (NOT the CLI). Run this BEFORE the sitemap code
-- change reaches production — the sitemap code probes for this column and falls
-- back to the old behavior if it's missing, so the order is forgiving, but
-- "column present, code shipped" is the intended end state.
--
-- Additive + nullable: safe for the shared iOS Supabase instance.

ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS description_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN "olera-providers".description_updated_at IS
  'When provider_description was last (re)generated. Set by scripts/backfill-provider-descriptions.js and the city pipeline desc step; consumed by the sitemaps for <lastmod>. NULL = never explicitly tracked (sitemap falls back to cleansed_at / created_at).';

-- One-time backfill: every provider whose original description was preserved in
-- provider_description_v1_backup was rewritten by the Project 6 backfill (or an
-- earlier regen) — stamp those as recently updated so Google prioritizes
-- recrawling them. Rows with no backup keep description_updated_at = NULL and
-- the sitemap falls back to cleansed_at / created_at.
UPDATE "olera-providers"
  SET description_updated_at = NOW()
  WHERE provider_description_v1_backup IS NOT NULL
    AND description_updated_at IS NULL;

-- 022: Add CMS (Medicare) quality data column
-- Stores federal quality ratings from Home Health Compare, Nursing Home Compare, and Hospice Compare
-- Matched by provider name + ZIP against CMS datasets (~30% match rate)

ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS cms_data JSONB DEFAULT NULL;

-- Index for browse page queries that need CMS data
CREATE INDEX IF NOT EXISTS idx_providers_cms_data
  ON "olera-providers" USING gin (cms_data)
  WHERE cms_data IS NOT NULL;

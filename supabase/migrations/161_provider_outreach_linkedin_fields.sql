-- Migration: Add LinkedIn lookup fields to provider_outreach_tracking
--
-- Context: Bottom funnel re-engagement page uses LinkedIn company page
-- scraping to find decision-maker contacts. These columns store the
-- result of the linkedin-finder endpoint.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_found_at TIMESTAMPTZ;

-- Index for filtering providers that have/don't have LinkedIn
CREATE INDEX IF NOT EXISTS idx_provider_outreach_linkedin_url
  ON provider_outreach_tracking (linkedin_url)
  WHERE linkedin_url IS NOT NULL;

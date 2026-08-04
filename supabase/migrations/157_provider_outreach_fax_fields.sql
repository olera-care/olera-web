-- Migration: Add fax lookup fields to provider_outreach_tracking
--
-- Context: Bottom funnel re-engagement needs fax number lookup.
-- These store the result of the fax-number finder.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS fax_number     TEXT,
  ADD COLUMN IF NOT EXISTS fax_source_url TEXT,
  ADD COLUMN IF NOT EXISTS fax_confidence TEXT,          -- 'high' | 'unsure'
  ADD COLUMN IF NOT EXISTS fax_found_at   TIMESTAMPTZ;

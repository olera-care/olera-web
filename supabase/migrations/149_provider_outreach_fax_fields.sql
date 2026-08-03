-- Add fax lookup fields to provider_outreach_tracking
-- These store the result of the fax-number finder (bottom funnel).
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS fax_number     TEXT,
  ADD COLUMN IF NOT EXISTS fax_source_url TEXT,
  ADD COLUMN IF NOT EXISTS fax_confidence TEXT,          -- 'high' | 'unsure'
  ADD COLUMN IF NOT EXISTS fax_found_at   TIMESTAMPTZ;

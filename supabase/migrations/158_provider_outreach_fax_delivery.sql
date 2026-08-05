-- Migration: Add fax delivery tracking columns to provider_outreach_tracking
--
-- Context: Telnyx fax integration needs columns to track send status,
-- delivery confirmation, and failure reasons. These columns are written
-- by the send-fax API route and updated by the fax-webhook route.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS fax_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fax_sent_by      UUID,
  ADD COLUMN IF NOT EXISTS fax_telnyx_id    TEXT,
  ADD COLUMN IF NOT EXISTS fax_status       TEXT DEFAULT NULL
    CHECK (fax_status IS NULL OR fax_status IN (
      'queued', 'processing', 'sending', 'delivered', 'failed'
    )),
  ADD COLUMN IF NOT EXISTS fax_delivered_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fax_failure_reason TEXT;

-- Index for webhook lookups by Telnyx fax ID
CREATE INDEX IF NOT EXISTS idx_provider_outreach_fax_telnyx_id
  ON provider_outreach_tracking (fax_telnyx_id)
  WHERE fax_telnyx_id IS NOT NULL;

-- Migration: Add direct mail (PostGrid) tracking columns to provider_outreach_tracking
--
-- Context: PostGrid postcard integration needs columns to track send status,
-- delivery confirmation, and the PostGrid postcard ID. These columns are written
-- by the send-mailer API route and updated by the postcard-webhook route.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS mail_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mail_sent_by      UUID,
  ADD COLUMN IF NOT EXISTS mail_postgrid_id  TEXT,
  ADD COLUMN IF NOT EXISTS mail_status       TEXT DEFAULT NULL
    CHECK (mail_status IS NULL OR mail_status IN (
      'draft', 'ready', 'printed', 'in_transit', 'delivered', 'returned', 'cancelled'
    )),
  ADD COLUMN IF NOT EXISTS mail_delivered_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mail_address       TEXT;

-- Index for webhook lookups by PostGrid postcard ID
CREATE INDEX IF NOT EXISTS idx_provider_outreach_mail_postgrid_id
  ON provider_outreach_tracking (mail_postgrid_id)
  WHERE mail_postgrid_id IS NOT NULL;

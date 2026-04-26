-- Migration: Resend webhook events — capture email lifecycle (opens, clicks,
-- bounces, complaints) into a queryable table joined to email_log via resend_id.
--
-- Today email_log records sends + click-through events on tracked links
-- (email_click events on provider_activity), but no opens at all. That makes
-- any iteration on subject lines, preview text, send time, or template copy
-- unmeasurable post-ship.
--
-- This migration ships:
--   1. New email_events table — full event history, one row per webhook delivery
--   2. Denormalized columns on email_log — last-event snapshot for fast queries
--      (e.g. "what's the open rate over 30 days?" stays a flat scan)
--
-- Idempotency is enforced by UNIQUE(svix_id) on email_events. Replays from
-- Resend hit the constraint and are no-ops. The denormalized email_log columns
-- use monotonic UPDATEs in the webhook route so out-of-order events can't
-- move "first" timestamps backward or overwrite a newer last_event_type.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ── Full event history ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  svix_id         TEXT NOT NULL UNIQUE,                    -- idempotency key
  email_log_id    UUID REFERENCES email_log(id) ON DELETE SET NULL,
  resend_id       TEXT NOT NULL,                           -- always present in payload
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'sent', 'delivered', 'delivery_delayed', 'bounced',
    'complained', 'opened', 'clicked', 'failed'
  )),
  occurred_at     TIMESTAMPTZ NOT NULL,                    -- from payload created_at
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload         JSONB NOT NULL DEFAULT '{}',
  link_url        TEXT,                                    -- clicks only
  bounce_type     TEXT,                                    -- bounces only ('hard' / 'soft')
  bounce_reason   TEXT
);

-- Lookup by email_log_id is the dominant pattern (per-email timeline UIs)
CREATE INDEX IF NOT EXISTS idx_email_events_log_id_type
  ON email_events (email_log_id, event_type);

-- Backfill / orphan reconciliation looks up by resend_id
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id
  ON email_events (resend_id);

-- Aggregate queries by event_type over time
CREATE INDEX IF NOT EXISTS idx_email_events_type_occurred
  ON email_events (event_type, occurred_at DESC);

-- Recent-events scans (admin debugging)
CREATE INDEX IF NOT EXISTS idx_email_events_occurred
  ON email_events (occurred_at DESC);

-- RLS: service role only (mirror email_log + provider_activity)
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_events"
  ON email_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Denormalized snapshot on email_log ───────────────────────────────────

ALTER TABLE email_log
  ADD COLUMN IF NOT EXISTS delivered_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_opened_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_clicked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_type   TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at     TIMESTAMPTZ;

-- Indexes for the audit's eventual queries (open rate, bounce hygiene)
CREATE INDEX IF NOT EXISTS idx_email_log_first_opened_at
  ON email_log (first_opened_at) WHERE first_opened_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_log_bounced_at
  ON email_log (bounced_at) WHERE bounced_at IS NOT NULL;

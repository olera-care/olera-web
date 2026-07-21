-- Migration: Provider Outreach Touchpoints (Append-Only Event Log)
--
-- Context: Permanent event log for provider cold outreach. Records every
-- significant action: stage changes, emails, calls, outcomes. Mirrors the
-- student_outreach_touchpoints pattern for consistency across outreach systems.
--
-- Each row is one event: which provider, what happened, details, who did it
-- (null for system/automated events), and when.
--
-- Append-only: UPDATE and DELETE are blocked at the database level via trigger.
-- History cannot be altered once written.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Touchpoints table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_outreach_touchpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References provider_outreach_tracking.provider_id (TEXT, not FK)
  provider_id     TEXT NOT NULL,

  -- What happened
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN (
    'stage_changed',       -- Provider moved between outreach stages
    'email_sent',          -- Outreach email dispatched
    'email_opened',        -- Recipient opened email (webhook)
    'email_clicked',       -- Recipient clicked link in email (webhook)
    'email_replied',       -- Recipient replied to email
    'email_bounced',       -- Email bounced (webhook)
    'call_attempted',      -- Admin attempted a phone call
    'outcome_recorded',    -- Final outcome logged (e.g., claimed, not interested)
    'cycle_started',       -- New outreach cycle/sequence initiated
    'exclusion_toggled'    -- Provider added to or removed from exclusion list
  )),

  -- Flexible payload for event-specific data
  -- Examples:
  --   stage_changed: { "old_stage": "ready", "new_stage": "in_sequence" }
  --   email_sent: { "template_key": "intro", "cadence_day": 0, "recipient": "..." }
  --   call_attempted: { "outcome": "no_answer", "duration_seconds": 45 }
  details         JSONB NOT NULL DEFAULT '{}',

  -- Who triggered this event (null for system/automated events)
  admin_user_id   UUID REFERENCES admin_users(id),

  -- When it happened
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary index: fast lookup of one provider's full history
CREATE INDEX IF NOT EXISTS idx_po_touchpoints_provider
  ON provider_outreach_touchpoints (provider_id, created_at DESC);

-- Secondary: filter by event type across all providers
CREATE INDEX IF NOT EXISTS idx_po_touchpoints_type
  ON provider_outreach_touchpoints (touchpoint_type, created_at DESC);

-- Admin activity lookup
CREATE INDEX IF NOT EXISTS idx_po_touchpoints_admin
  ON provider_outreach_touchpoints (admin_user_id, created_at DESC)
  WHERE admin_user_id IS NOT NULL;

-- ── Append-only enforcement ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION provider_outreach_touchpoints_append_only()
  RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'provider_outreach_touchpoints is append-only (% blocked)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_outreach_touchpoints_no_mutate ON provider_outreach_touchpoints;
CREATE TRIGGER provider_outreach_touchpoints_no_mutate
  BEFORE UPDATE OR DELETE ON provider_outreach_touchpoints
  FOR EACH ROW EXECUTE FUNCTION provider_outreach_touchpoints_append_only();

-- ── RLS: service-role only ────────────────────────────────────────────────

ALTER TABLE provider_outreach_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on provider_outreach_touchpoints"
  ON provider_outreach_touchpoints FOR ALL TO service_role USING (true) WITH CHECK (true);

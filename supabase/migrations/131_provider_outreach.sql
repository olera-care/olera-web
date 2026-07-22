-- Migration: Provider Outreach pipeline
--
-- Separate pipeline from MedJobs staffing_outreach. Tracks direct provider
-- outreach for partnership enrollment (profile claiming, ad boost, premium
-- listings, etc.). Same structural pattern as staffing_outreach but its own
-- tables, state machine, and admin surfaces.
--
-- Tables shipped:
--   - provider_outreach             one row per provider in the pipeline
--   - provider_outreach_touchpoints append-only interaction log
--   - provider_outreach_contacts    verified decision-maker contacts
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Outreach state (one per provider) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_outreach (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         TEXT NOT NULL UNIQUE,           -- references olera-providers.provider_id
  provider_name       TEXT NOT NULL,                   -- denormalized for list display
  provider_category   TEXT,                            -- denormalized from olera-providers
  city                TEXT,
  state               TEXT,                            -- 2-letter abbreviation
  phone               TEXT,                            -- snapshot from olera-providers at load time
  email               TEXT,                            -- snapshot from olera-providers at load time
  website             TEXT,                            -- snapshot from olera-providers at load time
  status              TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN (
                          'queued',
                          'researching',
                          'send_ready',
                          'in_sequence',
                          'paused',
                          'claimed',
                          'not_interested',
                          'do_not_contact'
                        )),
  -- Sequence tracking
  sequence_step       INT,                              -- current step (1-5), null = not started
  sequence_status     TEXT DEFAULT 'pending'
                        CHECK (sequence_status IN (
                          'pending',       -- not yet enrolled
                          'active',        -- SmartLead drip running
                          'paused',        -- paused (replied, clicked, manual)
                          'completed',     -- finished all steps
                          'claimed',       -- provider claimed their page
                          'opted_out'      -- provider asked to stop
                        )),
  -- SmartLead integration
  smartlead_campaign_id INT,                            -- SmartLead campaign this provider belongs to
  smartlead_lead_id     INT,                            -- SmartLead-internal lead id
  -- Engagement signals (updated by webhook)
  email_opens         INT NOT NULL DEFAULT 0,
  email_clicks        INT NOT NULL DEFAULT 0,
  email_replies       INT NOT NULL DEFAULT 0,
  email_bounced       BOOLEAN NOT NULL DEFAULT FALSE,
  last_open_at        TIMESTAMPTZ,
  last_click_at       TIMESTAMPTZ,
  last_reply_at       TIMESTAMPTZ,
  first_email_sent_at TIMESTAMPTZ,
  -- Lead scoring
  lead_score          TEXT DEFAULT 'silent'
                        CHECK (lead_score IN ('hot', 'warm', 'silent', 'dead')),
  -- General fields
  next_action_due_at  TIMESTAMPTZ,
  attempts_count      INT NOT NULL DEFAULT 0,
  last_engagement_at  TIMESTAMPTZ,
  claimed_by          UUID,                            -- admin user holding the row
  claimed_until       TIMESTAMPTZ,
  research_data       JSONB NOT NULL DEFAULT '{}',     -- enriched contact info, notes
  notes               TEXT,
  slug                TEXT,                             -- provider page slug
  viewed_at           TIMESTAMPTZ,                     -- admin last viewed this row
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_outreach_status
  ON provider_outreach (status);

CREATE INDEX IF NOT EXISTS idx_provider_outreach_state
  ON provider_outreach (state);

CREATE INDEX IF NOT EXISTS idx_provider_outreach_due
  ON provider_outreach (next_action_due_at)
  WHERE status NOT IN ('do_not_contact', 'not_interested', 'claimed');

CREATE INDEX IF NOT EXISTS idx_provider_outreach_sequence
  ON provider_outreach (sequence_status, sequence_step)
  WHERE sequence_status = 'active';

CREATE INDEX IF NOT EXISTS idx_provider_outreach_smartlead
  ON provider_outreach (smartlead_campaign_id)
  WHERE smartlead_campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_outreach_provider
  ON provider_outreach (provider_id);

-- ── Touchpoints (append-only event log) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_outreach_touchpoints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id  UUID NOT NULL REFERENCES provider_outreach(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN (
    'research_completed',
    'email_sent',
    'email_opened',
    'email_clicked',
    'email_bounced',
    'call_no_answer',
    'call_voicemail',
    'call_connected',
    'call_not_interested',
    'manual_dnc',
    'reply_received',
    'meeting_scheduled',
    'meeting_held',
    'meeting_no_show',
    'note_added',
    'status_changed',
    'profile_claimed',
    'opted_out'
  )),
  notes        TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_touchpoints_outreach
  ON provider_outreach_touchpoints (outreach_id, created_at DESC);

-- ── Verified contacts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_outreach_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id       UUID NOT NULL REFERENCES provider_outreach(id) ON DELETE CASCADE,
  provider_id       TEXT NOT NULL,
  name              TEXT NOT NULL,
  role              TEXT,
  email             TEXT,
  phone             TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT TRUE,
  consent_given_at  TIMESTAMPTZ,
  consent_source    TEXT CHECK (consent_source IN ('call', 'reply', 'web_form', 'email')),
  consent_notes     TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_contacts_outreach
  ON provider_outreach_contacts (outreach_id);

CREATE INDEX IF NOT EXISTS idx_po_contacts_provider
  ON provider_outreach_contacts (provider_id);

-- ── RLS: service-role only ────────────────────────────────────────────────

ALTER TABLE provider_outreach             ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_outreach_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_outreach_contacts    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on provider_outreach"
  ON provider_outreach FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on provider_outreach_touchpoints"
  ON provider_outreach_touchpoints FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on provider_outreach_contacts"
  ON provider_outreach_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

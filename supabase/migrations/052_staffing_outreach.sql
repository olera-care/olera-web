-- Migration: Staffing Outreach pipeline
--
-- Tables for the high-touch outreach workflow that enrolls home care
-- agencies into the Student Caregiver Pilot Program. Admin team works one
-- "batch" at a time (one batch = one partner university × category), going
-- through pre-call research → call → consent capture → email sequence →
-- magic-link activation → terms acceptance.
--
-- Tables shipped:
--   - staffing_batches      one row per (university, category) campaign
--   - staffing_outreach     one row per provider in a campaign — main state
--   - staffing_touchpoints  append-only log of every interaction
--   - staffing_contacts     verified hiring contacts captured during calls
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Batches ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staffing_batches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_slug    TEXT NOT NULL,                    -- maps to partner-universities.ts
  university_name    TEXT NOT NULL,                    -- denormalized for display
  category           TEXT NOT NULL,                    -- e.g. "Home Care (Non-medical)"
  catchment_cities   JSONB NOT NULL DEFAULT '[]',      -- snapshot at seed time
  status             TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','paused','completed')),
  total_providers    INT NOT NULL DEFAULT 0,
  total_enrolled     INT NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staffing_batches_university
  ON staffing_batches (university_slug);

CREATE INDEX IF NOT EXISTS idx_staffing_batches_status
  ON staffing_batches (status);

-- ── Outreach state (one per provider per batch) ──────────────────────────

CREATE TABLE IF NOT EXISTS staffing_outreach (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            UUID NOT NULL REFERENCES staffing_batches(id) ON DELETE CASCADE,
  provider_id         TEXT NOT NULL,                   -- references olera-providers.provider_id
  status              TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN (
                          'queued',
                          'pre_call_outreach',
                          'calling',
                          'connected_no_consent',
                          'consented',
                          'nurturing',
                          'activated',
                          'enrolled',
                          'do_not_contact',
                          'wrong_number'
                        )),
  next_action_due_at  TIMESTAMPTZ,
  attempts_count      INT NOT NULL DEFAULT 0,
  last_engagement_at  TIMESTAMPTZ,                     -- last open/click on any pilot email
  claimed_by          UUID,                            -- admin user holding the row
  claimed_until       TIMESTAMPTZ,
  research_data       JSONB NOT NULL DEFAULT '{}',     -- { general_email, fax, contact_form_url }
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch_id, provider_id)
);

-- "Today" tab — open work scoped to a batch
CREATE INDEX IF NOT EXISTS idx_staffing_outreach_batch_status
  ON staffing_outreach (batch_id, status);

-- Cron worker scans for due actions across all batches
CREATE INDEX IF NOT EXISTS idx_staffing_outreach_due
  ON staffing_outreach (next_action_due_at)
  WHERE status NOT IN ('do_not_contact','enrolled','wrong_number');

-- Lookup by provider (drawer joins, dedup checks)
CREATE INDEX IF NOT EXISTS idx_staffing_outreach_provider
  ON staffing_outreach (provider_id);

-- "Who's working what right now" indicator
CREATE INDEX IF NOT EXISTS idx_staffing_outreach_claimed
  ON staffing_outreach (claimed_by)
  WHERE claimed_by IS NOT NULL;

-- ── Touchpoints (append-only event log) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS staffing_touchpoints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id  UUID NOT NULL REFERENCES staffing_outreach(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN (
    -- pre-call channels
    'research_completed',
    'pre_call_email_sent',
    'contact_form_submitted',
    'fax_sent',                          -- deferred channel, schema-ready
    'mail_sent',                         -- deferred channel, schema-ready

    -- calls
    'call_no_answer',
    'call_voicemail',
    'call_wrong_number',
    'call_connected_no_consent',
    'call_connected_consent',
    'call_not_interested',               -- soft stop: provider said "no thanks"
    'manual_dnc',                        -- hard stop: provider said "remove me"

    -- automated emails (sequence steps)
    'email_pre_consent_a_sent',
    'email_pre_consent_b_sent',
    'email_post_consent_step1_sent',
    'email_post_consent_step2_sent',
    'email_post_consent_step3_sent',
    'email_post_consent_step4_sent',
    'email_post_consent_step5_sent',
    'email_welcome_sent',
    'email_new_student_trigger_sent',

    -- email lifecycle (mirrored from email_events for the timeline)
    'email_opened',
    'email_clicked',
    'email_bounced',

    -- system events
    'reply_received',                    -- manually flagged for now
    'system_activated',
    'system_enrolled',
    'system_auto_dnc'
  )),
  notes        TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',   -- type-specific details
  created_by   UUID,                          -- admin user (NULL for system events)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drawer history view: chronological per-outreach
CREATE INDEX IF NOT EXISTS idx_staffing_touchpoints_outreach
  ON staffing_touchpoints (outreach_id, created_at DESC);

-- Funnel/event-type aggregations
CREATE INDEX IF NOT EXISTS idx_staffing_touchpoints_type
  ON staffing_touchpoints (type);

-- ── Verified contacts (hiring decision-makers) ───────────────────────────

CREATE TABLE IF NOT EXISTS staffing_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id       UUID NOT NULL REFERENCES staffing_outreach(id) ON DELETE CASCADE,
  provider_id       TEXT NOT NULL,
  name              TEXT NOT NULL,
  role              TEXT,
  email             TEXT NOT NULL,
  phone             TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT TRUE,
  consent_given_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_source    TEXT NOT NULL CHECK (consent_source IN ('call','reply','web_form')),
  consent_notes     TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staffing_contacts_outreach
  ON staffing_contacts (outreach_id);

CREATE INDEX IF NOT EXISTS idx_staffing_contacts_email
  ON staffing_contacts (email);

CREATE INDEX IF NOT EXISTS idx_staffing_contacts_provider
  ON staffing_contacts (provider_id);

-- ── RLS: service-role only (admin pages will go through API routes) ──────

ALTER TABLE staffing_batches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_outreach     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_touchpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_contacts     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on staffing_batches"
  ON staffing_batches FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on staffing_outreach"
  ON staffing_outreach FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on staffing_touchpoints"
  ON staffing_touchpoints FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on staffing_contacts"
  ON staffing_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

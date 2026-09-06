-- Migration: Provider touch log (relationship history across channels)
--
-- Context: by 2026-09-05 Olera had three touchpoint tables and none of them held
-- the conversations that actually converted. provider_outreach_touchpoints is a
-- cold-funnel machine (6,500 rows, four admins, daily use) keyed to the outreach
-- tracking row, with no notion of a text message. ad_campaign_log is per campaign.
-- The warm relationships — Sherry Pace across two flights, Zardy Dweh who prefers
-- text, Hilda who never opens email — lived in TJ's mailbox and iMessage, and were
-- reconstructed from screenshots after the fact. Five of sixteen Ad Boost providers
-- had never had a human touch and nobody could see that from any screen.
--
-- This table is deliberately small. One row per touch, keyed to the provider (the
-- business_profiles row, which is the identity that survives campaigns), channel-
-- agnostic, with exactly one forward-looking pair: next_action and its due date.
--
-- Three decisions worth keeping:
--
--  1. No stage, no pipeline, no score. State is derived from touches at read time
--     (last touch, days quiet, overdue, never had a human touch). Same invariant as
--     the MedJobs CRM (docs/medjobs/OPERATIONAL_BRIEF.md §2.3), which is the part of
--     that system worth copying.
--
--  2. `source` says where a row came from: typed by a person, synced from a mailbox,
--     or emitted by the system. A timeline you trust is one where every row says how
--     it knows. System rows (email_log, ad_campaign_log) are merged at read time and
--     are NOT copied here; this table holds only what would otherwise be lost.
--
--  3. `occurred_at` is separate from `created_at` so a thread can be backfilled from
--     a screenshot without pretending it was logged live.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

CREATE TABLE IF NOT EXISTS provider_touches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  provider_id           UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,

  channel               TEXT NOT NULL,
  direction             TEXT NOT NULL,          -- out = we reached them, in = they reached us
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  summary               TEXT NOT NULL,          -- one line, what happened
  detail                TEXT,                   -- the note, quote, or pasted thread

  -- Who on their side, and the handle used. Free text on purpose: a provider's
  -- answering inbox is often not the one on the profile (Pacesetter: Gmail answers,
  -- Outlook complained).
  contact_name          TEXT,
  contact_handle        TEXT,

  source                TEXT NOT NULL DEFAULT 'manual',
  source_ref            TEXT,                   -- gmail message id, email_log id, etc.

  -- The only forward-looking fields. When a new touch declares a next action, the
  -- API closes the provider's earlier open ones, so "the next action" is always the
  -- latest declared. Done is a timestamp, not a boolean, so it is auditable.
  next_action           TEXT,
  next_action_due       DATE,
  next_action_owner     TEXT,
  next_action_done_at   TIMESTAMPTZ,

  author                TEXT NOT NULL,
  admin_user_id         UUID REFERENCES admin_users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT provider_touches_channel_check CHECK (
    channel IN ('email', 'text', 'call', 'meeting', 'in_app')
  ),
  CONSTRAINT provider_touches_direction_check CHECK (
    direction IN ('out', 'in')
  ),
  CONSTRAINT provider_touches_source_check CHECK (
    source IN ('manual', 'gmail', 'system')
  ),
  -- A due date with no action, or an owner with no action, is noise.
  CONSTRAINT provider_touches_next_action_shape CHECK (
    next_action IS NOT NULL
    OR (next_action_due IS NULL AND next_action_owner IS NULL AND next_action_done_at IS NULL)
  )
);

-- Admin-only, same as ad_campaign_log (migration 202): RLS on, no policies. The
-- server API reads and writes with the service-role client. This table holds
-- provider names, personal phone numbers, and candid notes about people.
ALTER TABLE provider_touches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS provider_touches_provider_idx
  ON provider_touches (provider_id, occurred_at DESC);

-- Powers the Tuesday list: open next actions, sorted by due date.
CREATE INDEX IF NOT EXISTS provider_touches_open_action_idx
  ON provider_touches (next_action_due)
  WHERE next_action IS NOT NULL AND next_action_done_at IS NULL;

COMMENT ON TABLE provider_touches IS
  'One row per human-level touch with a provider on any channel (email, text, call, meeting, in-app), plus the single next action it implies. State (last touch, days quiet, overdue, never contacted) is derived at read time and never stored. System sends live in email_log and are merged at read time, not copied here.';

COMMENT ON COLUMN provider_touches.source IS
  'manual = typed or pasted by a person (including via the /touch command); gmail = synced from a connected mailbox; system = emitted by application code. Every row says how it knows.';

COMMENT ON COLUMN provider_touches.next_action IS
  'What happens next, in one line. Logging a touch with a next action closes the provider''s earlier open ones. Drives the Relationships list and its overdue sort.';

COMMENT ON COLUMN provider_touches.occurred_at IS
  'When the touch happened. Separate from created_at so threads can be backfilled from screenshots without pretending they were logged live.';

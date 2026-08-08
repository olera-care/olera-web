-- Migration: sms_inbound — durable record of every inbound text
--
-- Context: /api/sms/webhook only persisted an inbound SMS when the sender's
-- phone matched a family profile (business_profiles.metadata.sms_inbound, a
-- JSONB array capped at 20 entries). Every text from a provider or an unknown
-- number was discarded outright: no row, no Slack ping, no trace outside
-- Twilio. Since ~82% of our outbound SMS volume goes to providers, that meant
-- we were structurally deaf on the channel we use most. A real provider reply
-- ("I can't open that link, send me the family's details") was lost this way.
--
-- This table is the floor: every inbound message lands here, matched or not.
--
-- Deliberately inbound-only. Twilio already holds a complete, permanent record
-- of both directions, and the admin thread view reads outbound from there, so
-- duplicating outbound here would add a dual-write with no benefit. What Twilio
-- CANNOT hold is the state below: who the sender resolved to, and whether a
-- human has dealt with the message yet.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS sms_inbound (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Twilio's MessageSid. UNIQUE because Twilio retries a webhook it thinks
  -- failed; without this a redelivery would duplicate the message in the inbox.
  twilio_sid    text UNIQUE,

  from_phone    text NOT NULL,          -- as received, E.164 where normalizable
  -- Last 10 digits: the thread key, and the same convention do_not_contact.phone
  -- uses, so opt-out checks and threading agree without reformatting.
  phone_last10  text NOT NULL,

  body          text NOT NULL,          -- full body, NOT truncated
  keyword       text,                   -- STOP/HELP/CALLED/... when recognized

  -- Sender identity resolved at write time. Nullable: most senders (providers
  -- from the directory, wrong numbers) match no account, and the message must
  -- still be stored.
  profile_id    uuid,
  profile_type  text CHECK (profile_type IN ('family', 'provider')),
  display_name  text,

  -- Human triage state. handled_at IS NULL == needs attention.
  handled_at    timestamptz,
  handled_by    text,

  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Thread view: every message from one number, newest first.
CREATE INDEX IF NOT EXISTS idx_sms_inbound_thread
  ON sms_inbound (phone_last10, created_at DESC);

-- The inbox's default view is "what still needs a human". Partial index keeps
-- it small — handled rows are the vast majority over time.
CREATE INDEX IF NOT EXISTS idx_sms_inbound_unhandled
  ON sms_inbound (created_at DESC) WHERE handled_at IS NULL;

-- Service-role only, matching provider_activity / seeker_activity / page_events.
ALTER TABLE sms_inbound ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sms_inbound IS
  'Every inbound SMS to the Olera Twilio number, matched to an account or not. Outbound lives in Twilio (and partially email_log). See migration 166.';

-- ============================================================================
-- do_not_contact: allow 'sms_stop' as a reason
-- ============================================================================
-- The webhook now writes a STOP text straight into the kill switch that
-- sendSMS already enforces. Previously STOP only set phone_validity on matching
-- FAMILY profiles, so a provider's opt-out was a no-op — one was re-texted 11
-- days after asking us to stop.
--
-- These get their own reason rather than 'other': STOP texts will become the
-- most common row type here, and burying them in 'other' would make
-- /admin/do-not-contact unreadable at a glance.
ALTER TABLE do_not_contact DROP CONSTRAINT IF EXISTS do_not_contact_reason_check;
ALTER TABLE do_not_contact ADD CONSTRAINT do_not_contact_reason_check
  CHECK (reason IN (
    'provider_request',
    'angry_optout',
    'legal',
    'spam_complaint',
    'sms_stop',
    'other'
  ));

-- Migration: sms_drafts — an unsent reply, parked against its thread
--
-- Context: /admin/inbox had no way to hold a reply short of sending it. The
-- textarea was component state, wiped by `setReply("")` on every thread switch
-- and gone on reload. A reply you wanted to think about, check a fact for, or
-- have someone else read had nowhere to live, so it either got sent half-baked
-- or got written somewhere outside the product entirely.
--
-- The forcing case (2026-08-08): a Louisiana family texted "Called on hold for
-- 45 minutes stuck". Answering well needed a program to be researched first,
-- and the answer had to be parked somewhere reviewable in the meantime. It
-- ended up in Notion, which is the wrong place — the draft belongs next to the
-- conversation it answers.
--
-- One row per thread. You draft one reply to one conversation; a list of
-- competing drafts for the same number is a worse product, not a richer one,
-- so phone_last10 is the primary key and saving upserts.
--
-- Deliberately NOT a send queue. Nothing here is ever sent automatically.
-- A draft is text waiting for a human to press Send, and the send path keeps
-- every gate it already had (do-not-contact, length, Twilio result).
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS sms_drafts (
  -- Last 10 digits: same thread key as sms_inbound.phone_last10 and
  -- do_not_contact.phone, so drafts, threading and opt-out checks all agree
  -- without reformatting. PK, not just unique: one draft per conversation.
  phone_last10  text PRIMARY KEY,

  -- The unsent reply. 480 is the reply box's own limit (3 GSM-7 segments);
  -- enforcing it here too means a draft can never hold something the send
  -- path would reject at the last second.
  body          text NOT NULL CHECK (length(body) <= 480),

  -- Who last touched it, for the "saved by" line when more than one admin
  -- works the inbox. Email, matching sms_inbound.handled_by.
  updated_by    text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- The thread list marks which conversations have a draft waiting, so it reads
-- every draft row on each load. Small table (bounded by open conversations),
-- but ordering by recency keeps the common query cheap as it grows.
CREATE INDEX IF NOT EXISTS idx_sms_drafts_updated
  ON sms_drafts (updated_at DESC);

-- Service-role only, matching sms_inbound.
ALTER TABLE sms_drafts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sms_drafts IS
  'Unsent admin replies, one per SMS thread, keyed by phone_last10. Autosaved from /admin/inbox and cleared on send. Never sent automatically. See migration 168.';

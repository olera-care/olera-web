-- Migration: Global do-not-contact suppression list.
--
-- Background: provider/family email is sent by ~27 independent senders, and
-- opt-out was fragmented — each cron checked its own flag (provider_unsubscribes,
-- metadata.*_unsubscribed, nudges_unsubscribed), so there was no single "stop
-- contacting this address" lever. The one universal chokepoint is sendEmail()
-- in lib/email.ts (every Resend send flows through it, and it already enforces
-- bounce/complaint suppression + the frequency cap there).
--
-- This table is the global, human-entered suppression list checked in that
-- chokepoint. A single row silences an address across EVERY Resend sender.
--
-- Semantics (enforced in lib/email.ts):
--   * Email-keyed, stored LOWERCASED. The send-path check lowercases the
--     recipient before lookup, so always insert lowercased addresses.
--   * Highest-priority gate — checked before the reactive bounce/complaint and
--     verification signals.
--   * NOT bypassed by the email_overrides trust allowlist: an explicit "do not
--     contact" (consent) beats a human's deliverability-confidence override.
--   * Account-critical auth/verification mail (SUPPRESSION_EXEMPT_TYPES: OTP,
--     verify_email, student_activation, …) still sends — those are
--     user-initiated flows, and blocking them would lock a real user out. This
--     list stops outreach / nudges / digests, not a login the user just asked for.
--   * The check fails OPEN: a transient DB error → not suppressed → send proceeds,
--     so an outage can never silently freeze the whole email program.
--
-- RLS: service-role only (mirrors provider_unsubscribes / email_log / cron_runs).
-- Apply via the Supabase dashboard (NOT the CLI), same as 084 / 082.

CREATE TABLE IF NOT EXISTS do_not_contact (
  email      TEXT PRIMARY KEY,   -- lowercased recipient address
  reason     TEXT,               -- short reason ('provider requested', 'complaint', …)
  note       TEXT,               -- free-form context
  source     TEXT,               -- who/what added it (admin email, 'manual_admin_request', …)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE do_not_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on do_not_contact"
  ON do_not_contact FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE do_not_contact IS
  'Global email suppression list, checked in lib/email.ts sendEmail() for every non-exempt Resend send. Email stored lowercased. Insert a row to permanently stop all outreach/nudge/digest mail to that address (account-critical auth types still send).';

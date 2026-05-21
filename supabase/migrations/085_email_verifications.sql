-- 085_email_verifications.sql
--
-- Proactive email-deliverability verdict cache. Populated by an external
-- verification provider (e.g. ZeroBounce) ahead of sending, via the batch
-- script scripts/verify-emails.js. Read at send time by lib/email.ts:sendEmail
-- to suppress mail to addresses already known to be undeliverable — the
-- proactive complement to the reactive bounce/complaint suppression that
-- reads email_log.
--
-- Caching here avoids re-paying the per-address verification fee and keeps the
-- send path fast (sendEmail only reads this table; it never calls the API).

CREATE TABLE IF NOT EXISTS email_verifications (
  email       TEXT PRIMARY KEY,                         -- normalized lowercase address
  status      TEXT NOT NULL
                CHECK (status IN ('valid', 'invalid', 'risky', 'unknown')),
  sub_status  TEXT,                                     -- raw provider sub-status (e.g. 'mailbox_not_found', 'spamtrap', 'catch_all')
  provider    TEXT NOT NULL DEFAULT 'zerobounce',       -- which service produced the verdict
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lets the batch script and re-verification logic skip recently-checked
-- addresses without a full scan.
CREATE INDEX IF NOT EXISTS idx_email_verifications_checked_at
  ON email_verifications (checked_at);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_verifications"
  ON email_verifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE email_verifications IS
  'Proactive deliverability verdict cache. Written by scripts/verify-emails.js (external verification provider). Read by lib/email.ts:sendEmail to suppress sends to status=invalid addresses before they bounce. Normalized statuses: valid / invalid (mailbox not found, spamtrap, abuse, do-not-mail) / risky (catch-all) / unknown.';

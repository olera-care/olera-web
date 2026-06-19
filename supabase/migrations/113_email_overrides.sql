-- 113_email_overrides.sql
--
-- Human-trust allowlist for email sending. An address listed here is "send
-- anyway": it bypasses BOTH suppression signals in lib/email.ts:sendEmail — the
-- reactive bounce/complaint check (isSuppressedRecipient → email_log) AND the
-- proactive verification verdict (isUndeliverable / verifyAndCache →
-- email_verifications).
--
-- Why this exists: our email checker has been too aggressive. A stale or
-- one-off bounce, or a predictive ZeroBounce "invalid"/"risky" verdict,
-- permanently blocked addresses — including CLAIMED, actively-engaged providers
-- (e.g. The Grove), whose family-question notifications then silently piled up.
-- A predictive verdict is a guess; a confirmed bounce can go stale. When a human
-- has higher-quality evidence the inbox is real (QA phoned the provider, pulled
-- the address off their official website, or it's a claimed account's confirmed
-- inbox), that judgment should supersede the algorithm.
--
-- Reversible by design: delete the row to re-subject the address to the normal
-- gates. Audited: created_by + reason record who trusted it and why.

CREATE TABLE IF NOT EXISTS email_overrides (
  email       TEXT PRIMARY KEY,                          -- normalized lowercase address
  reason      TEXT NOT NULL DEFAULT 'admin'              -- why we trust it
                CHECK (reason IN ('phone_verified', 'official_website', 'claimed_account', 'admin')),
  note        TEXT,                                      -- free-text context (optional)
  created_by  TEXT,                                      -- admin email / actor who added it
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_overrides"
  ON email_overrides FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE email_overrides IS
  'Human-trust allowlist. An address here bypasses both suppression signals in lib/email.ts:sendEmail (bounce/complaint via email_log AND verification verdict via email_verifications). Added when a human has verified the inbox is real (phone, official website, or a claimed account) and the automated checker is wrongly blocking it. Reversible: delete the row to restore normal gating.';

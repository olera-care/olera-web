-- 107_claim_codes_email.sql
--
-- Security hardening for the provider one-click sign-in flow.
--
-- /api/auth/auto-sign-in previously trusted a caller-supplied `email` and minted
-- a magic-link session for it, only checking that the claim_session was verified
-- at some point — never that the email matched the one that actually received and
-- passed the verification. That allowed account takeover: POST a victim's email
-- with any verified claim_session and receive a session for the victim.
--
-- The fix derives the email from the verified claim_verification_codes row instead
-- of the request body. To do that the row must record WHICH email was verified.
-- This column stores the email the verification was issued to / validated for:
--   - validate-token (campaign / notification links): the email embedded in the
--     signed token (already matched against the provider's on-file email).
--   - send-code (manual OTP): the provider's on-file email the code was sent to.
--
-- Backfill is intentionally omitted: existing rows predate the column, and
-- auto-sign-in now fails closed (no session) when the verified row has no email.
-- Only new verifications can mint sessions, which is the desired behavior.

ALTER TABLE claim_verification_codes
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN claim_verification_codes.email IS
  'Email the verification was issued to / validated for. auto-sign-in mints a session only for this email — never a caller-supplied one. Added 2026-06-15 (account-takeover fix).';

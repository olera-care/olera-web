-- Migration: Create claim_verification_codes table with claim_session support
--
-- Supports the verification-first claim flow where users verify business
-- ownership before authenticating. Codes are tracked by a client-generated
-- claim_session UUID instead of requiring user_id.

CREATE TABLE IF NOT EXISTS claim_verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id text NOT NULL,
  user_id uuid,
  claim_session uuid,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index for unauthenticated lookups by claim_session + provider_id
CREATE INDEX IF NOT EXISTS idx_claim_codes_session_provider
  ON claim_verification_codes (claim_session, provider_id)
  WHERE claim_session IS NOT NULL;

-- Rate limit index by provider_id (not user_id, since user may not exist yet)
CREATE INDEX IF NOT EXISTS idx_claim_codes_provider_created
  ON claim_verification_codes (provider_id, created_at);

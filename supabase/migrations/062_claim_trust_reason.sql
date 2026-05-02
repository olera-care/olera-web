-- Add claim_trust_reason column to store the reasoning behind trust level scoring
-- This gives admins visibility into WHY a claim requires verification
-- Example reasons: "email_domain_mismatch", "generic_email_provider", "domain_matches_website", etc.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS claim_trust_reason TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN business_profiles.claim_trust_reason IS 'Human-readable reason for the claim_trust_level assignment, e.g. "generic_email_provider", "domain_matches_website"';

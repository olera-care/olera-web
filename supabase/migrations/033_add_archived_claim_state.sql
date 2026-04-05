-- Add 'archived' to business_profiles claim_state
-- Used by the test data eraser (/erase) to hide profiles without deleting them
ALTER TABLE business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_claim_state_check;

ALTER TABLE business_profiles
  ADD CONSTRAINT business_profiles_claim_state_check
  CHECK (claim_state IN ('unclaimed', 'pending', 'claimed', 'rejected', 'archived'));

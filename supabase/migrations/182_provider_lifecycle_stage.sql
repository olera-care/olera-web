-- Add lifecycle_stage to business_profiles.
-- Stage 1 (Onboarding) is the only stage-aware code path initially.
-- All existing providers default to NULL; existing crons ignore this column
-- and continue running exactly as before.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT NULL;

COMMENT ON COLUMN business_profiles.lifecycle_stage IS
  'Provider lifecycle stage: claimed, onboarding, building, growth, retention, power_user, dormant. NULL = not yet stage-aware.';

-- Add lifecycle_stage to business_profiles.
--
-- WHY: the provider lifecycle (onboarding → building → growth → retention →
-- power user → dormant) is being built one stage at a time, and each stage needs
-- to know which providers are in it. Today the only stage markers are implicit:
-- claim_state tells you a page was claimed and verification_state tells you where
-- someone sits in verification. Neither says where a provider is in their arc
-- with us, so no cron can target a stage.
--
-- Stage 1 (Onboarding) is the only stage-aware code path initially. The welcome
-- cron sets 'onboarding' when it sends. Every existing row stays NULL, which
-- reads as "not yet stage-aware" and is deliberate: we do not know retroactively
-- which stage the 880 already-claimed providers belong to, and inventing one
-- would poison every cohort query built on this column later. Existing crons
-- ignore the column and run exactly as before.
--
-- WHY TEXT + CHECK rather than an enum: matches the house pattern everywhere
-- else in this schema, and altering a CHECK is a cheaper migration than altering
-- an enum type. The full stage vocabulary is declared up front so phases 2
-- through 7 can write their stage without another migration.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT NULL;

ALTER TABLE business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_lifecycle_stage_check;

ALTER TABLE business_profiles
  ADD CONSTRAINT business_profiles_lifecycle_stage_check
  CHECK (lifecycle_stage IS NULL OR lifecycle_stage IN (
    'claimed',
    'onboarding',
    'building',
    'growth',
    'retention',
    'power_user',
    'dormant'
  ));

COMMENT ON COLUMN business_profiles.lifecycle_stage IS
  'Where this provider sits in the lifecycle. Set by the stage-aware crons; NULL means the provider predates stage tracking (2026-08-31) and their stage is unknown. Do not treat NULL as "not onboarded" — exclude those rows from stage cohorts instead.';

-- Stage cohort queries filter on this column over a small set of live stages.
-- The partial index keeps that cheap without carrying the NULL majority.
CREATE INDEX IF NOT EXISTS idx_business_profiles_lifecycle_stage
  ON business_profiles (lifecycle_stage)
  WHERE lifecycle_stage IS NOT NULL;

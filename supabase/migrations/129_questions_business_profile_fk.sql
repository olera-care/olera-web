-- Add proper foreign key reference to business_profiles for provider_questions
-- This allows direct lookups instead of complex slug resolution

-- Step 1: Add the column (nullable initially for backfill)
ALTER TABLE provider_questions
ADD COLUMN IF NOT EXISTS business_profile_id UUID REFERENCES business_profiles(id);

-- Step 2: Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_provider_questions_business_profile_id
ON provider_questions(business_profile_id)
WHERE business_profile_id IS NOT NULL;

-- Step 3: Backfill existing questions where we can resolve the business_profile
-- Match by: provider_id = business_profiles.slug OR via olera-providers.slug → source_provider_id linkage

-- 3a: Direct slug match (question.provider_id = business_profiles.slug)
UPDATE provider_questions pq
SET business_profile_id = bp.id
FROM business_profiles bp
WHERE pq.business_profile_id IS NULL
  AND pq.provider_id = bp.slug;

-- 3b: Via olera-providers linkage (question.provider_id = olera-providers.slug → source_provider_id)
UPDATE provider_questions pq
SET business_profile_id = bp.id
FROM "olera-providers" ios
JOIN business_profiles bp ON bp.source_provider_id = ios.provider_id
WHERE pq.business_profile_id IS NULL
  AND pq.provider_id = ios.slug
  AND ios.deleted IS NOT TRUE;

-- 3c: Via olera-providers.provider_id (legacy alphanumeric IDs)
UPDATE provider_questions pq
SET business_profile_id = bp.id
FROM "olera-providers" ios
JOIN business_profiles bp ON bp.source_provider_id = ios.provider_id
WHERE pq.business_profile_id IS NULL
  AND pq.provider_id = ios.provider_id
  AND ios.deleted IS NOT TRUE;

-- Log how many were backfilled vs remaining
DO $$
DECLARE
  total_count INTEGER;
  filled_count INTEGER;
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM provider_questions;
  SELECT COUNT(*) INTO filled_count FROM provider_questions WHERE business_profile_id IS NOT NULL;
  remaining_count := total_count - filled_count;

  RAISE NOTICE 'Backfill complete: % of % questions have business_profile_id (% remaining without)',
    filled_count, total_count, remaining_count;
END $$;

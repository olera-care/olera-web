-- Backfill: flag existing provider_questions where the provider has no email
-- Run this once after deploying the metadata column migration (025)
--
-- Sets metadata.needs_provider_email = true on questions where:
-- 1. The provider (by slug) has no email in business_profiles
-- 2. The question doesn't already have the flag set

UPDATE provider_questions pq
SET metadata = jsonb_set(
  COALESCE(pq.metadata, '{}'::jsonb),
  '{needs_provider_email}',
  'true'::jsonb
)
FROM business_profiles bp
WHERE bp.slug = pq.provider_id
  AND (bp.email IS NULL OR bp.email = '')
  AND (pq.metadata IS NULL OR NOT (pq.metadata ? 'needs_provider_email'));

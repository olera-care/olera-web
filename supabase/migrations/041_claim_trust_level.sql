-- Migration: Add claim trust scoring for one-click sign-ins
-- 1. Adds business_profiles.claim_trust_level (nullable) to persist LLM-scored bucket
-- 2. Adds 'suspicious_claim' to provider_activity.event_type CHECK so we can surface
--    low-trust claims in the admin Activity Center

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS claim_trust_level TEXT
  CHECK (claim_trust_level IN ('high', 'medium', 'low'));

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;
ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click', 'page_view', 'lead_opened',
    'question_received', 'question_responded',
    'review_viewed', 'one_click_access', 'contact_revealed',
    'reviews_cta_clicked',
    'suspicious_claim'
  ));

-- Migration: Add 'claim_completed' to provider_activity event_type CHECK
--
-- Context: claim attribution today is split across two endpoints:
--   - /api/claim/finalize     → email-flow claim (post-email landing)
--   - /api/provider/claim-listing → page-flow claim (Claim CTA on the public profile)
--
-- Neither writes a queryable activity row today (finalize only updates
-- claim_trust_level on business_profiles; claim-listing has no event write).
-- The admin Providers section needs both surfaces to be queryable so we can
-- count distinct providers who claimed via each path.
--
-- This migration whitelists the new event type. Both endpoints fire
-- claim_completed on success with metadata.source set to 'page' or 'email',
-- enabling source attribution without a schema change later.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;
ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click',
    'page_view',
    'lead_opened',
    'lead_received',
    'question_received',
    'question_responded',
    'review_viewed',
    'review_received',
    'one_click_access',
    'contact_revealed',
    'reviews_cta_clicked',
    'suspicious_claim',
    'search_click',
    'cta_click_public',
    'analytics_teaser_impression',
    'analytics_teaser_cta_clicked',
    'benefits_started',
    'claim_completed'
  ));

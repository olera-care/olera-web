-- Migration: Provider Analytics Phase 2 — teaser-card telemetry event types
--
-- Context: the AnalyticsTeaserCard on /provider/onboarding is the conversion
-- door for the Phase 2 dashboard redesign. Phase 2 adds two event types so we
-- can compute CTR per teaser-case (has_cohort / views_only / zero_views)
-- before iterating further on copy:
--
--   - analytics_teaser_impression   (fired when the card renders with data)
--   - analytics_teaser_cta_clicked  (fired when the "See..." CTA is clicked)
--
-- Without this migration the INSERTs fail silently in the client (fire-and-
-- forget fetch swallows the 500) and we never see a single event in the DB.
--
-- Additive and safe per CLAUDE.md. Apply via Supabase dashboard (NOT CLI).

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
    'analytics_teaser_cta_clicked'
  ));

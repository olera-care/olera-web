-- Migration: Add 'benefits_started' to provider_activity event_type CHECK
--
-- Context: /api/benefits/track-start fires a Slack alert when a care seeker
-- begins the benefits intake on a provider page, but does NOT persist the
-- event. That makes the funnel (started → completed) impossible to read
-- from the DB. This migration whitelists the new anonymous event type so
-- the track-start endpoint can write to provider_activity alongside the
-- Slack alert.
--
-- Anonymous (no profile_id), keyed on the providerSlug the seeker was on.
-- Writes go through the same /api/activity/track anonymous code path as
-- search_click and cta_click_public, so session_id will be enforced.
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
    'benefits_started'
  ));

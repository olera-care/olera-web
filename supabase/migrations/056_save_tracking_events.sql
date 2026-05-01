-- Migration: Add save tracking events for analytics
--
-- Context: Track provider saves and nudge-to-signup conversion funnel.
--
-- New provider_activity event:
--   - provider_saved → fires when a care seeker saves a provider (guest or auth)
--
-- New seeker_activity events:
--   - save_nudge_shown        → toast appeared at milestone (1, 3, 7, 15)
--   - save_nudge_signup_clicked → user clicked "Sign up free" on toast
--   - save_nudge_dismissed    → user clicked "Not now" or X
--   - save_nudge_converted    → user completed signup after clicking nudge CTA
--
-- These power:
--   - Admin dashboard "Saved" metric in Engagement section
--   - Slack alerts for save-to-signup conversions
--   - Daily digest Save Funnel section
--
-- Apply via Supabase dashboard (NOT CLI).

-- Update provider_activity constraint to include provider_saved
-- NOTE: Must include ALL existing event types from track API + previous migrations
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
    'claim_completed',
    'benefits_entry_viewed',
    'benefits_step_viewed',
    'benefits_step_completed',
    'provider_profile_edited',
    'provider_picker_impression',
    'provider_picker_clicked',
    'dashboard_arrival',
    'provider_saved'
  ));

-- Update seeker_activity constraint to include save nudge funnel events
ALTER TABLE seeker_activity DROP CONSTRAINT IF EXISTS seeker_activity_event_type_check;
ALTER TABLE seeker_activity ADD CONSTRAINT seeker_activity_event_type_check
  CHECK (event_type IN (
    'connection_sent',
    'profile_enriched',
    'email_click',
    'question_asked',
    'matches_activated',
    'benefits_completed',
    'save_nudge_shown',
    'save_nudge_signup_clicked',
    'save_nudge_dismissed',
    'save_nudge_converted'
  ));

-- Migration: Go Live events for QuickProfileWizard
--
-- Context: The QuickProfileWizard in the family inbox has a "Go Live" prompt
-- after profile completion that encourages care seekers to publish their
-- profile. This migration adds two new event types to track this funnel:
--
--   profile_published  — fires when family clicks "Go Live" to publish profile
--   go_live_skipped    — fires when family clicks "Maybe later" to skip
--
-- These events are fired by QuickProfileWizard.tsx and tracked in seeker_activity
-- to measure Go Live conversion rates in the admin analytics.
--
-- Per feedback_event_allowlist_needs_db_migration.md, the app allowlist (in
-- app/api/activity/track/route.ts) and the DB CHECK constraint must be extended
-- together. The API was updated in the same PR as this migration.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- Extend seeker_activity event_type CHECK
-- ============================================================================

ALTER TABLE seeker_activity DROP CONSTRAINT IF EXISTS seeker_activity_event_type_check;
ALTER TABLE seeker_activity ADD CONSTRAINT seeker_activity_event_type_check
  CHECK (event_type IN (
    'connection_sent',
    'profile_enriched',
    'profile_published',
    'go_live_skipped',
    'email_click',
    'question_asked',
    'matches_activated',
    'benefits_completed',
    'save_nudge_shown',
    'save_nudge_signup_clicked',
    'save_nudge_dismissed',
    'save_nudge_converted',
    'benefits_results_viewed',
    'outreach_module_impression',
    'outreach_card_clicked',
    'outreach_request_submitted',
    'qa_email_capture_impression',
    'question_email_enriched'
  ));

COMMENT ON CONSTRAINT seeker_activity_event_type_check ON seeker_activity IS
  'Allowlist of seeker_activity event types. Coupled with FAMILY_EVENT_TYPES + profileOptionalEvents in app/api/activity/track/route.ts. Last update: migration 085 (profile_published, go_live_skipped).';

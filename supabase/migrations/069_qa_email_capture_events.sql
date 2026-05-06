-- Migration: qa_email_capture variant events
--
-- Context: Adds a 5th arm to the SBF intake A/B test on provider pages
-- (mod 5 split). The qa_email_capture arm hides the SBF / outreach modules
-- entirely and instead enables the Q&A section's post-submit guest email
-- enrichment prompt (which is suppressed when SBF is on the page).
--
-- This migration adds two coupled event_types to seeker_activity. Per
-- feedback_event_allowlist_needs_db_migration.md the app allowlist + DB
-- CHECK must be extended together — adding to the app without extending
-- the CHECK causes silent insert failures (fire-and-forget routes swallow
-- the rejection). Cost a 7h diagnosis loop on 2026-04-29.
--
--   qa_email_capture_impression — fires when QASectionV2 mounts in the
--                                  qa_email_capture arm. Used as the impression
--                                  denominator for funnel comparison.
--   question_email_enriched      — fires when guest enrichment writes
--                                  asker_email to a previously-anonymous
--                                  question. The submitted-stage signal
--                                  for this arm.
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
  'Allowlist of seeker_activity event types. Coupled with FAMILY_EVENT_TYPES + profileOptionalEvents in app/api/activity/track/route.ts. Last update: migration 069 (qa_email_capture_impression, question_email_enriched).';

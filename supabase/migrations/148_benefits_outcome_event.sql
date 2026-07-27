-- Migration: benefits_outcome_reported seeker event
--
-- Context: the Benefits Cascade (Phase 2 of the benefits admin work). After a
-- family completes the benefits intake, the family-comms coordinator sends a
-- "ten-minute first step" email (day 2-3) and a check-in whose reply options
-- all point forward (day ~5-6): "It's moving / I want help / This program
-- isn't right for me". Each tap lands on /benefits-outcome, which records the
-- answer via a client-side POST (scanner-safe — email link scanners issue GETs
-- and never run JS, so they can't write).
--
--   benefits_outcome_reported — family self-reported how their benefits
--   application is going, via the check-in email chips.
--   metadata: { value: 'moving' | 'wants_help' | 'wrong_program', program_id }.
--
-- 'wants_help' is the cascade trigger: it floats the family in the
-- /admin/benefits Families queue and fires a Slack ping. Outcome data is the
-- exhaust of helping, not an audit — see the Phase 2 Redesign section of the
-- "Benefits Admin Visibility — Handoff (2026-07-27)" doc.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the DB CHECK and the app
-- allowlist (FAMILY_EVENT_TYPES in app/api/activity/track/route.ts) MUST be
-- extended together, or inserts fail silently. The full list below mirrors
-- migration 115 + the new value.
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
    'question_email_enriched',
    'connection_outcome_reported',
    'benefits_outcome_reported'    -- NEW: family self-report from the benefits check-in (moving | wants_help | wrong_program)
  ));

COMMENT ON CONSTRAINT seeker_activity_event_type_check ON seeker_activity IS
  'Allowlist of seeker_activity event types. Coupled with FAMILY_EVENT_TYPES in app/api/activity/track/route.ts. Last update: migration 148 (benefits_outcome_reported — family self-reported benefits application progress via check-in email).';

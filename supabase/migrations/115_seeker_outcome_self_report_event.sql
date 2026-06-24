-- Migration: connection_outcome_reported seeker event
--
-- Context: The "self-report outcome confirmation" loop (the dating-app
-- "Did you meet this person?" pattern). ~48-72h after a family sends an
-- inquiry, we email them a one-click "Did <provider> get back to you?"
-- check. Their answer (yes | no | not_yet) is the closest thing we have to
-- ground truth on whether a real connection happened — the actual outcome
-- happens off-platform (a phone call / direct email) and is otherwise
-- invisible to us (connection.status sits 'pending' forever).
--
--   connection_outcome_reported — family self-reported, via the one-click
--   email, whether the provider got back to them. metadata: { value, connection_id }.
--
-- NOTE: this is a SELF-REPORT. It is recorded in connections.metadata.outcome
-- and here as a seeker_activity event. It deliberately does NOT advance
-- connections.status to 'accepted' — that signal means "the provider engaged"
-- and is load-bearing for isSuccessfulConnection() and the admin funnel.
-- Conflating a family's click with a provider action would corrupt those metrics.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the DB CHECK and the app
-- allowlist (FAMILY_EVENT_TYPES in app/api/activity/track/route.ts) MUST be
-- extended together, or the fire-and-forget tracker swallows the rejection and
-- inserts fail silently. The full list below mirrors migration 085 + the new value.
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
    'connection_outcome_reported'   -- NEW: family one-click self-report (yes | no | not_yet)
  ));

COMMENT ON CONSTRAINT seeker_activity_event_type_check ON seeker_activity IS
  'Allowlist of seeker_activity event types. Coupled with FAMILY_EVENT_TYPES in app/api/activity/track/route.ts. Last update: migration 115 (connection_outcome_reported — family self-reported provider response via one-click email).';

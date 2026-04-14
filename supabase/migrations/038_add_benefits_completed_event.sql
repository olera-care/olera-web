-- Migration: Add 'benefits_completed' to seeker_activity event_type CHECK constraint
--
-- Context: when a caregiver completes the benefits intake on a provider page
-- (4 questions → results → save), the system logs an activity event. Currently
-- we shoehorn this into 'profile_enriched' with metadata.source="benefits_intake".
-- That works but makes the admin activity center unable to distinguish benefits
-- completions from other profile enrichments (connection intent updates, etc.)
--
-- This migration adds 'benefits_completed' as a distinct event type so:
--   - Admin activity center can filter / color-code benefits completions
--   - Daily digest cron can count them
--   - Per-family aggregation can surface "completed benefits" as a signal

ALTER TABLE seeker_activity
  DROP CONSTRAINT IF EXISTS seeker_activity_event_type_check;

ALTER TABLE seeker_activity
  ADD CONSTRAINT seeker_activity_event_type_check
  CHECK (event_type IN (
    'connection_sent',
    'profile_enriched',
    'email_click',
    'question_asked',
    'matches_activated',
    'benefits_completed'
  ));

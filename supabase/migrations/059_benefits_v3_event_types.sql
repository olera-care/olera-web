-- Migration: Add 'benefits_results_viewed' to seeker_activity event_type
--
-- Context: V3's post-submit experience is a side-panel/bottom-sheet overlay
-- on the provider page (NOT a redirect to /welcome). The same component is
-- also addressable at /m/{token} as a standalone page reachable from the
-- magic link / SMS short link.
--
-- We need a single event that fires whenever the user actually SEES their
-- match list — whether in-session via the overlay, or later via /m/{token}.
-- This lets us measure: "of users who submitted contact, how many actually
-- engaged with the matches?" — separate signal from "did they submit."
--
-- Particularly important given TJ's audience knowledge that ~95% of email
-- recipients never open. The in-session overlay is the primary deliverable
-- for V3; this event tracks whether that deliverable lands.
--
-- Why a new event type and not a property on benefits_completed:
--   - benefits_completed fires once per intake, on submit
--   - benefits_results_viewed can fire many times (re-visit /m/{token})
--   - Mixing them on one type would muddle the funnel
--
-- Heeds memory feedback_event_allowlist_needs_db_migration.md — this CHECK
-- constraint extension is the *only* way to enable inserts of the new event
-- type. Skipping it would silently fail every insert (route fire-and-forget
-- swallows the rejection).
--
-- Apply via Supabase dashboard (NOT CLI).

-- Update seeker_activity constraint to include benefits_results_viewed.
-- Includes ALL existing event types from previous migrations (049, 050, 056).
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
    'benefits_results_viewed'
  ));

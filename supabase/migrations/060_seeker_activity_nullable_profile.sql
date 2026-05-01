-- Migration: Allow NULL profile_id for guest-triggered seeker events
--
-- Context: Save nudge funnel events (save_nudge_shown, save_nudge_signup_clicked,
-- save_nudge_dismissed, save_nudge_converted) fire for GUEST users who don't have
-- a profile yet. The original schema required profile_id to be NOT NULL, causing
-- all these events to fail with "Failed to log activity" (500 error).
--
-- This migration makes profile_id nullable so guest events can be tracked.
-- Once the user signs up and gets a profile, the save_nudge_converted event
-- can include their new profile_id if available.
--
-- Apply via Supabase dashboard (NOT CLI).

-- Make profile_id nullable (removes NOT NULL constraint)
ALTER TABLE seeker_activity ALTER COLUMN profile_id DROP NOT NULL;

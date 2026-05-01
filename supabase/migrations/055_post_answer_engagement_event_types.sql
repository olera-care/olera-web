-- Migration: Add post-answer engagement chain event types to provider_activity
--
-- Context: PRs #676 / #679 / #688 / #690 introduced four new event types
-- fired from the dashboard hero and the post-answer redirect:
--
--   - provider_picker_impression  -> fires when DashboardHero renders a
--                                    completion-tier nudge with a section
--                                    (DashboardHero.tsx useEffect).
--   - provider_picker_clicked     -> fires when provider clicks a hero CTA
--                                    (engagement OR completion tier). Carries
--                                    metadata.source="hero" + tier/section.
--   - provider_profile_edited     -> fires when provider saves an edit modal
--                                    (lib/analytics/track-profile-edit.ts).
--   - dashboard_arrival           -> fires when /provider mounts with
--                                    ?from=qa-success (post-answer redirect
--                                    from /provider/[slug]/onboard).
--
-- All four were added to the application allowlist in app/api/activity/track
-- but the database CHECK constraint on provider_activity.event_type was
-- never extended. Result: every insert from these events failed with a
-- 500, the route's .catch swallowed the rejection silently, and the
-- /admin/analytics Q&A funnel + daily digest + Slack alerts have all
-- shown zero engagement since they shipped (2026-04-29).
--
-- Found 2026-04-29 when TJ noticed engagement-tier hero clicks weren't
-- producing Slack alerts on prod. Diagnostics showed zero rows in
-- provider_activity for all four event types across the entire history.
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
    'benefits_started',
    'claim_completed',
    'benefits_entry_viewed',
    'benefits_step_viewed',
    'benefits_step_completed',
    'provider_picker_impression',
    'provider_picker_clicked',
    'provider_profile_edited',
    'dashboard_arrival'
  ));

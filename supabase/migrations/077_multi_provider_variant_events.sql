-- Migration: multi_provider variant events
--
-- Context: Adds the 6th arm to the SBF intake A/B test on provider pages.
-- The multi_provider arm replaces the SBF / outreach modules with a
-- Tinder-style card stack that lets a visitor send the same question to
-- multiple similar providers, ending with email capture.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts) and the DB
-- CHECK constraint MUST be extended together. Adding to the app without
-- extending the CHECK causes silent insert failures because the
-- fire-and-forget tracker swallows the rejection. Cost a 7h diagnosis
-- loop on 2026-04-29 — don't repeat.
--
-- Events fired by the multi_provider flow (all anonymous → provider_activity):
--   multi_provider_viewed       — wrapper mounted in arm. Impression denominator.
--   multi_provider_card_shown   — card stack rendered after a question (started).
--   multi_provider_asked        — user sent question to a provider in the stack.
--   multi_provider_skipped      — user skipped a provider card.
--   multi_provider_converted    — email captured at end of flow (saved).
--   multi_provider_save_all     — secondary save action (logged-in flow).
--
-- The funnel (admin/analytics) reads viewed → card_shown → converted; the
-- other three are kept for downstream analysis.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- Extend provider_activity event_type CHECK
-- ============================================================================

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
    'provider_saved',
    'multi_provider_viewed',
    'multi_provider_card_shown',
    'multi_provider_asked',
    'multi_provider_skipped',
    'multi_provider_converted',
    'multi_provider_save_all'
  ));

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
  'Allowlist of provider_activity event types. Coupled with PROVIDER_EVENT_TYPES + ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts. Last update: migration 077 (multi_provider_*).';

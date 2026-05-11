-- Migration: multi_provider_flow_completed event
--
-- Context: Adds the multi_provider_flow_completed event type for tracking
-- logged-in user engagement with the multi_provider card flow. This is
-- distinct from multi_provider_converted, which should ONLY fire when a
-- guest user submits their email (true lead capture conversion).
--
-- Previously, logged-in users triggered multi_provider_converted when they
-- reached the end of the card flow, inflating conversion metrics with users
-- who already had accounts. This was semantically incorrect — a "conversion"
-- should represent a state change from anonymous to known lead.
--
-- New behavior:
--   multi_provider_converted      — guest user submitted email (real conversion)
--   multi_provider_flow_completed — logged-in user completed flow (engagement only)
--
-- The analytics funnel only counts multi_provider_converted as "submitted",
-- so logged-in engagement no longer inflates conversion rates.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts) and the DB
-- CHECK constraint MUST be extended together.
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
    'multi_provider_flow_completed',  -- logged-in engagement (migration 081)
    'multi_provider_save_all',
    -- CTA variant A/B test events (migration 080)
    'cta_variant_impression',
    'cta_variant_clicked'
  ));

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
  'Allowlist of provider_activity event types. Coupled with PROVIDER_EVENT_TYPES + ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts. Last update: migration 081 (multi_provider_flow_completed).';

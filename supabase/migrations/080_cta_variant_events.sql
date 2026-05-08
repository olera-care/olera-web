-- Migration: CTA variant A/B test events
--
-- Context: Extends the provider_activity CHECK constraint to allow
-- cta_variant_impression and cta_variant_clicked events. These power
-- the CTA Variants A/B testing system on provider detail pages.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts) and the DB
-- CHECK constraint MUST be extended together. Adding to the app without
-- extending the CHECK causes silent insert failures because the
-- fire-and-forget tracker swallows the rejection.
--
-- Events:
--   cta_variant_impression — CTA rendered on provider page (impression)
--   cta_variant_clicked    — user clicked to open form/sheet (engagement)
--
-- Conversions are tracked via lead_received with metadata.cta_variant.
--
-- Also seeds the experiment_weights table with the cta_variant experiment.
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
    'multi_provider_save_all',
    -- CTA variant A/B test events (migration 080)
    'cta_variant_impression',
    'cta_variant_clicked'
  ));

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
  'Allowlist of provider_activity event types. Coupled with PROVIDER_EVENT_TYPES + ANONYMOUS_EVENT_TYPES in app/api/activity/track/route.ts. Last update: migration 080 (cta_variant_*).';

-- ============================================================================
-- Seed experiment_weights with cta_variant experiment
-- ============================================================================

INSERT INTO experiment_weights (experiment_id, weights, version)
VALUES ('cta_variant', '{"legacy":100}'::jsonb, 1)
ON CONFLICT (experiment_id) DO NOTHING;

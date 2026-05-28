-- Migration: Enrichment Go Live events (Step 7)
--
-- Context: The EnrichmentState component in the provider connection card has a
-- "Go Live" step (step 7) that encourages care seekers to publish their profile.
-- Previously, these events were being sent incorrectly and failing silently.
--
-- This migration adds two new event types to provider_activity:
--   enrichment_profile_published — user clicked "Go live" in enrichment flow
--   enrichment_go_live_skipped   — user clicked "Maybe later" in enrichment flow
--
-- These events are tracked alongside other enrichment events (steps 1-6) in
-- provider_activity for the enrichment funnel analytics dashboard.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- Extend provider_activity event_type CHECK
-- ============================================================================

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;

ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check CHECK (
  event_type IN (
    -- Provider events
    'lead_received',
    'email_click',
    'page_view',
    'lead_opened',
    'question_received',
    'question_responded',
    'review_viewed',
    'one_click_access',
    'contact_revealed',
    'reviews_cta_clicked',
    'analytics_teaser_impression',
    'analytics_teaser_cta_clicked',
    'provider_profile_edited',
    'provider_picker_impression',
    'provider_picker_clicked',
    'dashboard_arrival',
    'provider_saved',
    'review_received',
    -- Anonymous events (care seeker on provider page)
    'search_click',
    'cta_click_public',
    'benefits_started',
    'multi_provider_viewed',
    'multi_provider_card_shown',
    'multi_provider_asked',
    'multi_provider_skipped',
    'multi_provider_converted',
    'multi_provider_flow_completed',
    'multi_provider_save_all',
    'cta_variant_impression',
    'cta_variant_clicked',
    -- Enrichment step events (steps 1-6)
    'enrichment_started',
    'enrichment_step_completed',
    'enrichment_step_skipped',
    'enrichment_completed',
    -- NEW: Enrichment Go Live events (step 7)
    'enrichment_profile_published',   -- User clicked "Go live" in enrichment flow
    'enrichment_go_live_skipped'      -- User clicked "Maybe later" in enrichment flow
  )
);

-- Add index for efficient Go Live analytics queries
CREATE INDEX IF NOT EXISTS idx_provider_activity_enrichment_go_live
ON provider_activity (event_type, created_at)
WHERE event_type IN ('enrichment_profile_published', 'enrichment_go_live_skipped');

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including enrichment tracking (steps 1-6 and Go Live step 7). Last update: migration 096 (enrichment_profile_published, enrichment_go_live_skipped).';

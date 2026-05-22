-- Add enrichment step tracking event types to provider_activity
-- These events track care seeker progression through the post-conversion enrichment flow

-- Drop and recreate the constraint with new event types
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
    -- NEW: Enrichment step events
    'enrichment_started',        -- User entered enrichment flow (after email submit)
    'enrichment_step_completed', -- User completed a specific step
    'enrichment_step_skipped',   -- User skipped from a specific step
    'enrichment_completed'       -- User finished all 6 steps
  )
);

-- Add index for efficient enrichment analytics queries
CREATE INDEX IF NOT EXISTS idx_provider_activity_enrichment
ON provider_activity (event_type, created_at)
WHERE event_type IN ('enrichment_started', 'enrichment_step_completed', 'enrichment_step_skipped', 'enrichment_completed');

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including enrichment step tracking (enrichment_started, enrichment_step_completed, enrichment_step_skipped, enrichment_completed). Metadata.step indicates which step (1-6).';

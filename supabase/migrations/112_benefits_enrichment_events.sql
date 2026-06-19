-- Migration: Benefits enrichment events
--
-- Adds event types for the benefits CTA enrichment flow (3-step post-email collection)
--
-- Events:
--   benefits_enrichment_started — User entered benefits enrichment flow (after email submit)
--   benefits_enrichment_step_completed — User completed a specific enrichment step
--   benefits_enrichment_step_skipped — User skipped a specific step
--   benefits_enrichment_completed — User finished all 3 steps (answered or skipped)
--
-- Apply via Supabase dashboard (NOT CLI).

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
    'phone_clicked',
    'email_link_clicked',
    'continue_in_inbox',
    'reviews_cta_clicked',
    'suspicious_claim',
    'analytics_teaser_impression',
    'analytics_teaser_cta_clicked',
    'provider_profile_edited',
    'provider_picker_impression',
    'provider_picker_clicked',
    'dashboard_arrival',
    'provider_saved',
    'review_received',
    'claim_completed',
    -- Provider outreach tracking (Find Families / Your Market)
    'matches_page_viewed',
    'matches_card_clicked',
    'matches_message_generated',
    'matches_outreach_sent',
    'market_diagnostic_viewed_no_leads',
    'market_outreach_status_updated',
    -- Managed Ads funnel + Your Market
    'managed_ads_pitch_viewed',
    'managed_ads_cta_clicked',
    'managed_ads_boost_viewed',
    'managed_ads_requested',
    'your_market_viewed',
    'your_market_playbook_clicked',
    -- Benefits flow events
    'benefits_entry_viewed',
    'benefits_step_viewed',
    'benefits_step_completed',
    -- Anonymous events
    'search_click',
    'cta_click_public',
    'benefits_started',
    'multi_provider_viewed',
    'multi_provider_card_shown',
    'multi_provider_engaged',
    'multi_provider_asked',
    'multi_provider_skipped',
    'multi_provider_converted',
    'multi_provider_flow_completed',
    'multi_provider_save_all',
    'cta_variant_impression',
    'cta_variant_clicked',
    -- Enrichment events (provider CTA)
    'enrichment_started',
    'enrichment_step_completed',
    'enrichment_step_skipped',
    'enrichment_completed',
    'enrichment_profile_published',
    'enrichment_go_live_skipped',
    -- Benefits enrichment events (benefits CTA)
    'benefits_enrichment_started',
    'benefits_enrichment_step_completed',
    'benefits_enrichment_step_skipped',
    'benefits_enrichment_completed'
  )
);

-- Add index for efficient benefits enrichment analytics queries
CREATE INDEX IF NOT EXISTS idx_provider_activity_benefits_enrichment
ON provider_activity (event_type, created_at)
WHERE event_type IN (
  'benefits_enrichment_started',
  'benefits_enrichment_step_completed',
  'benefits_enrichment_step_skipped',
  'benefits_enrichment_completed'
);

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including benefits enrichment tracking. Metadata.step indicates which step (1-3). Last update: migration 112 (benefits_enrichment_events).';

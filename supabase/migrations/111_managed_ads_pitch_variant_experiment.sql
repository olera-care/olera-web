-- Migration: Managed Ads pitch variant experiment
--
-- Adds a proper "shown" denominator for the managed-ads copy/framing A/B test
-- and seeds the provider-level allocation row used by /admin/analytics.
--
-- Events:
--   managed_ads_pitch_viewed — provider saw a managed-ads pitch surface
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
    -- Enrichment events
    'enrichment_started',
    'enrichment_step_completed',
    'enrichment_step_skipped',
    'enrichment_completed',
    'enrichment_profile_published',
    'enrichment_go_live_skipped'
  )
);

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including managed-ads pitch A/B denominator. Last update: migration 111 (managed_ads_pitch_variant_experiment).';

INSERT INTO experiment_weights (experiment_id, weights, version)
VALUES (
  'managed_ads_pitch_variant',
  '{"direct_reach":50,"local_plan":50}'::jsonb,
  1
)
ON CONFLICT (experiment_id) DO NOTHING;

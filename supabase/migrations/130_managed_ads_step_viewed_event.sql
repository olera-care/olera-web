-- Migration: managed_ads_step_viewed event
--
-- Adds in-flow funnel instrumentation for the Managed Ads apply flow
-- (/provider/boost). Fires once per step per visit with metadata:
--   - step: "timing" | "first_campaign" | "confirm"
--   - step_index: 0 | 1 | 2
--   - eligible, managed_ads_variant, city, region, category
--
-- Why: we could see boost_viewed -> requested but nothing in between, so
-- "where do providers stop inside the flow" was unanswerable (2026-07-10
-- budget-step analysis). This event closes that gap.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;

ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check CHECK (
  event_type IN (
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
    'matches_page_viewed',
    'matches_card_clicked',
    'matches_message_generated',
    'matches_outreach_sent',
    'market_diagnostic_viewed_no_leads',
    'market_outreach_status_updated',
    'managed_ads_pitch_viewed',
    'managed_ads_cta_clicked',
    'managed_ads_boost_viewed',
    'managed_ads_step_viewed',
    'managed_ads_requested',
    'your_market_viewed',
    'your_market_playbook_clicked',
    'ads_touchpoint_viewed',
    'ads_touchpoint_clicked',
    'ads_touchpoint_dismissed',
    'mobile_nav_variant_impression',
    'nav_families_clicked',
    'nav_hire_clicked',
    'benefits_entry_viewed',
    'benefits_step_viewed',
    'benefits_step_completed',
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
    'enrichment_started',
    'enrichment_step_completed',
    'enrichment_step_skipped',
    'enrichment_completed',
    'enrichment_profile_published',
    'enrichment_go_live_skipped',
    'benefits_enrichment_started',
    'benefits_enrichment_step_completed',
    'benefits_enrichment_step_skipped',
    'benefits_enrichment_completed',
    'review_no_email_signal'
  )
);

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including managed_ads_step_viewed for the Managed Ads apply-flow funnel. Last update: migration 130 (managed_ads_step_viewed_event).';

-- Migration: Ad Boost receipts (demand receipt + provider outcome capture)
--
-- Two additions behind the wrap-up receipts unit:
--
-- 1. ad_campaign_requests.ad_impressions — manual entry from the Google Ads
--    dashboard alongside the existing ad_spend_cents / ad_clicks. Impressions
--    are the top of the demand receipt ("your ad was seen N times"), the
--    number that proves demand existed even when a flight ends with 0 leads.
--
-- 2. provider_activity event 'ad_lead_outcome_reported' — written server-side
--    when a provider answers the one-tap "did this family become a client?"
--    ping (client | talking | no). The answer itself lives on
--    connections.metadata.provider_outcome; this event is the analytics
--    trail. Server-side insert only, so it is NOT added to the tracker
--    allowlist in app/api/activity/track/route.ts.
--
-- Per feedback_event_allowlist_needs_db_migration.md: DB CHECK changes ship
-- as a migration or inserts fail silently (fire-and-forget writers swallow
-- the rejection).
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE ad_campaign_requests ADD COLUMN IF NOT EXISTS ad_impressions INTEGER;

COMMENT ON COLUMN ad_campaign_requests.ad_impressions IS
'Impressions from the Google/Meta dashboard, entered manually with spend + clicks. Top line of the campaign demand receipt.';

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
    'review_no_email_signal',
    'ad_lead_outcome_reported'
  )
);

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including ad_lead_outcome_reported for Ad Boost provider outcome capture. Last update: migration 149 (ad_boost_receipts).';

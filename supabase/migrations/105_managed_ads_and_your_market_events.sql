-- Migration: managed-ads funnel + Your Market provider events
--
-- Context: the provider IA was split (PR #1050) into Find Families (leads) and
-- Your Market (the market diagnostic), with a Managed Ads product at
-- /provider/boost. Those reworked surfaces were largely uninstrumented. This
-- adds the event types to measure the funnel — who views the pitch / market,
-- who clicks toward managed ads, who requests a campaign — feeding the Activity
-- Center + Slack, mirroring the old Find Families instrumentation.
--
-- New event types:
--   managed_ads_cta_clicked     — provider tapped a CTA toward /provider/boost
--                                 (source: dashboard_card | ff_pitch | ff_banner)
--   managed_ads_boost_viewed    — provider viewed /provider/boost (gate|apply|in_motion)
--   managed_ads_requested       — provider submitted a managed-ads campaign request
--   your_market_viewed          — provider viewed the Your Market diagnostic
--   your_market_playbook_clicked— provider tapped a Your Market playbook step
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (PROVIDER_EVENT_TYPES in app/api/activity/track/route.ts) and this DB CHECK
-- MUST be extended together — otherwise inserts silently fail and the
-- fire-and-forget tracker swallows the rejection.
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
    -- Managed Ads funnel + Your Market (migration 105)
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
'Allowed event types including the managed-ads funnel + Your Market events. Last update: migration 105 (managed_ads_and_your_market_events).';

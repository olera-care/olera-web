-- Migration: market_diagnostic_viewed_no_leads provider event
--
-- Context: When a provider with NO local leads lands on the "Find Families"
-- tab, they now see the "Your Market" diagnostic (compute-on-visit, PR #924)
-- instead of lead cards. We want real-time visibility into who's landing
-- there with an empty local funnel — both a Slack alert and an Activity
-- Center feed row. This is the canonical signal that a provider is seeing
-- the market product but has no families to connect with yet.
--
-- market_diagnostic_viewed_no_leads: Provider opened Find Families, has 0
-- local leads, saw "Your Market". Fires once per page visit.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (PROVIDER_EVENT_TYPES in app/api/activity/track/route.ts) and the DB
-- CHECK constraint MUST be extended together — otherwise inserts silently
-- fail at the DB layer (the fire-and-forget tracker swallows the rejection).
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
    -- Provider outreach tracking (Find Families page)
    'matches_page_viewed',
    'matches_card_clicked',
    'matches_message_generated',
    'matches_outreach_sent',
    'market_diagnostic_viewed_no_leads',
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
'Allowed event types including market_diagnostic_viewed_no_leads (provider with no local leads viewed Your Market). Last update: migration 100 (market_diagnostic_no_leads_event).';

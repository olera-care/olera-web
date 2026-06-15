-- Migration: market_outreach_status_updated provider event
--
-- Context: The provider "Your Market" referral call-sheet persists outreach
-- status in market_referral_outreach. This event mirrors each call-sheet save
-- into provider_activity so admin activity, provider timelines, and the weekly
-- digest conversion model can see when providers are doing market-building work.
--
-- market_outreach_status_updated: Provider updated a referral target status
-- in the Your Market call-sheet. Metadata carries target_id, target_name,
-- previous_status, status, and source.
--
-- Keep this app allowlist + DB CHECK in lockstep. See docs/POSTMORTEMS.md.

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
'Allowed event types including market_outreach_status_updated (provider updated a Your Market referral target). Last update: migration 103 (market_outreach_status_event).';

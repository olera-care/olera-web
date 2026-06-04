-- Migration: continue_in_inbox provider event
--
-- Context: Adds tracking for when providers click "Continue in Inbox" from the
-- lead drawer on /provider/connections. This indicates high engagement - the
-- provider wants to message the family through their own email client.
--
-- Per feedback_event_allowlist_needs_db_migration.md: the app allowlist
-- (PROVIDER_EVENT_TYPES in app/api/activity/track/route.ts) and the DB
-- CHECK constraint MUST be extended together.
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
    -- Provider outreach tracking
    'matches_page_viewed',
    'matches_card_clicked',
    'matches_message_generated',
    'matches_outreach_sent',
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
'Allowed event types including continue_in_inbox for lead engagement tracking. Last update: migration 098 (continue_in_inbox).';

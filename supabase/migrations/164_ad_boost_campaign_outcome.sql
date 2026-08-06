-- Migration: Ad Boost campaign-level outcome capture
--
-- Every outcome the platform can record today hangs on a connection_id:
-- connections.metadata.provider_outcome, written from the one-tap
-- /provider/lead-outcome page. That means the "did this become a client?"
-- question can only reach campaigns that already produced an attributed lead
-- row — sendDueLeadOutcomePings bails outright at
-- lib/ad-boost/outcome-pings.server.ts:108 (`if (leads.length === 0) continue`).
--
-- So the campaigns most likely to be MIS-measured are precisely the ones the
-- question never reaches. Franchil is the proof: a $36.50 flight produced a
-- real paying client who phoned the office directly, no inquiry row, and the
-- platform reported zero. Four more campaigns are sitting at zero attributed
-- leads right now with no mechanism that will ever ask them.
--
-- This hangs the same question on the CAMPAIGN instead of a lead, so a flight
-- with no attributed leads can still report a real one. Asked in the
-- promo-complete wrap-up (the provider is already reading it) via the same
-- scanner-safe one-tap chain: email <a> -> client page -> POST-on-mount.
--
-- Vocabulary is deliberately identical to connections.metadata.provider_outcome
-- ('client' | 'talking' | 'no') so the two sensors roll up together instead of
-- inventing a second dialect.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS provider_reported_outcome TEXT;

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS provider_reported_outcome_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_campaign_requests_provider_reported_outcome_check'
  ) THEN
    ALTER TABLE ad_campaign_requests
      ADD CONSTRAINT ad_campaign_requests_provider_reported_outcome_check
      CHECK (
        provider_reported_outcome IS NULL
        OR provider_reported_outcome IN ('client', 'talking', 'no')
      );
  END IF;
END $$;

COMMENT ON COLUMN ad_campaign_requests.provider_reported_outcome IS
'Provider self-report for the whole flight: did any family reach them directly (phone/website) rather than through an Olera inquiry. client | talking | no. Same vocabulary as connections.metadata.provider_outcome. Captured one-tap from the promo-complete wrap-up email; last write wins so a later, better-informed answer upgrades an earlier one.';

COMMENT ON COLUMN ad_campaign_requests.provider_reported_outcome_at IS
'When provider_reported_outcome was recorded. NULL = never answered, which is distinct from an answer of ''no''.';

-- New provider_activity event type. The CHECK constraint rejects unlisted
-- values, and the insert fails SILENTLY from the app's perspective unless the
-- allowlist is extended here first. Postgres has no "add value to CHECK" verb,
-- so the entire list must be restated.
--
-- BASE: migration 156 (referral_tool_events), the most recent rewrite -- NOT
-- 149, which is merely the last one that happened to mention Ad Boost. 155 and
-- 156 both rewrote this constraint after 149, so building on 149 silently drops
-- one_click_failed, referral_call_clicked and referral_source_viewed and the
-- ALTER then fails against existing rows. Verified against the live table:
-- these 74 values cover every event_type present.
--
-- If you add another event type later, base it on THIS migration, not on
-- whichever one you last edited.
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
    'one_click_failed',
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
    'referral_source_viewed',
    'referral_call_clicked',
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
    'ad_lead_outcome_reported',
    'ad_campaign_outcome_reported'
  )
);

COMMENT ON CONSTRAINT provider_activity_event_type_check ON provider_activity IS
'Allowed event types including ad_campaign_outcome_reported for campaign-level Ad Boost outcome capture. Last update: migration 164 (ad_boost_campaign_outcome).';

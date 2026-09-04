-- Migration: Pause provider-facing Ad Boost email per campaign
--
-- Context: `ad_boost_lead_delivered` fires automatically the moment a managed-ad
-- inquiry lands — no operator in the loop. Its subject line is "Your Find Families
-- campaign brought in a new family."
--
-- That is correct behaviour for a campaign we believe in. It is wrong for one we are
-- actively experimenting on. On 2026-09-04 Franchil's campaign had served 1 impression
-- in 12 days; we restored its keywords, detached the shared negative list and doubled
-- its budget the same afternoon. If an inquiry had arrived that weekend the provider
-- would have received a congratulatory email about a campaign we were mid-diagnosis on,
-- crediting work whose outcome we did not yet know.
--
-- This adds a per-campaign pause so a campaign under active investigation stops talking
-- to the provider without muting anything else. It is deliberately narrow: it does NOT
-- affect the family, the provider's Olera inbox, or the provider lead-alert SMS. The
-- lead still arrives; only the celebratory email is withheld.
--
-- Un-pausing is a deliberate act. The reason column exists so a future reader knows why
-- the campaign went quiet rather than assuming the email path is broken.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS provider_comms_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_comms_paused_reason TEXT;

COMMENT ON COLUMN ad_campaign_requests.provider_comms_paused_at IS
  'When automated provider-facing Ad Boost email was paused for this campaign. Non-null means ad_boost_lead_delivered will not send. Set while a campaign is under active experiment, so the provider is not congratulated on a result we are still diagnosing. Does not affect the lead itself, the provider inbox, or lead-alert SMS.';

COMMENT ON COLUMN ad_campaign_requests.provider_comms_paused_reason IS
  'Why provider email was paused, in plain language. Shown in the admin queue and the campaign detail page so a quiet campaign reads as deliberate rather than broken.';

-- Franchil's August campaign: paused the same day we changed its keywords, negative
-- list and budget. See ad_campaign_log for the full case.
UPDATE ad_campaign_requests
   SET provider_comms_paused_at = NOW(),
       provider_comms_paused_reason =
         'Under active experiment: keywords restored, shared negative list detached, budget doubled on 2026-09-04. Campaign has served 1 impression in 12 days and the provider was already told on 23 Aug that it launched. Do not send a "your campaign brought in a family" email until we know whether the fix worked.'
 WHERE campaign_tag = 'franchil-killeen-90d-aug26';

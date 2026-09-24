-- An ad can belong to a provider's campaign.
--
-- Until now an ad and a provider campaign were joined by one hardcoded line in
-- lib/city-ads/config.ts ("pascagoula-ms belongs to Hoop"), used only to credit
-- an ACCEPTED offer to her dashboard. Her Meta instant form produced seven
-- leads and her campaign read one, because a lead that never went through the
-- offer relay never reached her at all.
--
-- city_campaigns.request_id names the provider campaign an ad belongs to (its
-- primary provider). A lead from that ad is handed to that provider, graded by
-- what we know about it, instead of waiting for the city pool. NULL keeps
-- today's behaviour: an Olera-funded city arm routes through the pool.
--
-- A provider campaign's own Google campaign stays on
-- ad_campaign_requests.platform_campaign_id and is NOT duplicated here: the
-- metrics sync writes by platform_campaign_id and one platform id must never
-- back two rows.
ALTER TABLE public.city_campaigns
  ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.ad_campaign_requests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS city_campaigns_request_id_idx ON public.city_campaigns(request_id) WHERE request_id IS NOT NULL;
COMMENT ON COLUMN public.city_campaigns.request_id IS
  'Provider campaign this ad belongs to (its primary provider). Leads from it are handed to that provider. NULL = Olera-funded city arm, routed through city_pool.';

-- When a lead was handed to its ad's primary provider, and to which campaign.
-- handed_at set means the provider can see it on their campaign page, the
-- relay leaves it alone, and nobody on our side calls it.
ALTER TABLE public.city_leads
  ADD COLUMN IF NOT EXISTS handed_at timestamptz,
  ADD COLUMN IF NOT EXISTS handed_request_id uuid REFERENCES public.ad_campaign_requests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS city_leads_handed_request_idx ON public.city_leads(handed_request_id) WHERE handed_request_id IS NOT NULL;

-- A provider recording how a handed family went, from their campaign page.
ALTER TABLE public.city_leads DROP CONSTRAINT IF EXISTS city_leads_outcome_source_check;
ALTER TABLE public.city_leads ADD CONSTRAINT city_leads_outcome_source_check
  CHECK (outcome_source IS NULL OR outcome_source IN ('provider_sms', 'family_sms', 'admin', 'provider_app'));

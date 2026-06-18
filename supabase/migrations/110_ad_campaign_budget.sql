-- Managed Ads: capture the provider's INTENDED monthly budget on the request.
--
-- v1 is concierge / intent-capture only: this is a non-binding budget the
-- provider picks in the boost flow that SEEDS the concierge conversation. It is
-- NOT a charge and NOT a commitment — per the Managed Ads terms (§4), budget and
-- payment are confirmed directly with the provider before any spend beyond the
-- introductory $50. No payment columns here on purpose; Stripe stays inert.
--
-- Whole dollars/month. NULL = the provider hasn't chosen one (legacy rows, or a
-- request created before this column existed). Allowed values are enforced in the
-- app (lib/ad-boost/estimate.ts BUDGET_VALUES); kept open here so retuning the
-- stops never needs a migration.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS intended_monthly_budget INTEGER;

COMMENT ON COLUMN ad_campaign_requests.intended_monthly_budget IS
  'Provider-chosen intended monthly ad budget in whole USD (non-binding; concierge confirms before spend). NULL = not chosen.';

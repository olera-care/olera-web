-- Ad Boost Phase 2 — paid plan billing state (Stripe subscriptions).
--
-- Monetization plan of record (2026-07-06, Notion "Ad Boost Monetization +
-- Budget-Step UX — Handoff"): after the free intro campaign, a provider can
-- continue on a flat all-in monthly plan (Starter $150 / Growth $300 / Scale
-- $600+). The ONLY payment moment is the post-intro wrap-up; checkout is a
-- Stripe subscription created by /api/provider/ad-boost/checkout and activated
-- by the Stripe webhook (Supabase Edge Function stripe-webhook, mirrored at
-- app/api/stripe/webhook).
--
-- plan_status is TEXT + CHECK (NOT a Postgres enum) per production convention.
-- All columns nullable + additive, so safe to apply ahead of the deploy on the
-- shared instance. NULL plan_status = never subscribed (intro-only provider).

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS plan_status TEXT
    CHECK (plan_status IS NULL OR plan_status IN ('active','past_due','canceled')),
  ADD COLUMN IF NOT EXISTS plan_value INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ;

-- Webhook lookups map Stripe subscription events back to the campaign row.
CREATE INDEX IF NOT EXISTS idx_acr_stripe_sub
  ON ad_campaign_requests(stripe_subscription_id);

COMMENT ON COLUMN ad_campaign_requests.plan_status IS
  'Paid plan lifecycle from Stripe: active | past_due | canceled. NULL = never subscribed.';
COMMENT ON COLUMN ad_campaign_requests.plan_value IS
  'Subscribed monthly plan in whole USD (150/300/600). Distinct from intended_monthly_budget (pre-checkout intent).';
COMMENT ON COLUMN ad_campaign_requests.stripe_customer_id IS
  'Stripe customer for this provider''s Ad Boost subscription.';
COMMENT ON COLUMN ad_campaign_requests.stripe_subscription_id IS
  'Stripe subscription backing the active plan.';
COMMENT ON COLUMN ad_campaign_requests.subscribed_at IS
  'When checkout.session.completed activated the plan.';

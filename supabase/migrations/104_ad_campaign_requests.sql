-- Provider Paid Ad Boost (Managed Lead-Gen, concierge v1): campaign request queue.
--
-- A provider who clears the profile-completeness gate (>=70%, see
-- lib/ad-boost/eligibility.ts) requests a done-for-you external ad campaign
-- (Google/Meta) and picks a setup week. Each row is one such request; the
-- concierge team works it through the status lifecycle and we attribute the
-- families it drives back via `campaign_tag` (the utm_campaign on the ads).
--
-- Status is TEXT + CHECK (NOT a Postgres enum) to match this project's
-- production convention — see memory feedback_schema_text_not_enum.
--
-- All access is server-side via authenticated routes using the service-role
-- client, so RLS is enabled with no public policies (service role bypasses RLS;
-- anon/authenticated keys get nothing directly). Mirrors 097_market_referral_outreach.
CREATE TABLE IF NOT EXISTS ad_campaign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,            -- business_profiles.id of the requesting provider
  provider_slug TEXT,                   -- denormalized for the landing URL + admin display
  display_name TEXT,                    -- denormalized provider name for the admin queue
  requested_setup_week DATE NOT NULL,   -- Monday of the week the provider chose to set up
  completeness_at_submit INTEGER,       -- weighted completeness score (0-100) at submit time
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','scheduled','live','ended','cancelled')),
  channel TEXT
    CHECK (channel IS NULL OR channel IN ('google','meta','both')),
  campaign_tag TEXT,                    -- utm_campaign value used to attribute delivered families
  admin_note TEXT,                      -- concierge ops notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acr_provider ON ad_campaign_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_acr_status ON ad_campaign_requests(status);
CREATE INDEX IF NOT EXISTS idx_acr_campaign_tag ON ad_campaign_requests(campaign_tag);

ALTER TABLE ad_campaign_requests ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service-role client (server API) may read/write.

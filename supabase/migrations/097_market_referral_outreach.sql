-- Provider "Your Market" workspace: per-provider outreach state on referral targets.
-- Turns the diagnostic's referral call-sheet into a tool — a provider tracks which
-- local referral sources (hospitals, rehab, hospice, AL, elder-law) they've worked.
--
-- Keyed on (provider business_profile id, google place id of the target).
-- All access is server-side via the authenticated /api/provider/market-outreach route
-- using the service-role client, so RLS is enabled with no public policies (service
-- role bypasses RLS; anon/authenticated keys get nothing directly).
CREATE TABLE IF NOT EXISTS market_referral_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,           -- business_profiles.id of the provider doing BD
  target_id TEXT NOT NULL,             -- google place id of the referral target
  target_name TEXT,                    -- denormalized for display robustness
  status TEXT NOT NULL DEFAULT 'to_contact'
    CHECK (status IN ('to_contact','contacted','responded','referring','dismissed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_mro_provider ON market_referral_outreach(provider_id);

ALTER TABLE market_referral_outreach ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service-role client (server API) may read/write.

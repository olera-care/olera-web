-- Market-diagnostic cache: one computed report per (city, state, care_type).
-- The unit of computation is CITY × care-type, shared across every provider in that market.
-- Phase 2 makes the diagnostic compute on-demand (first visit) instead of by-hand-per-city:
--   serve route reads this table; on a miss it claims a `pending` row, computes in the
--   background (Places + Census + Haiku, ~60-90s), and writes the result back here.
--
-- Concurrency: UNIQUE (city,state,care_type) lets a visitor atomically CLAIM a pending row;
-- a second simultaneous visitor loses the insert race and just polls the same row.
-- Stale-pending recovery is handled in app code (a `pending` row older than a few minutes
-- is reclaimable — the function that was computing it died).
--
-- All access is server-side via the service-role client; RLS is enabled with no policies
-- (service role bypasses RLS; anon/authenticated keys get nothing directly).
CREATE TABLE IF NOT EXISTS market_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  care_type TEXT NOT NULL,              -- 'homecare' | 'assisted_living'
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ready','failed')),
  data JSONB,                           -- the analysis object served to the client (null until ready)
  error TEXT,                           -- last failure reason (when status='failed')
  attempts INT NOT NULL DEFAULT 0,      -- compute attempts, to bound retries
  cost_estimate NUMERIC(8,4) NOT NULL DEFAULT 0,  -- est. USD spent computing this market (cost circuit-breaker)
  generated_at TIMESTAMPTZ,             -- when the current `data` was produced (TTL is measured from here)
  claimed_at TIMESTAMPTZ,               -- when the in-flight compute claimed this row (stale-pending recovery)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city, state, care_type)
);

-- Month-to-date spend guard reads cost_estimate by generated_at; index the time column.
CREATE INDEX IF NOT EXISTS idx_market_diag_generated ON market_diagnostics(generated_at);

ALTER TABLE market_diagnostics ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service-role client (server API) may read/write.

-- Migration: experiment_weights
--
-- Context: The Family Intake A/B test now has 5 arms (PR #743 added
-- qa_email_capture on top of the prior 4) and split traffic via a
-- hardcoded `mod N` on the session-id hash in lib/analytics/variant.ts.
-- That works for an even split, but the test has matured past that —
-- we want to funnel traffic into one or two arms while a candidate
-- winner ramps, and to zero out arms that are clearly losing without
-- removing the code path.
--
-- This table stores the live weight allocation per experiment. One row
-- per experiment. `weights` is a jsonb dict (variant name → integer
-- percentage 0-100, sums to 100). `version` increments on every save so
-- the variant assignment hash can namespace by version (djb2(sessionId
-- + ":v" + version)) and a save reshuffles all returning sessions in
-- one cut, instead of leaving them in their old arm forever while only
-- new visitors see the new split. That's the intended UX: when TJ
-- changes the dial, the dial actually moves for everyone.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS experiment_weights (
  experiment_id TEXT PRIMARY KEY,
  weights JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NULL
);

COMMENT ON TABLE experiment_weights IS
  'Per-experiment live traffic allocation. Read by server-side renderers + admin UI; written only by the admin weights endpoint. One row per experiment_id.';

COMMENT ON COLUMN experiment_weights.weights IS
  'jsonb dict: variant name → integer percentage. Must sum to 100. Variants not in the dict get 0% (i.e. the arm is dark). Unknown variant names are ignored at read time so removing an arm in code doesn''t require backfilling the row.';

COMMENT ON COLUMN experiment_weights.version IS
  'Monotonically increasing. Bumped on every save. Namespaced into the variant assignment hash so a weight change reshuffles returning sessions instead of grandfathering them into their old arm.';

COMMENT ON COLUMN experiment_weights.updated_by IS
  'Admin user id (auth.users.id) of whoever last saved. Optional; the endpoint sets it but is permissive on missing values for backfill.';

-- Seed the intake_variant row at 20/20/20/20/20 — matches the
-- equal-split mod-5 allocation that PR #743 (qa_email_capture launch)
-- went live with, so this migration changes nothing about the live
-- split. It just relocates the dial from code into the database, where
-- the admin UI can adjust it without a deploy. ON CONFLICT skips if
-- the row already exists (rerun-safe).
INSERT INTO experiment_weights (experiment_id, weights, version)
VALUES (
  'intake_variant',
  '{"availability":20,"loss":20,"empathic":20,"outreach":20,"qa_email_capture":20}'::jsonb,
  1
)
ON CONFLICT (experiment_id) DO NOTHING;

-- Enable RLS with zero policies. The only legitimate access path is
-- server-side via the service role client (lib/admin.ts → getServiceClient),
-- which bypasses RLS regardless. Anon + authenticated keys can't read
-- or write — correct for a config table that the public app reads
-- through the /api/variant-weights/intake server route, not directly
-- from the browser. If we ever need direct anon reads, add a policy
-- here rather than disabling RLS.
ALTER TABLE experiment_weights ENABLE ROW LEVEL SECURITY;

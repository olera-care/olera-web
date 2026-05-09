-- CTA Variant A/B experiment weights seed
--
-- Seeds the experiment_weights table with the initial cta_variant row.
-- Starts with 100% on "legacy" (the current CTA design). Traffic can be
-- reallocated via the admin dial at /admin/analytics once new variants
-- are implemented.
--
-- This migration uses ON CONFLICT DO NOTHING so it's idempotent — safe
-- to re-run if the row already exists from manual insertion or a prior
-- deploy. The version starts at 1 rather than 0 so clients can
-- distinguish "row exists" from "falling back to defaults".

INSERT INTO experiment_weights (experiment_id, weights, version)
VALUES ('cta_variant', '{"legacy":100}'::jsonb, 1)
ON CONFLICT (experiment_id) DO NOTHING;

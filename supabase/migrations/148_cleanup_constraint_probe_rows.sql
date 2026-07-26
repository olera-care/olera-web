-- Migration: Remove constraint-probe rows from provider_outreach_touchpoints
--
-- Context: During the 2026-07-26 staging -> main promotion pre-flight (PR #1392),
-- the touchpoint_type CHECK constraint was verified by INSERTing one probe row per
-- allowed type instead of reading the constraint definition. That was a mistake:
-- provider_outreach_touchpoints is append-only (trigger
-- `provider_outreach_touchpoints_no_mutate`, created in migration 136), so the rows
-- could not be removed through the REST API afterwards.
--
-- This is a ONE-TIME DATA CLEANUP, not a schema change. It leaves migration 136 and
-- its trigger exactly as they are -- the trigger is only suspended for the length of
-- the DELETE and re-armed immediately after.
--
-- Safe to re-run: the DELETE matches a sentinel provider_id that no real provider
-- uses, so on a clean database it removes zero rows and does nothing else.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Suspend the append-only guard ───────────────────────────────────────────

ALTER TABLE provider_outreach_touchpoints
  DISABLE TRIGGER provider_outreach_touchpoints_no_mutate;

-- ── Remove the probe rows ───────────────────────────────────────────────────

-- 7 rows, one per allowed touchpoint_type, all written 2026-07-26 with
-- details = {"probe": true}. The sentinel provider_id cannot collide with a real
-- provider, so no admin UI query ever surfaced them.
DELETE FROM provider_outreach_touchpoints
WHERE provider_id = '__constraint_probe__';

-- ── Re-arm the append-only guard (MUST run -- do not leave disabled) ────────

ALTER TABLE provider_outreach_touchpoints
  ENABLE TRIGGER provider_outreach_touchpoints_no_mutate;

-- ── Verify ─────────────────────────────────────────────────────────────────

-- Expect 0. If this returns rows, the DELETE did not take effect.
SELECT count(*) AS remaining_probe_rows
FROM provider_outreach_touchpoints
WHERE provider_id = '__constraint_probe__';

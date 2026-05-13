-- v9.0 Phase 8: Partner Prospect unlock flag.
--
-- Partner Prospects (the university research queue card + downstream
-- stakeholder ops) are gated on having at least one client provider in
-- the Site's catchment. Activating a Site alone no longer auto-queues
-- a research card — Sites are passive containers until a catchment
-- conversion fires the unlock.
--
-- The gate is computed at read time from current catchment-client
-- state. This timestamp is the sticky record that work was permitted
-- to begin: once set, it stays set even if the only catchment client
-- later churns. Sticky semantics protect in-progress research from
-- disappearing if a client provider lapses; once a Partner Prospect
-- has been worked, history doesn't vanish.
--
-- Set lazily at runtime by the queue endpoint when a campus newly
-- satisfies the catchment-client predicate. The one-time backfill
-- below covers legacy data: any campus that already accumulated
-- stakeholder rows (kind != 'provider') in research statuses
-- represents Partner Prospect work already in flight pre-gate — those
-- get backfilled to the earliest stakeholder's created_at so the gate
-- doesn't retroactively hide them.

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS partner_prospect_unlocked_at TIMESTAMPTZ;

-- Backfill legacy: campuses with any non-provider stakeholder rows
-- get unlocked_at set to the earliest such row's created_at. Idempotent
-- via the IS NULL guard.
UPDATE student_outreach_campuses sc
SET partner_prospect_unlocked_at = (
  SELECT MIN(so.created_at)
  FROM student_outreach so
  WHERE so.campus_id = sc.id
    AND COALESCE(so.kind, '') <> 'provider'
)
WHERE partner_prospect_unlocked_at IS NULL
  AND EXISTS (
    SELECT 1 FROM student_outreach so
    WHERE so.campus_id = sc.id
      AND COALESCE(so.kind, '') <> 'provider'
  );

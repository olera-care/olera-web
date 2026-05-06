-- ===========================================================================
-- 073 — Allow kind='provider' rows in student_outreach
-- ===========================================================================
-- v9.0 Phase 2 Tier 3.5: provider prospects materialize into student_outreach
-- with kind='provider'. The original v7 schema (migration 064) constrained
-- stakeholder_type to ('student_org','advisor','professor','dept_head') and
-- declared it NOT NULL. Provider rows don't have a stakeholder_type at all —
-- their discriminator is `kind='provider'` (added in migration 072).
--
-- This migration:
--   1. Drops the legacy stakeholder_type CHECK so the column accepts NULL
--      for provider rows. Stakeholder rows still set one of the four legacy
--      values; we re-add a conditional CHECK keyed on kind below.
--   2. Drops the NOT NULL on stakeholder_type. NULL is the canonical value
--      for kind='provider' rows.
--   3. Adds a conditional CHECK that mirrors the original constraint for
--      kind != 'provider' but allows NULL for kind = 'provider'.
--
-- No data backfill needed: all existing rows have kind in
-- ('student_org','advisor','professor','dept_head') with stakeholder_type
-- matching (per migration 072's backfill), so the new conditional CHECK
-- holds for them out of the box.
-- ===========================================================================

-- Drop the legacy CHECK that forbade NULL stakeholder_type.
-- The constraint name is auto-generated; we drop it via the conventional
-- pattern (find via pg_constraint, drop). Wrap in DO block so it works
-- even if the constraint name varies.
DO $$
DECLARE
  cons_name TEXT;
BEGIN
  SELECT conname INTO cons_name
    FROM pg_constraint
   WHERE conrelid = 'student_outreach'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%stakeholder_type%IN%';
  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE student_outreach DROP CONSTRAINT %I', cons_name);
  END IF;
END $$;

-- Drop NOT NULL.
ALTER TABLE student_outreach
  ALTER COLUMN stakeholder_type DROP NOT NULL;

-- Add a conditional CHECK: stakeholder_type stays one of the legacy
-- values for non-provider rows; for provider rows it must be NULL.
-- Idempotent: drop existing if present, then add.
ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_stakeholder_type_kind_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_stakeholder_type_kind_check
    CHECK (
      (kind = 'provider' AND stakeholder_type IS NULL)
      OR
      (kind <> 'provider' AND stakeholder_type IN ('student_org','advisor','professor','dept_head'))
    );

COMMENT ON COLUMN student_outreach.stakeholder_type IS
  'Legacy v7 discriminator for campus stakeholders. NULL when kind=''provider''. '
  'For all other kinds, must be one of student_org / advisor / professor / dept_head.';

-- ===========================================================================
-- 252 — let an event be a stakeholder type
-- ===========================================================================
-- 250 widened student_outreach.kind to accept 'event' and stopped there.
-- stakeholder_type has its own constraints — two of them — and neither knew
-- about events, so adding one to the campus events sweep failed with
--
--   new row for relation "student_outreach" violates check constraint
--   "student_outreach_stakeholder_type_check"
--
-- and nothing was saved. Advisors, orgs and professors were unaffected:
-- their stakeholder types were already in both lists. Only events, which
-- were the one section that needed a new value.
--
-- Two constraints because 064 created a column-level CHECK and 073 added a
-- conditional one beside it, intending to replace it. Its drop matched on
-- the constraint definition and left the column-level one standing, so both
-- are live and both have to be widened. Reproduced against a copy of the
-- real table before writing this, rather than inferred from the message.
-- ===========================================================================

-- ── the column-level check from 064 ───────────────────────────────────────
ALTER TABLE student_outreach DROP CONSTRAINT IF EXISTS student_outreach_stakeholder_type_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_stakeholder_type_check
  CHECK (
    stakeholder_type IS NULL
    OR stakeholder_type IN ('student_org', 'advisor', 'professor', 'dept_head', 'event')
  );

-- ── the conditional check from 073 ────────────────────────────────────────
ALTER TABLE student_outreach DROP CONSTRAINT IF EXISTS student_outreach_stakeholder_type_kind_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_stakeholder_type_kind_check
  CHECK (
    (kind = 'provider' AND stakeholder_type IS NULL)
    OR
    (kind <> 'provider' AND stakeholder_type IN
      ('student_org', 'advisor', 'professor', 'dept_head', 'event'))
  );

COMMENT ON COLUMN student_outreach.stakeholder_type IS
  'Campus stakeholder discriminator. NULL when kind=''provider''. For every '
  'other kind, one of student_org / advisor / professor / dept_head / event.';

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'student_outreach'::regclass
  AND conname LIKE '%stakeholder_type%'
ORDER BY conname;

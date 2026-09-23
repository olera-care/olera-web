-- ===========================================================================
-- 253 — who owns which task type at which university
-- ===========================================================================
-- One row means "this person owns this task type at this campus". Assigning
-- somebody to Advisors at Bloomington gives them every advisor task there,
-- now and any created later, because the assignment is on the section rather
-- than on the individual tasks.
--
-- The UNIQUE (campus_id, section) is the rule, not a hint. One owner per task
-- type per campus is impossible to break — not by a second tab, not by a
-- race, not by a future caller that forgets. Unassigning deletes the row.
--
-- This is a view, not a permission. Nothing here gates who may work what;
-- every admin can still open and log anything. It organises attention.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS medjobs_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id     UUID NOT NULL REFERENCES student_outreach_campuses(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  -- Mirrors SECTION_ORDER in lib/medjobs/ladders.ts. A section added there
  -- needs a line here, and the board's assign route refuses anything this
  -- list does not name, so the two cannot drift silently.
  section       TEXT NOT NULL CHECK (
    section IN ('providers', 'students', 'jobboard', 'advisors', 'orgs', 'events', 'professors')
  ),
  assigned_by   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_medjobs_assignment_section UNIQUE (campus_id, section)
);

-- "Everything Grazy owns" is the My work filter's whole question.
CREATE INDEX IF NOT EXISTS idx_medjobs_assignments_person
  ON medjobs_assignments (admin_user_id);

ALTER TABLE medjobs_assignments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_assignments IS
  'Who owns which task type at which campus. One owner per (campus, section), '
  'enforced by uq_medjobs_assignment_section. Owning a section means owning '
  'every task in it, including tasks created later. Read by the MedJobs task '
  'board for the assignee chips and the My work filter. Not a permission: it '
  'does not gate who may work a task.';

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'medjobs_assignments'::regclass
ORDER BY conname;

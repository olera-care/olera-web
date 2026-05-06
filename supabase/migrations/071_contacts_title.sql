-- ─────────────────────────────────────────────────────────────────────────
-- Migration 071 — Contact title (Dr., Mr., Ms., Prof., etc).
--
-- Optional formal title used by email templates for stakeholder types
-- where surname-based salutation is the norm (department heads,
-- professors). Resolved by `salutationFor()` in lib/student-outreach/
-- templates.ts:
--
--   dept_head / professor with title  →  "{title} {last_name}"  ("Dr. Smith")
--   dept_head / professor without it  →  "{last_name}"          ("Smith")
--   advisor / student_org             →  "{first_name}"         ("Marcus")
--
-- Default is null. Forms prefill "Dr." for dept_head/professor at create
-- time; admins can override or clear.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE student_outreach_contacts
  ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN student_outreach_contacts.title IS
  'Optional formal title (Dr., Prof., Mr., Ms.). Drives email salutation for dept_head + professor stakeholder types.';

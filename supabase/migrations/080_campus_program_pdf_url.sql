-- v9 final: per-campus Program PDF override.
--
-- The attachment system has a code-defined registry of
-- per-university PDFs (lib/program-pdf/configs/<slug>.ts) keyed
-- by student_outreach_campuses.slug. That's the brand-consistent
-- default — adding a new campus is a TS file copy + register.
--
-- This column is the escape hatch: an admin who wants to attach
-- a bespoke PDF for one campus (custom branding, alternate copy,
-- regional packet) sets program_pdf_url on the campus row and
-- the attachment loader prefers it over the code template.
--
-- Resolution order in lib/student-outreach/email-send.ts →
-- loadProgramPdfAttachment:
--   1. student_outreach_campuses.program_pdf_url  (this column)
--   2. lib/program-pdf/configs/<campus.slug>.ts   (code registry)
--   3. STUDENT_OUTREACH_FLYER_URL env var          (legacy fallback)
--   4. No attachment                               (silent)
--
-- The column stays nullable — most campuses ride on the template
-- and never set an override. The admin upload UI ships in a
-- follow-up commit; until then this column is settable via
-- supabase SQL or a future admin endpoint.

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS program_pdf_url TEXT;

COMMENT ON COLUMN student_outreach_campuses.program_pdf_url IS
  'v9 final: optional per-campus PDF attachment URL. When set, '
  'overrides the code-registered template config '
  '(lib/program-pdf/configs/<slug>.ts) for outbound provider '
  'outreach emails. Falls through to env-var generic flyer if NULL '
  'and no code config exists for this campus.';

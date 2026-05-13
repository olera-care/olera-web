-- Link email_log rows to the cron run that produced them.
--
-- Phase 2 of the Automation Console wants a per-recipient table on a run: who
-- got that send, who opened / clicked / bounced. We don't thread a run id
-- through sendEmail (too invasive — sends happen from dozens of call sites).
-- Instead withCronRun() claims, at run-end, every email_log row whose
-- email_type is one the job sends, created since the run started, not already
-- claimed (see lib/crons/run.ts:stampEmails). Nullable: rows from non-cron
-- sends, or sends before this migration, stay NULL.
--
-- The Console's GET routes fail soft if this column is absent, so applying this
-- after the code ships is fine.

ALTER TABLE email_log
  ADD COLUMN IF NOT EXISTS cron_run_id UUID REFERENCES cron_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_log_cron_run_id
  ON email_log (cron_run_id) WHERE cron_run_id IS NOT NULL;

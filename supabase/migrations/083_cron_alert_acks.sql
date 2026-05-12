-- Migration: Automation Console alert acknowledgements.
--
-- The /admin/automations cockpit auto-flags issues (errored runs, 0-send email
-- jobs, low-delivered jobs, spam complaints). This table lets an operator
-- dismiss one — either "snooze" (re-appears after snooze_until) or "acknowledge"
-- (snooze_until NULL → suppressed indefinitely, but the cockpit re-surfaces it if
-- the underlying value degrades past value_at_ack). Shared across the team, like
-- cron_runs / cron_config.
--
-- alert_key is a stable identifier for the *issue*, not the run — e.g.
-- "no_sends:verification-reminders", "low_delivered:group", "errored:medjobs-digest",
-- "complaints:family-nudges". value_at_ack is the numeric the cockpit compares
-- against on re-render (a delivery %, a complaint count, a group size) — NULL when
-- there's nothing meaningful to compare (then "acknowledge" just suppresses it
-- until the alert stops being computed).
--
-- Apply via the Supabase dashboard (NOT the CLI), same as 082.

CREATE TABLE IF NOT EXISTS cron_alert_acks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        TEXT NOT NULL,                 -- registry job id, or "group" for grouped alerts
  alert_key     TEXT NOT NULL,                 -- stable issue identifier
  value_at_ack  NUMERIC,                       -- the metric at ack time (delivery %, complaint count, group size); NULL if N/A
  snooze_until  TIMESTAMPTZ,                   -- re-appears after this; NULL = acknowledged indefinitely (until it degrades / clears)
  acked_by      TEXT NOT NULL,                 -- admin email
  acked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note          TEXT,
  UNIQUE (job_id, alert_key)                   -- one ack per issue; re-acking upserts
);

CREATE INDEX IF NOT EXISTS idx_cron_alert_acks_job ON cron_alert_acks (job_id);

ALTER TABLE cron_alert_acks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cron_alert_acks"
  ON cron_alert_acks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE cron_alert_acks IS
  'Operator dismissals of Automation Console alerts. snooze_until in the future = snoozed; NULL = acknowledged indefinitely (re-surfaces only if value degrades past value_at_ack). Read/written by /api/admin/automations.';

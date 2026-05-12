-- Migration: Cron observability — run history + pause control for the
-- Automation Console (admin surface for the codebase's automated email/data jobs).
--
-- Today the 16 cron jobs in vercel.json -> app/api/cron/* have no persisted
-- record of what they did. The only window is console.log in Vercel's runtime
-- logs. This ships the two tables the /admin/automations page reads:
--
--   cron_runs   — one row per execution (incl. manual admin-triggered fires)
--   cron_config — per-job enable/pause state (no-deploy pause button)
--
-- The job registry (id, name, description, schedule, category, kind, email
-- types) lives in code at lib/crons/registry.ts — it's the source of truth the
-- page renders; these tables only hold mutable state. A paused job still runs
-- on schedule and writes a `skipped_paused` cron_runs row every time, so a
-- forgotten pause can't hide.
--
-- RLS: service-role only (mirrors email_log / email_events). The admin API
-- routes use the service client; there is no public access.
--
-- Apply via the Supabase dashboard (NOT the CLI), same as 051.

-- ── Run history ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cron_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        TEXT NOT NULL,                       -- matches lib/crons/registry.ts id
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'ok', 'error', 'skipped_paused')),
  summary       JSONB NOT NULL DEFAULT '{}',         -- freeform: {processed, sent, skipped, skipReasons, ...}
  error         TEXT,
  triggered_by  TEXT NOT NULL DEFAULT 'cron'         -- 'cron' | 'admin:<email>'
);

-- Dominant query: "last N runs for this job" and "latest run per job".
CREATE INDEX IF NOT EXISTS idx_cron_runs_job_started
  ON cron_runs (job_id, started_at DESC);

-- Recent-runs scan across all jobs (admin home / debugging).
CREATE INDEX IF NOT EXISTS idx_cron_runs_started
  ON cron_runs (started_at DESC);

-- Open/stuck-run detection (status='running' with an old started_at).
CREATE INDEX IF NOT EXISTS idx_cron_runs_status
  ON cron_runs (status) WHERE status = 'running';

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cron_runs"
  ON cron_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── Pause / enable state ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cron_config (
  job_id         TEXT PRIMARY KEY,                   -- matches lib/crons/registry.ts id
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  paused_at      TIMESTAMPTZ,
  paused_by      TEXT,                               -- admin email who paused it
  paused_reason  TEXT,
  paused_until   TIMESTAMPTZ,                        -- auto-reenable point; NULL = until manually resumed
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cron_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cron_config"
  ON cron_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE cron_runs IS
  'One row per cron execution. Written by withCronRun() in lib/crons/run.ts. Read by /admin/automations.';
COMMENT ON TABLE cron_config IS
  'Per-job pause state for the Automation Console. Absent row = enabled (default). paused_until auto-reenables; a paused job still logs a skipped_paused run each cycle.';

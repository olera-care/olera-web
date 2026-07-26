-- Migration: Provider Outreach Tasks
--
-- Unified task queue for provider outreach email sequences.
-- Supports scheduled auto-send (cron picks up due tasks) and
-- manual intervention (admin can cancel/reschedule).
--
-- Similar to student_outreach_tasks but simpler: no approval
-- subsystem, no stakeholder types. Just scheduled emails.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Tasks table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_outreach_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References provider_outreach_tracking.id
  tracking_id     UUID NOT NULL,

  -- Provider slug (denormalized for efficient queries)
  provider_id     TEXT NOT NULL,

  -- Task type: what action to take
  task_type       TEXT NOT NULL CHECK (task_type IN (
    'outreach_email_send',   -- scheduled auto-send email
    'manual_followup'        -- escalate to admin
  )),

  -- Which template/cadence day this task is for
  cadence_day     INT NOT NULL DEFAULT 0,
  template_key    TEXT NOT NULL CHECK (template_key IN (
    'intro',        -- Day 0
    'followup',     -- Day 3
    'demand_loss',  -- Day 7
    'final',        -- Day 14
    'nudge'         -- Standalone resend
  )),

  -- When to execute (cron scans for due tasks)
  due_at          TIMESTAMPTZ NOT NULL,

  -- Task status
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending',     -- waiting for due_at
                      'completed',   -- sent successfully
                      'failed',      -- send failed (will retry or escalate)
                      'cancelled',   -- admin cancelled
                      'superseded'   -- replaced by newer task
                    )),

  -- Rich payload for send context and outcome tracking
  payload         JSONB NOT NULL DEFAULT '{}',
  -- Example payload:
  -- {
  --   "subject": "Your Provider Name profile on Olera",
  --   "recipient_email": "admin@provider.com",
  --   "outcome": "sent" | "bounced" | "skipped_no_email",
  --   "error": "...",
  --   "resend_id": "..."
  -- }

  notes           TEXT,

  -- Completion tracking
  completed_at    TIMESTAMPTZ,

  -- Audit fields
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient task processing

-- Primary: cron scans for pending tasks that are due
CREATE INDEX IF NOT EXISTS idx_po_tasks_due
  ON provider_outreach_tasks (due_at)
  WHERE status = 'pending';

-- Lookup tasks by tracking row
CREATE INDEX IF NOT EXISTS idx_po_tasks_tracking
  ON provider_outreach_tasks (tracking_id, status);

-- Lookup tasks by provider
CREATE INDEX IF NOT EXISTS idx_po_tasks_provider
  ON provider_outreach_tasks (provider_id);

-- ── Auto-update updated_at trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION provider_outreach_tasks_set_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS provider_outreach_tasks_updated_at ON provider_outreach_tasks;
CREATE TRIGGER provider_outreach_tasks_updated_at
  BEFORE UPDATE ON provider_outreach_tasks
  FOR EACH ROW EXECUTE FUNCTION provider_outreach_tasks_set_updated_at();

-- ── RLS: service-role only (admin pages go through API routes) ────────────

ALTER TABLE provider_outreach_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on provider_outreach_tasks"
  ON provider_outreach_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Add foreign key to provider_outreach_tracking ─────────────────────────
-- Note: This assumes provider_outreach_tracking table exists (migration 131).
-- If it doesn't exist yet in your DB, comment this out.

ALTER TABLE provider_outreach_tasks
  ADD CONSTRAINT fk_po_tasks_tracking
  FOREIGN KEY (tracking_id)
  REFERENCES provider_outreach_tracking(id)
  ON DELETE CASCADE;

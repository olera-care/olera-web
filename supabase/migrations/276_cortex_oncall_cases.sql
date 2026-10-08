-- Cortex on call: one row per Slack thread where someone mentioned Cortex
-- about a bug or a change (lib/war-room/oncall.ts).
--
-- Cortex plans in the thread; TJ's "@Cortex go" starts a Claude Code routine
-- that ends at a pull request to staging; a cron finds the PR by the marker
-- "cortex-oncall:<id>" in its body and posts it back in the thread.
--
-- Service role only: RLS on, no policies. Additive.

CREATE TABLE IF NOT EXISTS cortex_oncall_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  -- The thread's parent message: the case is the thread.
  thread_ts text NOT NULL,
  -- Slack user id of whoever first mentioned Cortex.
  requested_by text,
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'building', 'pr_open', 'merged', 'failed', 'dropped')),
  -- The latest plan Cortex posted.
  plan text,
  -- The brief handed to the build routine.
  brief text,
  session_url text,
  pr_url text,
  build_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, thread_ts)
);

CREATE INDEX IF NOT EXISTS cortex_oncall_cases_status ON cortex_oncall_cases (status, updated_at DESC);

ALTER TABLE cortex_oncall_cases ENABLE ROW LEVEL SECURITY;

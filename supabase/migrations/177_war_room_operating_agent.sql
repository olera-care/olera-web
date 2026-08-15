-- War Room operating-agent control plane.
--
-- Discovery is autonomous and read-only. A proposal must be explicitly
-- approved before an execution job can be dispatched, and the executor may
-- create a reviewable branch/PR only. Shipping remains a separate human act.

CREATE TABLE IF NOT EXISTS war_room_source_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source                text NOT NULL CHECK (source IN ('slack', 'notion')),
  external_id           text NOT NULL,
  source_group          text NOT NULL,
  source_kind           text NOT NULL,
  title                 text NOT NULL,
  content               text NOT NULL,
  source_url            text,
  occurred_at           timestamptz NOT NULL,
  last_edited_at        timestamptz,
  freshness             text NOT NULL DEFAULT 'current'
    CHECK (freshness IN ('current', 'aging', 'stale')),
  trust                 text NOT NULL DEFAULT 'context'
    CHECK (trust IN ('context', 'corroborated')),
  content_hash          text NOT NULL,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at           timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_war_room_source_items_recent
  ON war_room_source_items (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_war_room_source_items_group_recent
  ON war_room_source_items (source, source_group, occurred_at DESC);

CREATE TABLE IF NOT EXISTS war_room_source_state (
  source_key            text PRIMARY KEY,
  cursor                text,
  last_synced_at        timestamptz,
  last_success_at       timestamptz,
  last_error            text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS war_room_discovery_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status                text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  trigger               text NOT NULL CHECK (trigger IN ('scheduled', 'manual')),
  requested_by          text NOT NULL,
  model                 text NOT NULL,
  source_summary        jsonb NOT NULL DEFAULT '{}'::jsonb,
  candidate_count       integer NOT NULL DEFAULT 0,
  proposal_count        integer NOT NULL DEFAULT 0,
  critic_review         jsonb,
  input_tokens          integer,
  output_tokens         integer,
  error_message         text,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_war_room_discovery_runs_recent
  ON war_room_discovery_runs (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_war_room_discovery_one_active
  ON war_room_discovery_runs ((true))
  WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS war_room_proposals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id      uuid REFERENCES war_room_discovery_runs(id) ON DELETE SET NULL,
  fingerprint           text NOT NULL UNIQUE,
  status                text NOT NULL DEFAULT 'proposed'
    CHECK (status IN (
      'proposed', 'approved', 'dispatching', 'executing', 'review_ready',
      'rejected', 'completed', 'failed', 'superseded'
    )),
  action_kind           text NOT NULL DEFAULT 'code'
    CHECK (action_kind IN ('code', 'operations', 'research')),
  title                 text NOT NULL,
  finding               text NOT NULL,
  why_now               text NOT NULL,
  proposed_solution     text NOT NULL,
  execution_plan        jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence              jsonb NOT NULL DEFAULT '[]'::jsonb,
  counter_evidence      text NOT NULL,
  success_measure       text NOT NULL,
  risk                  text NOT NULL,
  rollback_plan         text NOT NULL,
  confidence            text NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  impact                text NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  effort                text NOT NULL CHECK (effort IN ('small', 'medium', 'large')),
  priority_score        integer NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  admin_href            text,
  occurrence_count      integer NOT NULL DEFAULT 1,
  first_seen_at         timestamptz NOT NULL DEFAULT now(),
  last_seen_at          timestamptz NOT NULL DEFAULT now(),
  approved_by           text,
  approved_at           timestamptz,
  rejected_by           text,
  rejected_at           timestamptz,
  rejection_note        text,
  execution_branch      text,
  execution_url         text,
  execution_error       text,
  execution_started_at  timestamptz,
  execution_completed_at timestamptz,
  completed_by          text,
  completed_at          timestamptz,
  measurement_due_at    timestamptz,
  outcome_status        text CHECK (outcome_status IN ('pending', 'validated', 'missed', 'inconclusive')),
  outcome_note          text,
  outcome_evidence      jsonb NOT NULL DEFAULT '[]'::jsonb,
  measured_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_war_room_proposals_inbox
  ON war_room_proposals (status, priority_score DESC, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS war_room_proposal_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id           uuid NOT NULL REFERENCES war_room_proposals(id) ON DELETE CASCADE,
  event_type            text NOT NULL CHECK (event_type IN (
    'discovered', 'refreshed', 'approved', 'rejected', 'dispatched',
    'execution_started', 'review_ready', 'execution_failed', 'completed',
    'outcome_measured'
  )),
  actor                 text NOT NULL,
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_war_room_proposal_events_recent
  ON war_room_proposal_events (proposal_id, created_at DESC);

ALTER TABLE war_room_source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_source_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_proposal_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE war_room_source_items IS
  'Allowlisted Slack and Notion evidence. Content is untrusted context, never executable instruction.';
COMMENT ON TABLE war_room_proposals IS
  'Autonomously discovered, evidence-cited work awaiting explicit admin authorization.';
COMMENT ON TABLE war_room_proposal_events IS
  'Append-only lifecycle and authorization trail for War Room proposals.';

-- War Room investigation loop.
--
-- Conditions outlive individual proposed interventions. This migration gives
-- each condition durable hypotheses, a next read-only probe, resolution
-- criteria, progress history, and replay observability.

ALTER TABLE war_room_investigations
  DROP CONSTRAINT IF EXISTS war_room_investigations_status_check;

ALTER TABLE war_room_investigations
  ADD CONSTRAINT war_room_investigations_status_check
  CHECK (status IN (
    'investigating', 'watchlist', 'decision_ready',
    'resolved', 'invalidated', 'paused',
    'closed', 'superseded'
  ));

ALTER TABLE war_room_investigations
  ADD COLUMN IF NOT EXISTS hypotheses jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS next_probe jsonb,
  ADD COLUMN IF NOT EXISTS resolution_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resolution_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_summary text NOT NULL DEFAULT 'No investigation probe has completed yet.',
  ADD COLUMN IF NOT EXISTS last_progress_at timestamptz,
  ADD COLUMN IF NOT EXISTS evidence_hash text;

CREATE TABLE IF NOT EXISTS war_room_investigation_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id      uuid NOT NULL REFERENCES war_room_investigations(id) ON DELETE CASCADE,
  discovery_run_id      uuid REFERENCES war_room_discovery_runs(id) ON DELETE SET NULL,
  event_type            text NOT NULL CHECK (event_type IN (
    'observed', 'evidence_changed', 'probe_planned', 'probe_completed',
    'intervention_proposed', 'intervention_rejected', 'intervention_completed',
    'outcome_measured', 'monitoring', 'resolved', 'invalidated', 'reopened'
  )),
  actor                 text NOT NULL DEFAULT 'war-room',
  details               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_war_room_investigation_events_case
  ON war_room_investigation_events (investigation_id, created_at DESC);

ALTER TABLE war_room_investigation_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE war_room_discovery_runs
  ADD COLUMN IF NOT EXISTS fact_pack_hash text,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS raw_investigator_output jsonb,
  ADD COLUMN IF NOT EXISTS raw_council_output jsonb,
  ADD COLUMN IF NOT EXISTS validation_trace jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON TABLE war_room_investigation_events IS
  'Append-only learning history for a durable company condition. Proposal events remain separate intervention memory.';
COMMENT ON COLUMN war_room_investigations.next_probe IS
  'The next bounded read-only question War Room should answer before proposing action.';
COMMENT ON COLUMN war_room_investigations.resolution_evidence IS
  'Evidence required to close the business condition, independent of whether an intervention was completed.';

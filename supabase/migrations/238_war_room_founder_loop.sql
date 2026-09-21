-- War Room can ask questions it cannot answer, and TJ can answer questions it
-- cannot ask him.
--
-- Every investigation carries an `unknowns` list and a `readiness_reason` that
-- reads as a question: why two counts of the same thing disagree, whether an
-- unanswered question renders publicly, whether a set of exclusions were
-- provider-stated or bounce-inferred. `cause_confidence` cannot rise until
-- those resolve. Probes resolve the ones that happen to be database queries.
-- Everything else needs the founder, and before this there was no path for his
-- knowledge to enter the system at all — on 2026-09-20 the GA4 caveat got in
-- by hand-writing it into a config row.
--
-- These two event types make the Slack DM a two-way channel: the brief asks one
-- specific question and records `founder_asked`; his reply is captured as
-- `founder_answered` and becomes evidence on the next scan, exactly as
-- `probe_completed` already does.
--
-- TEXT + CHECK, not an enum, matching the rest of this schema — so a new value
-- needs this migration or every insert fails.

ALTER TABLE war_room_investigation_events
  DROP CONSTRAINT IF EXISTS war_room_investigation_events_event_type_check;

ALTER TABLE war_room_investigation_events
  ADD CONSTRAINT war_room_investigation_events_event_type_check
  CHECK (event_type IN (
    'observed', 'evidence_changed', 'probe_planned', 'probe_completed',
    'founder_asked', 'founder_answered',
    'intervention_proposed', 'intervention_rejected', 'intervention_superseded', 'intervention_completed',
    'outcome_measured', 'monitoring', 'resolved', 'invalidated', 'reopened'
  ));

-- Finding the open question a reply belongs to is a hot path on every inbound
-- Slack DM, and it is always "the most recent ask".
CREATE INDEX IF NOT EXISTS idx_war_room_investigation_events_founder
  ON war_room_investigation_events (event_type, created_at DESC)
  WHERE event_type IN ('founder_asked', 'founder_answered');

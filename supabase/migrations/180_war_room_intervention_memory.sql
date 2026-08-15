-- Keep intervention lifecycle events distinct from condition lifecycle events.
-- This is a separate migration so databases that already applied migration 179
-- receive the expanded allowlist instead of retaining the old CHECK constraint.

ALTER TABLE war_room_investigation_events
  DROP CONSTRAINT IF EXISTS war_room_investigation_events_event_type_check;

ALTER TABLE war_room_investigation_events
  ADD CONSTRAINT war_room_investigation_events_event_type_check
  CHECK (event_type IN (
    'observed', 'evidence_changed', 'probe_planned', 'probe_completed',
    'intervention_proposed', 'intervention_rejected', 'intervention_superseded', 'intervention_completed',
    'outcome_measured', 'monitoring', 'resolved', 'invalidated', 'reopened'
  ));

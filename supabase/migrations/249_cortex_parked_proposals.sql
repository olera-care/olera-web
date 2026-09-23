-- Accept, but not now.
--
-- WHY. On 2026-09-23 TJ, on the Hoop Cares call Cortex proposed and he had
-- approved: "the proposal is not a bad one... we need an option of accept but
-- not highest priority." Approval was the only yes, and an approved plan takes
-- one of three proposal slots and is named in every morning brief until it is
-- marked carried out. A good idea that is not this week's work had nowhere to
-- go except reject, which tells Cortex the intervention was wrong.
--
-- `parked`: accepted as sound, not scheduled. Frees the slot, leaves the
-- brief, is never superseded, and is not re-proposed. "Take it up" moves it to
-- approved, which delivers it as assigned work at that point.
--
-- Safe to run twice.

ALTER TABLE war_room_proposals DROP CONSTRAINT IF EXISTS war_room_proposals_status_check;
ALTER TABLE war_room_proposals ADD CONSTRAINT war_room_proposals_status_check
  CHECK (status IN (
    'proposed', 'approved', 'dispatching', 'executing', 'review_ready',
    'rejected', 'completed', 'failed', 'superseded', 'parked'
  ));

ALTER TABLE war_room_proposal_events DROP CONSTRAINT IF EXISTS war_room_proposal_events_event_type_check;
ALTER TABLE war_room_proposal_events ADD CONSTRAINT war_room_proposal_events_event_type_check
  CHECK (event_type IN (
    'discovered', 'refreshed', 'approved', 'rejected', 'dispatched',
    'execution_started', 'review_ready', 'execution_failed', 'completed',
    'outcome_measured', 'parked'
  ));

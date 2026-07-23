-- Add cycle_exhausted to touchpoint types CHECK constraint
-- This type is used when a provider exhausts 2 outreach cycles and moves to soft terminal

ALTER TABLE provider_outreach_touchpoints
  DROP CONSTRAINT IF EXISTS provider_outreach_touchpoints_touchpoint_type_check;

ALTER TABLE provider_outreach_touchpoints
  ADD CONSTRAINT provider_outreach_touchpoints_touchpoint_type_check
  CHECK (touchpoint_type IN (
    'stage_changed',
    'email_sent',
    'email_opened',
    'email_clicked',
    'email_replied',
    'email_bounced',
    'call_attempted',
    'outcome_recorded',
    'cycle_started',
    'cycle_exhausted',
    'exclusion_toggled',
    'assignment_changed',
    'sequence_launched'
  ));

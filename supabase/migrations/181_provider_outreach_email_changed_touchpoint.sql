-- Add email_changed and email_source_changed to touchpoint types CHECK constraint
-- email_changed: logged when provider email address is updated (captures old/new for history)
-- email_source_changed: logged when toggling between organization and decision_maker email

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
    'sequence_launched',
    'email_changed',
    'email_source_changed'
  ));

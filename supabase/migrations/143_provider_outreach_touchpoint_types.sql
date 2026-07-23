-- Fix CHECK constraint on provider_outreach_touchpoints to include missing types
-- assignment_changed: logged when provider assignment changes
-- sequence_launched: logged when email sequence is started

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
    'exclusion_toggled',
    'assignment_changed',
    'sequence_launched'
  ));

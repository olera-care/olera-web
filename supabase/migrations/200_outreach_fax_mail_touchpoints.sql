-- Migration: Add fax/mail touchpoint types for conversion tracking
--
-- Context: Fax and direct mail sends currently update tracking fields
-- (fax_sent_at, mail_sent_at) but don't log touchpoints. This causes
-- conversion attribution gaps since the touchpoint audit trail is
-- incomplete. Adding these types enables proper conversion tracking.
--
-- New touchpoint types:
--   fax_sent      — Fax dispatched to provider
--   mail_sent     — Direct mail postcard sent
--   fax_delivered — Fax confirmed delivered (webhook)
--   mail_delivered — Mail confirmed delivered (webhook)
--   channel_changed — Provider moved to alternative outreach channel

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
    'email_source_changed',
    'contact_form_sent',
    'contact_saved',
    'fax_sent',
    'mail_sent',
    'fax_delivered',
    'mail_delivered',
    'channel_changed'
  ));

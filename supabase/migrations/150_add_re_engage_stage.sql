-- Migration: Add re_engage stage to provider_outreach_tracking
--
-- Context: Bottom Funnel outreach page needs a re_engage stage for providers
-- who have exhausted email sequences and are being retried via alternative
-- channels (fax, LinkedIn, direct mail).

-- Drop old constraint and add new one with re_engage
ALTER TABLE provider_outreach_tracking
  DROP CONSTRAINT IF EXISTS provider_outreach_tracking_stage_check;

ALTER TABLE provider_outreach_tracking
  ADD CONSTRAINT provider_outreach_tracking_stage_check
  CHECK (stage IN (
    'not_contacted',
    'in_sequence',
    'needs_call',
    'called',
    'claimed',
    'not_interested',
    'archived',
    're_engage'
  ));

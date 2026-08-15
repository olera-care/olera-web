-- Add Apollo.io contact storage for decision-maker enrichment
-- Apollo finds named contacts (Executive Director, Owner, etc.) rather than generic info@ emails

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS apollo_contact JSONB;

COMMENT ON COLUMN provider_outreach_tracking.apollo_contact IS
  'Decision-maker contact from Apollo.io enrichment. Structure: {email, first_name, last_name, title, linkedin_url, found_at, credits_used}';

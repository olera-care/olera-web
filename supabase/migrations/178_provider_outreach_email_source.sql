-- Add email_source column to track how the provider's email was obtained
-- 'organization' = scraped from website or manually entered (generic emails like info@)
-- 'decision_maker' = found via Apollo.io (named contact with personal email)

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS email_source TEXT DEFAULT 'organization';

COMMENT ON COLUMN provider_outreach_tracking.email_source IS
  'How the email was obtained: organization (scraped/manual) or decision_maker (Apollo)';

-- Create index for filtering by email_source (used in Ready tab sub-tabs)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_email_source
  ON provider_outreach_tracking(email_source);

-- Backfill: Set email_source = 'decision_maker' for records that have Apollo contact with email
UPDATE provider_outreach_tracking
SET email_source = 'decision_maker'
WHERE apollo_contact IS NOT NULL
  AND apollo_contact->>'email' IS NOT NULL
  AND apollo_contact->>'email' != '';

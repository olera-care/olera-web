-- Provider Outreach SmartLead Integration
-- Adds JSONB column to store SmartLead linkage data for provider outreach

ALTER TABLE provider_outreach_tracking
ADD COLUMN IF NOT EXISTS smartlead_data JSONB DEFAULT NULL;

-- Index for querying by SmartLead campaign_id (for webhook attribution)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_smartlead_campaign
ON provider_outreach_tracking ((smartlead_data->>'campaign_id'))
WHERE smartlead_data IS NOT NULL;

-- Index for querying by SmartLead lead_email (for reply attribution)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_smartlead_lead_email
ON provider_outreach_tracking ((smartlead_data->>'lead_email'))
WHERE smartlead_data IS NOT NULL;

COMMENT ON COLUMN provider_outreach_tracking.smartlead_data IS 'SmartLead campaign linkage: { campaign_id, lead_id, lead_email, enrolled_at }';

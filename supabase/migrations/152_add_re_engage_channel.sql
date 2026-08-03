-- Add re_engage_channel column to track which sub-channel a re-engage provider is in
-- Values: re_engage (default), fax, linkedin, direct_mail, not_interested, claimed, archived
ALTER TABLE provider_outreach_tracking
ADD COLUMN IF NOT EXISTS re_engage_channel text DEFAULT 're_engage';

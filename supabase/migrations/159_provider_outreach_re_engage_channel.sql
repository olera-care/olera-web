-- Migration: Add re_engage_channel column to provider_outreach_tracking
--
-- Context: Bottom funnel re-engagement page uses sub-channels (fax, linkedin,
-- direct_mail) to track which outreach method a provider is currently in.
--
-- Values: re_engage (default), fax, linkedin, direct_mail, not_interested, claimed, archived
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS re_engage_channel TEXT DEFAULT 're_engage';

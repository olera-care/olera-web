-- Migration: Add contact form channel columns to provider_outreach_tracking
--
-- Adds contact_form_url and contact_form_status columns for tracking
-- contact form URLs discovered during re-engage channel research.
-- This enables the contact form outreach channel in the Alternative Channels flow.

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS contact_form_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_form_status TEXT;

-- Index for filtering by contact form status
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_contact_form_status
  ON provider_outreach_tracking (contact_form_status)
  WHERE contact_form_status IS NOT NULL;

COMMENT ON COLUMN provider_outreach_tracking.contact_form_url IS
'URL to provider contact form, discovered via AI research or manual entry';

COMMENT ON COLUMN provider_outreach_tracking.contact_form_status IS
'Status of contact form outreach: pending, submitted, responded, failed';

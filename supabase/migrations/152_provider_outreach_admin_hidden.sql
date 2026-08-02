-- Migration: Add admin_hidden column to provider_outreach_tracking
--
-- Purpose: Allow admins to hide providers from outreach views without deleting
-- the tracking row. This preserves audit history and SmartLead data while
-- removing the provider from all tabs/counts.
--
-- Pattern: Matches connections table's admin_hidden metadata approach.
--
-- Apply via Supabase dashboard (NOT CLI).

-- Add admin_hidden column (default false, nullable for existing rows)
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN DEFAULT false;

-- Index for efficient filtering (most queries will filter WHERE admin_hidden = false)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_admin_hidden
  ON provider_outreach_tracking (admin_hidden)
  WHERE admin_hidden = true;

-- Comment for documentation
COMMENT ON COLUMN provider_outreach_tracking.admin_hidden IS
  'When true, provider is hidden from all outreach views (admin cleanup). Preserves tracking data for audit.';

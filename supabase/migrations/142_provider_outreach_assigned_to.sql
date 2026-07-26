-- Migration: Add assigned_to column to provider_outreach_tracking
--
-- Context: Allows admins to assign themselves (or others) to providers/states/cities
-- during outreach. Helps coordinate when multiple admins work on different regions.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- Add assigned_to column (nullable FK to admin_users)
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Index for filtering by assigned admin
CREATE INDEX IF NOT EXISTS idx_po_tracking_assigned_to
  ON provider_outreach_tracking (assigned_to)
  WHERE assigned_to IS NOT NULL;

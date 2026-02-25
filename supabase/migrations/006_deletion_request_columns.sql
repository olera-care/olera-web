-- Provider Deletion Request Columns
-- Allows providers to request deletion of their claimed listing.
-- Admins review requests and approve/deny from the admin dashboard.
-- ALTERS existing business_profiles table — all columns nullable with safe defaults.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_approved_at TIMESTAMPTZ;

-- Index for admin queries: fetch all pending deletion requests
CREATE INDEX IF NOT EXISTS idx_business_profiles_deletion_requested
  ON business_profiles (deletion_requested)
  WHERE deletion_requested = TRUE;

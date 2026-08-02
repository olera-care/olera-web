-- Migration: Add generic email verification flags to provider_outreach_tracking
--
-- Context: When a provider has a generic email (info@, contact@, etc.), admins
-- can either call to verify or skip the warning. These flags track that state
-- so it persists across page refreshes.
--
-- Both actions also create touchpoints for audit trail, but these columns
-- enable efficient querying without joining to touchpoints.

-- Add columns for tracking generic email verification state
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS generic_email_called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generic_email_skipped_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN provider_outreach_tracking.generic_email_called_at IS
  'When admin verified generic email by calling. Dismisses the warning.';
COMMENT ON COLUMN provider_outreach_tracking.generic_email_skipped_at IS
  'When admin skipped the generic email warning. Dismisses the warning.';

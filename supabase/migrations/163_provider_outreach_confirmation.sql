-- Migration: Add confirmation tracking to provider_outreach_tracking
--
-- Context: Admins need to confirm providers in the Ready tab are actually
-- ready for sequences. This provides visual confirmation (blue checkmark)
-- that a teammate has reviewed the provider.
--
-- Confirmation resets when email or phone is changed.

-- Add columns for tracking confirmation state
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by TEXT;

-- Add comments for documentation
COMMENT ON COLUMN provider_outreach_tracking.confirmed_at IS
  'When admin confirmed provider is ready for sequence. Resets on email/phone change.';
COMMENT ON COLUMN provider_outreach_tracking.confirmed_by IS
  'Admin user ID who confirmed the provider. Resets on email/phone change.';

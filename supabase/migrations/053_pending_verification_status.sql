-- Migration: Add 'pending_verification' to connections status check constraint
--
-- This enables the "Pending Inquiries for Unverified Providers" feature where:
-- - Unverified providers can send inquiries that are saved but not delivered
-- - Status changes to 'pending' when the provider verifies
-- - Caregivers only see connections once status is 'pending' (delivered)

DO $$
DECLARE
  v_constraint text;
BEGIN
  -- Find the status-related check constraint on connections
  SELECT conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'connections'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE connections DROP CONSTRAINT ' || quote_ident(v_constraint);
    RAISE NOTICE 'Dropped constraint: %', v_constraint;
  ELSE
    RAISE NOTICE 'No status check constraint found to drop';
  END IF;
END $$;

-- Add the updated constraint with pending_verification status
ALTER TABLE connections
  ADD CONSTRAINT connections_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'archived', 'pending_verification'));

-- Add index for efficient queries on pending_verification connections by provider
-- Used when delivering pending connections after verification
CREATE INDEX IF NOT EXISTS idx_connections_pending_verification
  ON connections(from_profile_id) WHERE status = 'pending_verification';

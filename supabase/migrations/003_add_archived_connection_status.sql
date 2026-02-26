-- Migration: Add 'archived' to connections status check constraint
--
-- The existing constraint only allows: pending, accepted, declined, expired
-- This adds 'archived' to enable inbox archive functionality.

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

ALTER TABLE connections
  ADD CONSTRAINT connections_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'archived'));

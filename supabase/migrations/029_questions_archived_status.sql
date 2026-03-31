-- Migration: Add 'archived' to provider_questions status check constraint
--
-- The existing constraint only allows: pending, approved, answered, rejected, flagged
-- This adds 'archived' to enable admin archive workflow for unreachable providers.

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'provider_questions'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE provider_questions DROP CONSTRAINT ' || quote_ident(v_constraint);
    RAISE NOTICE 'Dropped constraint: %', v_constraint;
  ELSE
    RAISE NOTICE 'No status check constraint found to drop';
  END IF;
END $$;

ALTER TABLE provider_questions
  ADD CONSTRAINT provider_questions_status_check
  CHECK (status IN ('pending', 'approved', 'answered', 'rejected', 'flagged', 'archived'));

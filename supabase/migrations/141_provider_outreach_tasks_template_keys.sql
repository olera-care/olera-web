-- Migration: Expand provider_outreach_tasks template_key constraint
--
-- Context: The original migration (134) only allowed three template keys:
-- intro, followup, final. The cadence has been expanded to include:
--   - demand_loss (Day 7 - family demand visibility)
--   - nudge (standalone resend template for Follow Up)
--
-- This migration drops and recreates the CHECK constraint with the expanded list.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- Drop the existing constraint
ALTER TABLE provider_outreach_tasks
  DROP CONSTRAINT IF EXISTS provider_outreach_tasks_template_key_check;

-- Add the expanded constraint
ALTER TABLE provider_outreach_tasks
  ADD CONSTRAINT provider_outreach_tasks_template_key_check
  CHECK (template_key IN (
    'intro',        -- Day 0: Introduction
    'followup',     -- Day 3: Profile gaps
    'demand_loss',  -- Day 7: Family demand visibility
    'final',        -- Day 14: Summary (everything in one place)
    'nudge'         -- Standalone: Follow Up resend action
  ));

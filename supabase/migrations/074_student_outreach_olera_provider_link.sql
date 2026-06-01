-- ===========================================================================
-- 074 — Relax kind_provider_link_check for olera-providers prospects
-- ===========================================================================
-- v9.1 (post-PR #865): the materialize endpoint now creates provider
-- prospects from the olera-providers directory (75K+ rows) rather than
-- business_profiles (~200 rows). The provider reference is stored in
-- research_data.olera_provider_id instead of provider_business_profile_id.
-- A real business_profiles row is only created at conversion time
-- (handleMakeClient).
--
-- This migration relaxes the kind_provider_link_check constraint to
-- accept either form of provider reference. Stakeholder rows still must
-- have NULL provider_business_profile_id.
--
-- Already applied manually to production via Supabase SQL editor on
-- 2026-05-29 to unblock the admin from clicking provider prospect cards.
-- This file is committed for repo tracking + new-environment setup.
-- The DROP CONSTRAINT IF EXISTS pattern makes re-running idempotent.
-- ===========================================================================

ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_kind_provider_link_check;

ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_kind_provider_link_check
    CHECK (
      (kind = 'provider' AND (
        provider_business_profile_id IS NOT NULL
        OR research_data->>'olera_provider_id' IS NOT NULL
      ))
      OR
      (kind <> 'provider' AND provider_business_profile_id IS NULL)
    );

COMMENT ON CONSTRAINT student_outreach_kind_provider_link_check ON student_outreach IS
  'Provider rows must reference an underlying provider either via the legacy '
  'provider_business_profile_id FK or via research_data.olera_provider_id '
  '(set by the olera-providers-sourced materialize endpoint). Stakeholder '
  'rows must have NULL provider_business_profile_id.';

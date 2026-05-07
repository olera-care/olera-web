-- ===========================================================================
-- 072 — student_outreach.kind: broaden the row to support providers
-- ===========================================================================
-- v9.0 (MedJobs reorg) Phase 0: introduce a polymorphic `kind` column on
-- student_outreach so the same row + touchpoint + task infrastructure can
-- represent provider prospects (kind='provider') alongside the existing
-- student-recruitment stakeholder kinds.
--
-- Backfill strategy:
--   Every existing row is a student-recruitment stakeholder, so kind is
--   set directly from stakeholder_type. After backfill, kind becomes the
--   canonical discriminator; stakeholder_type stays for backwards compat
--   and continues to drive the existing CHECK constraint on the four
--   stakeholder values (the column will be migrated out later).
--
-- New `provider_business_profile_id` FK is the polymorphic pointer to the
-- underlying provider when kind='provider'. NULL for stakeholder rows.
-- Lazy creation: provider rows are NOT batch-inserted on campus assignment;
-- the Prospects list computes a virtual catchment view and materializes a
-- row only when an admin takes the first action on a given provider.
-- ===========================================================================

ALTER TABLE student_outreach
  ADD COLUMN IF NOT EXISTS kind TEXT;

ALTER TABLE student_outreach
  ADD COLUMN IF NOT EXISTS provider_business_profile_id UUID
    REFERENCES business_profiles(id) ON DELETE SET NULL;

-- Backfill existing rows from stakeholder_type. All existing rows pre-date
-- v9.0 and represent campus stakeholders.
UPDATE student_outreach
   SET kind = stakeholder_type
 WHERE kind IS NULL;

-- Now make kind NOT NULL with the broadened CHECK constraint.
-- ALTER COLUMN ... SET NOT NULL is idempotent when already NOT NULL.
ALTER TABLE student_outreach
  ALTER COLUMN kind SET NOT NULL;

-- Idempotent constraint pattern: DROP IF EXISTS then ADD. Re-running this
-- migration is safe; the constraint will end up in the desired state.
ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_kind_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_kind_check
    CHECK (kind IN ('student_org','advisor','professor','dept_head','provider'));

-- Provider rows must have a provider_business_profile_id; stakeholder rows
-- must not. Enforced as a partial constraint so the table stays clean.
ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_kind_provider_link_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_kind_provider_link_check
    CHECK (
      (kind = 'provider' AND provider_business_profile_id IS NOT NULL)
      OR
      (kind <> 'provider' AND provider_business_profile_id IS NULL)
    );

CREATE INDEX IF NOT EXISTS idx_so_kind
  ON student_outreach (kind);

CREATE INDEX IF NOT EXISTS idx_so_provider_business_profile_id
  ON student_outreach (provider_business_profile_id)
  WHERE provider_business_profile_id IS NOT NULL;

COMMENT ON COLUMN student_outreach.kind IS
  'Polymorphic discriminator. v9.0: stakeholder_type values plus ''provider''. '
  'For kind=''provider'', provider_business_profile_id points to the underlying '
  'business_profiles row. For all other kinds, it must be NULL.';

COMMENT ON COLUMN student_outreach.provider_business_profile_id IS
  'FK to business_profiles when kind=''provider''. NULL otherwise.';

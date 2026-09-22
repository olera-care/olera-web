-- ===========================================================================
-- 248 — collateral on any record, not only the two with an outreach row
-- ===========================================================================
-- The attachments table keyed off student_outreach. Providers and advisors
-- have a row there; students and job boards do not — a student is a
-- business_profiles row and a job board is a campus_channels row. The Files
-- band rendered on all four anyway, so on two of them every upload came back
-- "No such record".
--
-- So the link becomes the pair the board already identifies a record by: its
-- id and which kind of record it is. outreach_id stays, and stays a foreign
-- key, because the cascade it gives us is worth keeping — deleting a
-- provider should take its files. The other two carry their id untyped,
-- since their tables are not ours to cascade from.
-- ===========================================================================

ALTER TABLE medjobs_attachments
  ADD COLUMN IF NOT EXISTS record_kind TEXT,
  ADD COLUMN IF NOT EXISTS record_id   UUID;

-- Everything written before this was an outreach record by definition.
UPDATE medjobs_attachments
   SET record_kind = 'outreach',
       record_id   = outreach_id
 WHERE record_kind IS NULL;

ALTER TABLE medjobs_attachments
  ALTER COLUMN record_kind SET NOT NULL,
  ALTER COLUMN record_id   SET NOT NULL;

-- outreach_id was NOT NULL. A student's or a job board's file has nothing to
-- put in it.
ALTER TABLE medjobs_attachments
  ALTER COLUMN outreach_id DROP NOT NULL;

-- So was campus_id, and a student has no campus of their own: they belong to
-- whichever university their application named, which the board works out by
-- matching profile metadata against campus slugs. Rather than duplicate that
-- resolution here, or take the campus on trust from whoever is uploading, a
-- student's file simply has no campus. It is a cleanup convenience, not a
-- key, and nothing reads it for a student.
ALTER TABLE medjobs_attachments
  ALTER COLUMN campus_id DROP NOT NULL;

ALTER TABLE medjobs_attachments
  DROP CONSTRAINT IF EXISTS medjobs_attachments_kind_check;
ALTER TABLE medjobs_attachments
  ADD CONSTRAINT medjobs_attachments_kind_check
  CHECK (record_kind IN ('outreach', 'student', 'jobboard'));

-- An outreach file must carry the foreign key, so the cascade still fires;
-- the other two must not, so nothing claims a link it does not have.
--
-- Written with IS NOT DISTINCT FROM rather than =, because a CHECK passes on
-- NULL and an = against a null column quietly lets the row through. That is
-- the hole in migration 235's provider-link constraint and it is not worth
-- repeating here.
ALTER TABLE medjobs_attachments
  DROP CONSTRAINT IF EXISTS medjobs_attachments_link_check;
ALTER TABLE medjobs_attachments
  ADD CONSTRAINT medjobs_attachments_link_check
  CHECK (
    (record_kind = 'outreach' AND outreach_id IS NOT NULL AND record_id = outreach_id)
    OR
    (record_kind <> 'outreach' AND outreach_id IS NULL)
  );

DROP INDEX IF EXISTS idx_medjobs_attachments_outreach;
CREATE INDEX IF NOT EXISTS idx_medjobs_attachments_record
  ON medjobs_attachments (record_kind, record_id, uploaded_at DESC);

COMMENT ON COLUMN medjobs_attachments.record_kind IS
  'Which board section the record belongs to: outreach (providers and '
  'advisors), student, or jobboard. With record_id it identifies the record '
  'the way the board does.';

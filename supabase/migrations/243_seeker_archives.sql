-- 243: Let a person take a family off the care seeker board.
--
-- Renumbered 242 -> 243 before merge. A concurrent session shipped
-- 242_cortex_north_star_target.sql while this branch was open, and git does
-- not flag a number collision because the filenames differ. This file was
-- already applied to production by hand under its old name, so the number is
-- ordering metadata for a fresh setup, not a record of what ran — the same
-- situation as the 240 collision earlier the same day.
--
-- The board is a view over events and stores nothing, which is what keeps it
-- honest. But some rows are not families at all, and no event will ever say so:
-- a record called "Test McTest" has sat at the TOP of "Reply to them" for
-- 1,098 days, ranked above real families waiting on an answer, because it
-- genuinely does have an unanswered message on it. The events are correct. The
-- row is not a case.
--
-- This is the smallest thing that fixes that: one row per decision, made by a
-- person, kept beside the events rather than mixed into them. Un-archiving is a
-- DELETE, so the decision leaves no residue once it is reversed.
--
-- NOT business_profiles.deletion_requested. That column is the GDPR removal
-- flow — a request to erase someone's data, which carries legal obligations and
-- a different lifecycle. "This is a test row" and "this person asked to be
-- forgotten" must never share a field.
--
-- NOT do_not_contact either. That is suppression: they asked us to stop, and it
-- gates sending. Archiving says nothing about whether we may contact them; it
-- says nobody needs to work this case.

CREATE TABLE IF NOT EXISTS public.seeker_archives (
  seeker_id    UUID PRIMARY KEY REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  note         TEXT,
  archived_by  TEXT NOT NULL,
  archived_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.seeker_archives IS
  'A person has decided this family is not a case to work. One row per archived seeker; un-archiving deletes the row. Separate from do_not_contact (suppression) and from deletion_requested (GDPR erasure) — archiving says only that nobody needs to act, never that we may not write to them.';
COMMENT ON COLUMN public.seeker_archives.reason IS
  'test_record, not_a_care_seeker, duplicate, resolved_elsewhere, other. Plain TEXT with no CHECK, matching city_leads.archive_reason, so a new reason is a code change rather than a migration.';

-- The board reads every archive for the families it is showing, so the lookup
-- is by primary key. No extra index earns its keep.

-- The row that prompted this. Ranked first in the highest-priority queue since
-- 2023 because a test message genuinely has no reply.
INSERT INTO public.seeker_archives (seeker_id, reason, note, archived_by)
SELECT id, 'test_record', 'Test row from TJ''s own inbox checks. Archived by migration 243.', 'migration:243'
  FROM public.business_profiles
 WHERE id = 'b32bb6fd-1547-49f6-88f2-929c9fcec060'
   AND type = 'family'
   AND display_name = 'Test McTest'
ON CONFLICT (seeker_id) DO NOTHING;

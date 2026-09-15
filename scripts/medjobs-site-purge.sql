-- ===========================================================================
-- MedJobs site purge — removes all outreach data for non-focus sites
-- ===========================================================================
-- Run scripts/medjobs-site-purge-preflight.sql FIRST. Do not run this until
-- its query 2 reports "ok" for all five keepers.
--
-- WHAT THIS DELETES, for every site that is NOT one of the five keepers:
--   provider partner rows + university org/advisor/professor rows
--   their contacts, touchpoints (calls, emails, meetings), approvals, tasks
--   the site's own site_tasks, campus_channels and campus_channel_records
--
-- WHAT THIS DOES NOT DELETE:
--   the campus row itself — it is deactivated (is_active = false) instead,
--     so the purge is reversible and nothing 404s. See the OPTIONAL block.
--   business_profiles — provider directory entries and student/candidate
--     profiles are shared records, not site data. A provider that was a
--     MedJobs prospect stays in the directory; only the MedJobs outreach
--     history goes.
--   business_profile_tasks — candidate and client tasks are not campus-
--     scoped. If a candidate from a purged university has open tasks, they
--     survive. Handle those separately if you want them gone.
--
-- SAFETY: this script ends in ROLLBACK. Run it as-is, read the verification
-- output at the bottom, and only then change the last line to COMMIT and
-- run it again. Nothing is written on the first pass.
-- ===========================================================================

BEGIN;

-- ── The five sites to keep. Everything else is purged. ───────────────────
CREATE TEMP TABLE _keep(name TEXT) ON COMMIT DROP;
INSERT INTO _keep(name) VALUES
  ('Arizona State University'),
  ('Florida State University'),
  ('Indiana University Bloomington'),
  ('University of Utah'),
  ('University of Wisconsin-Madison');

-- ── Guard: all five must resolve, or we abort before touching anything ───
DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(k.name, ', ') INTO missing
  FROM _keep k
  WHERE NOT EXISTS (
    SELECT 1 FROM student_outreach_campuses c
     WHERE lower(btrim(c.name)) = lower(btrim(k.name))
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION
      'Keep-list does not resolve; these names match no campus: %. '
      'Fix the spelling in _keep before running the purge.', missing;
  END IF;
END $$;

-- ── Resolve the target sites once, so every delete uses the same set ─────
CREATE TEMP TABLE _doomed_campus(id UUID PRIMARY KEY, name TEXT) ON COMMIT DROP;
INSERT INTO _doomed_campus(id, name)
SELECT c.id, c.name
FROM student_outreach_campuses c
WHERE NOT EXISTS (
  SELECT 1 FROM _keep k WHERE lower(btrim(k.name)) = lower(btrim(c.name))
);

CREATE TEMP TABLE _doomed_outreach(id UUID PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _doomed_outreach(id)
SELECT so.id FROM student_outreach so
WHERE so.campus_id IN (SELECT id FROM _doomed_campus);

-- ── Touchpoints are append-only; the trigger must come off to delete ─────
-- Scoped to this transaction: a ROLLBACK restores the trigger along with
-- everything else.
ALTER TABLE student_outreach_touchpoints
  DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

-- ── Deletes, children first. Explicit rather than relying on CASCADE so
--    every row count shows up in the output. ──────────────────────────────

DELETE FROM campus_channel_records r
 USING campus_channels ch
 WHERE ch.id = r.channel_id
   AND ch.campus_id IN (SELECT id FROM _doomed_campus);

DELETE FROM campus_channels
 WHERE campus_id IN (SELECT id FROM _doomed_campus);

DELETE FROM site_tasks
 WHERE campus_id IN (SELECT id FROM _doomed_campus);

DELETE FROM student_outreach_tasks
 WHERE outreach_id IN (SELECT id FROM _doomed_outreach);

DELETE FROM student_outreach_approvals
 WHERE outreach_id IN (SELECT id FROM _doomed_outreach);

DELETE FROM student_outreach_touchpoints
 WHERE outreach_id IN (SELECT id FROM _doomed_outreach);

DELETE FROM student_outreach_contacts
 WHERE outreach_id IN (SELECT id FROM _doomed_outreach);

-- Parent last: campus_id is ON DELETE RESTRICT, and the self-referencing
-- FKs (permission_dependency_id / redirected_to_id / referred_from_id) are
-- ON DELETE SET NULL, so intra-set pointers resolve themselves.
DELETE FROM student_outreach
 WHERE id IN (SELECT id FROM _doomed_outreach);

ALTER TABLE student_outreach_touchpoints
  ENABLE TRIGGER student_outreach_touchpoints_no_mutate;

-- ── Deactivate the emptied sites (reversible; keeps the rows) ────────────
UPDATE student_outreach_campuses
   SET is_active = FALSE, updated_at = NOW()
 WHERE id IN (SELECT id FROM _doomed_campus);

-- ── OPTIONAL: delete the campus rows outright. Leave commented unless you
--    are certain — this is the one step that cannot be undone by re-running
--    with is_active = true.
-- DELETE FROM student_outreach_campuses
--  WHERE id IN (SELECT id FROM _doomed_campus);

-- ── Verification ─────────────────────────────────────────────────────────
-- One result set: the Supabase SQL editor only renders the last statement,
-- so everything worth reading is unioned here. Every "residual" row must be
-- 0; the "purged" rows name the sites that were emptied; the "surviving"
-- rows must be exactly the five keepers.
SELECT * FROM (
        SELECT 1 AS ord, 'purged site' AS item, name AS detail, NULL::BIGINT AS n
          FROM _doomed_campus
  UNION ALL
        SELECT 2, 'residual student_outreach', NULL, count(*)
          FROM student_outreach WHERE campus_id IN (SELECT id FROM _doomed_campus)
  UNION ALL
        SELECT 2, 'residual site_tasks', NULL, count(*)
          FROM site_tasks WHERE campus_id IN (SELECT id FROM _doomed_campus)
  UNION ALL
        SELECT 2, 'residual campus_channels', NULL, count(*)
          FROM campus_channels WHERE campus_id IN (SELECT id FROM _doomed_campus)
  UNION ALL
        SELECT 2, 'residual touchpoints', NULL, count(*)
          FROM student_outreach_touchpoints
         WHERE outreach_id IN (SELECT id FROM _doomed_outreach)
  UNION ALL
        SELECT 3, 'surviving site (active)', c.name,
               (SELECT count(*) FROM student_outreach so WHERE so.campus_id = c.id)
          FROM student_outreach_campuses c WHERE c.is_active
) r
ORDER BY ord, item, detail;

-- ── Flip to COMMIT once the output above looks right. ────────────────────
ROLLBACK;

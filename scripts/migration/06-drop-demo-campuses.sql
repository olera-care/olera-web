-- ===========================================================================
-- Remove the demo campuses now that the real six are populated
-- ===========================================================================
-- WRITES. The demo seed created four campuses under `demo-` slugs, and
-- three of them carry the same display names as real universities, so the
-- board shows "Arizona State University" and "University of Utah" twice.
-- This deletes the demo set and nothing else.
--
-- Scoped entirely by slug LIKE 'demo-%'. The real six were created with
-- bare slugs (u-utah, arizona-state, ...) and cannot match.
--
-- Order matters, and it is the order the demo seed's own cleanup uses:
--
--   · site_tasks before campus_channel_records, because site_tasks.record_id
--     cascades from it — deleting the parent first hides the count.
--   · student_outreach points at itself three ways (permission_dependency_id,
--     redirected_to_id, referred_from_id). Those links are broken first or
--     the rows guard each other.
--   · the append-only trigger on touchpoints is disabled for the delete and
--     re-enabled in an EXCEPTION block, so a rehearsal's deliberate failure
--     cannot leave the guard off.
--
-- ── REHEARSAL ─────────────────────────────────────────────────────────
-- v_apply is FALSE. As shipped it counts, reports the totals on the
-- exception, and rolls back. One line commits.
-- ===========================================================================

DO $$
DECLARE
  v_apply   BOOLEAN := FALSE;        -- <<< the only line to change
  n_campus  INT;
  n_chan    INT;
  n_crec    INT;
  n_site    INT;
  n_out     INT;
  n_task    INT;
  n_contact INT;
  n_touch   INT;
  n_appr    INT;
  n_real    INT;
BEGIN
  ALTER TABLE student_outreach_touchpoints DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  CREATE TEMP TABLE _demo_campus ON COMMIT DROP AS
    SELECT id FROM student_outreach_campuses WHERE slug LIKE 'demo-%';
  CREATE TEMP TABLE _demo_rows ON COMMIT DROP AS
    SELECT id FROM student_outreach WHERE campus_id IN (SELECT id FROM _demo_campus);

  SELECT count(*) INTO n_campus FROM _demo_campus;
  SELECT count(*) INTO n_out    FROM _demo_rows;

  -- The number that proves the scope is right: the real six must survive.
  SELECT count(*) INTO n_real
    FROM student_outreach_campuses
   WHERE slug IN ('u-utah','arizona-state','uw-madison',
                  'florida-state','indiana-bloomington','u-florida');

  DELETE FROM student_outreach_touchpoints WHERE outreach_id IN (SELECT id FROM _demo_rows);
  GET DIAGNOSTICS n_touch = ROW_COUNT;
  DELETE FROM student_outreach_approvals   WHERE outreach_id IN (SELECT id FROM _demo_rows);
  GET DIAGNOSTICS n_appr = ROW_COUNT;
  DELETE FROM student_outreach_tasks       WHERE outreach_id IN (SELECT id FROM _demo_rows);
  GET DIAGNOSTICS n_task = ROW_COUNT;
  DELETE FROM student_outreach_contacts    WHERE outreach_id IN (SELECT id FROM _demo_rows);
  GET DIAGNOSTICS n_contact = ROW_COUNT;

  UPDATE student_outreach
     SET permission_dependency_id = NULL,
         redirected_to_id         = NULL,
         referred_from_id         = NULL
   WHERE id IN (SELECT id FROM _demo_rows);

  DELETE FROM student_outreach WHERE campus_id IN (SELECT id FROM _demo_campus);

  DELETE FROM site_tasks WHERE campus_id IN (SELECT id FROM _demo_campus);
  GET DIAGNOSTICS n_site = ROW_COUNT;
  DELETE FROM campus_channel_records WHERE channel_id IN
    (SELECT id FROM campus_channels WHERE campus_id IN (SELECT id FROM _demo_campus));
  GET DIAGNOSTICS n_crec = ROW_COUNT;
  DELETE FROM campus_channels WHERE campus_id IN (SELECT id FROM _demo_campus);
  GET DIAGNOSTICS n_chan = ROW_COUNT;
  DELETE FROM student_outreach_campuses WHERE id IN (SELECT id FROM _demo_campus);

  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;

  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved — demo campuses % · outreach % · tasks % · contacts % · touchpoints % · approvals % · channels % · channel records % · site tasks %. Real campuses still present: % (must be 6). Set v_apply := TRUE to commit.',
      n_campus, n_out, n_task, n_contact, n_touch, n_appr, n_chan, n_crec, n_site, n_real;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Never leave the append-only guard off, including on the rehearsal's
  -- deliberate failure.
  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  RAISE;
END $$;

-- ── the board, after ─────────────────────────────────────────────────────
SELECT
  sc.slug,
  sc.name,
  count(DISTINCT so.id) AS provider_records,
  (SELECT count(*) FROM campus_channels cc WHERE cc.campus_id = sc.id) AS channels
FROM student_outreach_campuses sc
LEFT JOIN student_outreach so ON so.campus_id = sc.id AND so.kind = 'provider'
GROUP BY sc.id, sc.slug, sc.name
ORDER BY provider_records DESC;

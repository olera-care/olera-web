-- ===========================================================================
-- 29 — start the advisors over (DESTRUCTIVE, no undo)
-- ===========================================================================
-- Every advisor record on the board was made before there was a way to find
-- them properly. They are being cleared so each university starts again from
-- "Find career centers and advising offices", with the contact details the
-- sweep now collects.
--
-- There is no snapshot. Deleting a provider writes one, because the
-- catchment would otherwise recreate it; nothing recreates an advisor, so
-- nothing was built to remember one. Anything logged against an advising
-- office — notes, call history, files — goes and does not come back.
--
-- The sweep itself needs no seeding. The board shows it for any campus with
-- no completed advisor_sweep row, so clearing those rows is what puts the
-- task back at every university.
-- ===========================================================================

-- ── REHEARSAL: what would go ───────────────────────────────────────────────
SELECT c.name AS campus,
       count(o.id)                                                              AS advisor_records,
       (SELECT count(*) FROM student_outreach_tasks t
          JOIN student_outreach o2 ON o2.id = t.outreach_id
         WHERE o2.campus_id = c.id AND o2.kind = 'advisor')                     AS tasks,
       (SELECT count(*) FROM student_outreach_tasks t
          JOIN student_outreach o2 ON o2.id = t.outreach_id
         WHERE o2.campus_id = c.id AND o2.kind = 'advisor'
           AND t.status = 'completed')                                          AS completed_tasks,
       (SELECT count(*) FROM student_outreach_tasks t
          JOIN student_outreach o2 ON o2.id = t.outreach_id
         WHERE o2.campus_id = c.id AND o2.kind = 'advisor'
           AND coalesce(t.notes, '') <> '')                                     AS tasks_with_notes
FROM student_outreach_campuses c
LEFT JOIN student_outreach o ON o.campus_id = c.id AND o.kind = 'advisor'
GROUP BY c.id, c.name
HAVING count(o.id) > 0
ORDER BY c.name;

-- Every note about to be destroyed, so it can be read before it is.
SELECT c.name AS campus,
       o.organization_name,
       t.payload->>'outcome' AS outcome,
       t.notes,
       t.completed_at AT TIME ZONE 'America/New_York' AS completed_et
FROM student_outreach_tasks t
JOIN student_outreach o          ON o.id = t.outreach_id
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE o.kind = 'advisor' AND coalesce(t.notes, '') <> ''
ORDER BY c.name, t.completed_at;

-- Files on advisor records. Storage does not cascade, so any path here has
-- to be removed from the medjobs-collateral bucket by hand afterwards.
SELECT a.path, a.filename, o.organization_name
FROM medjobs_attachments a
JOIN student_outreach o ON o.id = a.outreach_id
WHERE o.kind = 'advisor';

-- How many universities get the sweep back.
SELECT count(*) AS campuses_with_a_completed_sweep
FROM site_tasks
WHERE task_type = 'advisor_sweep' AND status = 'completed';

-- ── APPLY: uncomment the three statements and run ──────────────────────────
-- Each is on one line so uncommenting cannot leave half of one behind.

-- SELECT medjobs_purge_touchpoints(id) FROM student_outreach WHERE kind = 'advisor';

-- Tasks, contacts and attachment rows all cascade from the record.
-- DELETE FROM student_outreach WHERE kind = 'advisor';

-- What puts the sweep back on every board.
-- DELETE FROM site_tasks WHERE task_type = 'advisor_sweep';

-- ── CONFIRM ────────────────────────────────────────────────────────────────
-- SELECT
--   (SELECT count(*) FROM student_outreach WHERE kind = 'advisor')                        AS advisors_left,
--   (SELECT count(*) FROM site_tasks WHERE task_type = 'advisor_sweep')                   AS sweep_rows_left,
--   (SELECT count(*) FROM student_outreach_campuses WHERE is_active)                      AS campuses_now_showing_the_sweep;

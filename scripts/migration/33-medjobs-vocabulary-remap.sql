-- ===========================================================================
-- 33 — remap stored rung positions after the vocabulary pass
-- ===========================================================================
-- A task row stores payload.step: the rung's INDEX in its ladder. Three
-- ladders changed shape, so three sets of stored indexes now name a
-- different rung than the one they were written for. Nothing errors — the
-- task screen renders null for a step off the end, so the symptom is a blank
-- drawer, and a step that lands on the wrong rung shows the wrong task.
--
-- RUN THIS IN THE SAME DEPLOY AS THE CODE. Between the two, records are
-- pointing at the old ladder.
--
-- Safe to run twice. Each remapped row is stamped with "v33" and skipped on a
-- second pass — without that the sets overlap and a second run shifts every
-- row again, which was true of the first draft of this script and was caught
-- by running it twice against a real database rather than reading it.
-- ===========================================================================

BEGIN;

-- ── STUDENTS ──────────────────────────────────────────────────────────────
--   was                          now
--   0 Meeting with the student → 2
--   1 Complete their application → 0
--   2 Get them an interview     → 3
--   3 Confirm hire              → 4
--   4 Confirm hours worked      → 6   (Qualify 1 and Mentor 5 are new)
UPDATE student_outreach_tasks t
SET payload = jsonb_set(t.payload, '{step}',
      to_jsonb(CASE (t.payload->>'step')::int
        WHEN 0 THEN 2 WHEN 1 THEN 0 WHEN 2 THEN 3 WHEN 3 THEN 4 WHEN 4 THEN 6 END))
      || '{"v33": true}'::jsonb
FROM student_outreach o
WHERE o.id = t.outreach_id
  AND o.kind = 'student'
  AND NOT (t.payload ? 'v33')
  AND (t.payload->>'step')::int IN (0,1,2,3,4);

-- ── ADVISORS ──────────────────────────────────────────────────────────────
--   0 Research the advising offices → deleted (no record ever sat here)
--   1 Send the program info         → 0
--   2 Follow up                     → 1
--   3 Confirm the flyer circulating → 2
--   4 Confirm a meeting             → 3   (now "Meeting with the team")
--   5 Log the meeting               → 3   (merged into the rung above)
--   6 Recirculate                   → 4   (now "Seasonal check")
--   7 the sweep                     → 5
UPDATE student_outreach_tasks t
SET payload = jsonb_set(t.payload, '{step}',
      to_jsonb(CASE (t.payload->>'step')::int
        WHEN 0 THEN 0 WHEN 1 THEN 0 WHEN 2 THEN 1 WHEN 3 THEN 2
        WHEN 4 THEN 3 WHEN 5 THEN 3 WHEN 6 THEN 4 WHEN 7 THEN 5 END))
      || '{"v33": true}'::jsonb
FROM student_outreach o
WHERE o.id = t.outreach_id
  AND o.stakeholder_type = 'advisor'
  AND NOT (t.payload ? 'v33')
  AND (t.payload->>'step')::int IN (0,1,2,3,4,5,6,7);

-- ── JOB BOARD ─────────────────────────────────────────────────────────────
-- Rungs 0-4 did not move. Only "Get the listing back up" (5) is gone; a
-- channel sitting on it goes back to the seasonal check it came from.
UPDATE site_tasks
SET payload = jsonb_set(payload, '{step}', to_jsonb(4))
WHERE (payload->>'step')::int = 5
  AND task_type NOT IN ('provider_map_sweep', 'advisor_sweep');

-- ── PROVIDERS ─────────────────────────────────────────────────────────────
-- Nothing moved. Renames only.

-- ── the document ──────────────────────────────────────────────────────────
-- Three rungs are gone, and the contents is drawn from these rows, not from
-- the code — so without this their sections keep appearing in the list with
-- nothing linking to them. Retired, not deleted: some of them hold call copy
-- somebody wrote.
UPDATE medjobs_scripts
SET position = 9000 + position,
    title = title || ' (retired)'
WHERE slug IN (
  'advisors-research-the-advising-offices',
  'advisors-log-the-meeting',
  'jobboard-relist'
) AND title NOT LIKE '% (retired)';

COMMIT;

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT o.kind, o.stakeholder_type, t.payload->>'step' AS step, count(*)
FROM student_outreach_tasks t
JOIN student_outreach o ON o.id = t.outreach_id
WHERE o.kind = 'student' OR o.stakeholder_type = 'advisor'
GROUP BY 1,2,3
ORDER BY 1,2,3;

SELECT slug, title, position FROM medjobs_scripts
WHERE title LIKE '% (retired)' ORDER BY slug;

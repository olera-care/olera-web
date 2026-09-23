-- ===========================================================================
-- 34 — remap stored rung positions on the student orgs ladder
-- ===========================================================================
-- Run this in the same deploy as the code, and after migration 249.
--
-- The orgs ladder lost two rungs. "Identify the student orgs" is a sweep now
-- — a campus-level task like the advisor one — and "Identify a contact at
-- the org" is gone, because the sweep's add form takes the officer's name,
-- role, email and phone at the moment you find the org.
--
--   was                                         now
--   0 Identify the student orgs               → the sweep, no record sits here
--   1 Identify a contact at the org           → 0  (send the program info)
--   2 Send the program info                   → 0
--   3 Follow up                               → 1
--   4 Confirm the flyer went out or a
--     presentation is booked                  → 2  (confirm the flyer went out)
--   5 Recirculate with the org                → 4  (seasonal check)
--
-- Rung 3, "Book a presentation", is new: the old rung 4 had two outcomes
-- wearing one title, so the board could not tell which had happened.
--
-- Safe to run twice: each remapped row is stamped and skipped afterwards.
-- ===========================================================================

BEGIN;

UPDATE student_outreach_tasks t
SET payload = jsonb_set(t.payload, '{step}',
      to_jsonb(CASE (t.payload->>'step')::int
        WHEN 0 THEN 0 WHEN 1 THEN 0 WHEN 2 THEN 0
        WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 4 END))
      || '{"v34": true}'::jsonb
FROM student_outreach o
WHERE o.id = t.outreach_id
  AND o.stakeholder_type = 'student_org'
  AND NOT (t.payload ? 'v34')
  AND (t.payload->>'step')::int IN (0,1,2,3,4,5);

-- The two rungs that are gone, retired in the document rather than deleted —
-- the contents is drawn from these rows, not from the code, so without this
-- they keep appearing with nothing linking to them.
UPDATE medjobs_scripts
SET position = 9000 + position,
    title = title || ' (retired)'
WHERE slug IN (
  'orgs-identify-the-student-orgs',
  'orgs-identify-a-contact-at-the-org'
) AND title NOT LIKE '% (retired)';

COMMIT;

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT t.payload->>'step' AS step, count(*)
FROM student_outreach_tasks t
JOIN student_outreach o ON o.id = t.outreach_id
WHERE o.stakeholder_type = 'student_org'
GROUP BY 1 ORDER BY 1;

SELECT slug, title FROM medjobs_scripts
WHERE title LIKE '% (retired)' ORDER BY slug;

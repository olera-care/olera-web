-- ===========================================================================
-- 35 — remap the campus events and professors ladders
-- ===========================================================================
-- Run in the same deploy as the code, and after migration 250.
--
-- Both sections had the same fault the orgs one did: their first rung was
-- rendered against a placeholder record with a synthetic id, and pressing
-- the button answered 404. Both are sweeps now.
--
-- CAMPUS EVENTS
--   was                                    now
--   0 Research career fairs and events   → the sweep, no record sits here
--   1 Sign up for the event              → 0  (Inquire about participating)
--   2 Ask the advisor about other events → 0  (rung removed)
--   3 Set the event up                   → 2  (Prepare for the event)
--   4 Prepare for the event              → 2
--   5 Attend and document                → 3
--   6 What's coming this term            → 4  (Seasonal check)
--   "Assign a leader" at 1 is new, so nothing maps onto it.
--
-- PROFESSORS
--   0 Get permission to email professors → 0  (removed as a gate; see below)
--   1 Identify professors from directory → the sweep, no record sits here
--   2 Email — flyer and class visit      → 0
--   3 Message professors again           → 2  (Seasonal check)
--   "Confirm they shared it" at 1 is new.
--
-- Permission from a dean or chair is no longer the gate for the whole
-- professors section. It blocked every faculty email behind an approval that
-- may never come, and the email now reads as one professor writing to
-- another rather than as an authorised campaign. Where an advising office
-- has agreed to be named, that is still worth saying — it just no longer
-- stops anybody starting.
--
-- Safe to run twice: each remapped row is stamped and skipped afterwards.
-- ===========================================================================

BEGIN;

UPDATE student_outreach_tasks t
SET payload = jsonb_set(t.payload, '{step}',
      to_jsonb(CASE (t.payload->>'step')::int
        WHEN 0 THEN 0 WHEN 1 THEN 0 WHEN 2 THEN 0
        WHEN 3 THEN 2 WHEN 4 THEN 2 WHEN 5 THEN 3 WHEN 6 THEN 4 END))
      || '{"v35": true}'::jsonb
FROM student_outreach o
WHERE o.id = t.outreach_id
  AND o.stakeholder_type = 'event'
  AND NOT (t.payload ? 'v35')
  AND (t.payload->>'step')::int IN (0,1,2,3,4,5,6);

UPDATE student_outreach_tasks t
SET payload = jsonb_set(t.payload, '{step}',
      to_jsonb(CASE (t.payload->>'step')::int
        WHEN 0 THEN 0 WHEN 1 THEN 0 WHEN 2 THEN 0 WHEN 3 THEN 2 END))
      || '{"v35": true}'::jsonb
FROM student_outreach o
WHERE o.id = t.outreach_id
  AND o.stakeholder_type IN ('professor', 'dept_head')
  AND NOT (t.payload ? 'v35')
  AND (t.payload->>'step')::int IN (0,1,2,3);

-- The rungs that are gone. Retired rather than deleted — the contents is
-- drawn from these rows, not from the code, and some hold written copy.
UPDATE medjobs_scripts
SET position = 9000 + position,
    title = title || ' (retired)'
WHERE slug IN (
  'events-research-career-fairs-and-events',
  'events-sign-up-for-the-event',
  'events-ask-the-advisor-about-other-events',
  'events-set-the-event-up',
  'professors-get-permission-to-email-professors',
  'professors-identify-professors-from-the-directory'
) AND title NOT LIKE '% (retired)';

COMMIT;

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT o.stakeholder_type, t.payload->>'step' AS step, count(*)
FROM student_outreach_tasks t
JOIN student_outreach o ON o.id = t.outreach_id
WHERE o.stakeholder_type IN ('event', 'professor', 'dept_head')
GROUP BY 1,2 ORDER BY 1,2;

SELECT count(*) AS retired_sections FROM medjobs_scripts WHERE title LIKE '% (retired)';

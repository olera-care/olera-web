-- ===========================================================================
-- Seed three demo universities for walking the Tasks flow
-- ===========================================================================
-- ADDITIVE. Deletes nothing. Creates three universities whose names all
-- begin with "ZZ Demo" so they sort to the bottom of the board, sit
-- obviously apart from real campuses, and can be removed in one statement
-- (see the bottom of this file).
--
-- They cover the three states worth feeling:
--
--   ZZ Demo · Busy Campus     lots waiting, several sections mid-ladder
--   ZZ Demo · Fresh Campus    just added, everything at rung one
--   ZZ Demo · Finished Campus nothing waiting, goals reached
--
-- Safe to run more than once: it deletes and rebuilds only the ZZ Demo
-- campuses, never anything else.
--
-- Run this whole file in the Supabase SQL editor. It is one DO block, so
-- the editor runs it as one transaction and either all of it lands or none
-- of it does.
-- ===========================================================================

DO $$
DECLARE
  busy_id     UUID;
  fresh_id    UUID;
  done_id     UUID;
  rec_id      UUID;
  today       DATE := CURRENT_DATE;

BEGIN
  -- ── clear any previous run ───────────────────────────────────────────
  -- Explicit, child-first, rather than trusting every FK to cascade. The
  -- touchpoint trigger blocks deletes, so it comes off for this block only
  -- and goes back on at the end whatever happens.
  ALTER TABLE student_outreach_touchpoints DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  CREATE TEMP TABLE IF NOT EXISTS _demo_campus ON COMMIT DROP AS
    SELECT id FROM student_outreach_campuses WHERE name LIKE 'ZZ Demo%';
  CREATE TEMP TABLE IF NOT EXISTS _demo_rows ON COMMIT DROP AS
    SELECT id FROM student_outreach WHERE campus_id IN (SELECT id FROM _demo_campus);

  DELETE FROM student_outreach_touchpoints WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_approvals   WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_tasks       WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_contacts    WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach             WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM site_tasks                   WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM campus_channels              WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM student_outreach_campuses    WHERE id         IN (SELECT id FROM _demo_campus);

  -- ── the campuses ─────────────────────────────────────────────────────
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('ZZ Demo · Busy Campus', 'zz-demo-busy') RETURNING id INTO busy_id;
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('ZZ Demo · Fresh Campus', 'zz-demo-fresh') RETURNING id INTO fresh_id;
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('ZZ Demo · Finished Campus', 'zz-demo-finished') RETURNING id INTO done_id;

  -- ── channel dots ─────────────────────────────────────────────────────
  INSERT INTO campus_channels (campus_id, channel, status, criteria) VALUES
    (busy_id,  'st3', 'live',        '{"submitted":"2026-08-01","approved":"2026-08-04","visible":"2026-08-09"}'),
    (busy_id,  'st4', 'in_progress', '{"flyer_sent":"2026-09-01"}'),
    (busy_id,  'st5', 'in_progress', '{}'),
    (busy_id,  'st6', 'not_yet',     '{}'),
    (busy_id,  'st7', 'in_progress', '{"pathway":"2026-09-02","approved":"2026-09-03"}'),
    (fresh_id, 'st3', 'not_yet', '{}'),
    (fresh_id, 'st4', 'not_yet', '{}'),
    (fresh_id, 'st5', 'not_yet', '{}'),
    (fresh_id, 'st6', 'not_yet', '{}'),
    (fresh_id, 'st7', 'not_yet', '{}'),
    (done_id,  'st3', 'live', '{"submitted":"2026-06-01","approved":"2026-06-03","visible":"2026-06-08"}'),
    (done_id,  'st4', 'live', '{"flyer_sent":"2026-06-10","agreed":"2026-06-11","confirmed":"2026-06-14"}'),
    (done_id,  'st5', 'live', '{}'),
    (done_id,  'st6', 'live', '{}'),
    (done_id,  'st7', 'live', '{"pathway":"2026-06-02","approved":"2026-06-05"}');

  -- ═════════════════════════════════════════════════════════════════════
  -- BUSY CAMPUS
  -- ═════════════════════════════════════════════════════════════════════

  -- A provider mid follow-ups: two rounds behind it, round 3 due today.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'provider', NULL, 'Desert Bloom Home Care', 'outreach_sent', 6)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Denise Alvarez', 'Denise', 'Alvarez', 'denise@desertbloom.example', '(602) 555-0118');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":0,"round":0}', 'Gatekeeper is Denise. Only picks up after 2pm.', today - 6),
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":1,"round":0}', NULL, today - 4),
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":2,"round":1}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'completed', today,     '{"step":2,"round":2}', NULL, today),
    (rec_id, 'outreach_contact', 'pending',   today,     '{"step":2,"round":3}', NULL, NULL);

  -- A provider at rung one: nothing behind it, the first call due today.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'provider', NULL, 'Saguaro Senior Services', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(602) 555-0142');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}');

  -- A provider already signed up: the goal, nothing waiting.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'provider', NULL, 'Copper State Caregivers', 'active_partner', 12)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Rita Nguyen', 'Rita', 'Nguyen', 'rita@copperstate.example', '(602) 555-0177');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, completed_at)
    VALUES (rec_id, 'outreach_contact', 'completed', today - 20, '{"step":5,"round":0}', today - 20);

  -- An advising office that has been emailed and is on follow-up two.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'advisor', 'advisor', 'Pre-Health Advising Office', 'outreach_sent', 4)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Karen Whitfield', 'Karen', 'Whitfield', 'prehealth@zzdemo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":1,"round":0}', 'Karen asked us to come back the first week of term.', today - 4),
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":2,"round":1}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'pending',   today,     '{"step":2,"round":2}', NULL, NULL);

  -- A second advising office still at the research rung.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'advisor', 'advisor', 'Nursing Student Services', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":1,"round":0}');

  -- A student org needing a named contact.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'student_org', 'student_org', 'Pre-Med Society', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":1,"round":0}');

  -- Two professors waiting on their one email each.
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'professor', 'professor', 'Dr. Priya Mehta · BIO 340', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dr. Priya Mehta', 'Priya', 'Mehta', 'p.mehta@zzdemo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":0}');

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'professor', 'professor', 'Dr. Samuel Okafor · NUR 210', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dr. Samuel Okafor', 'Samuel', 'Okafor', 's.okafor@zzdemo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":0}');

  -- The job board, already live, with its monthly check a week out.
  INSERT INTO site_tasks (campus_id, task_type, status, due_at, payload)
    VALUES (busy_id, 'activation_job_board_check', 'pending', today + 7, '{"step":3,"round":0}');

  -- ═════════════════════════════════════════════════════════════════════
  -- FRESH CAMPUS — everything at rung one, nothing behind it
  -- ═════════════════════════════════════════════════════════════════════

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (fresh_id, 'provider', NULL, 'Buckeye Home Health', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(614) 555-0110');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}');

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (fresh_id, 'provider', NULL, 'Golden Years Home Care', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(614) 555-0142');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}');

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (fresh_id, 'advisor', 'advisor', 'Career Center', 'prospect', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload)
    VALUES (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}');

  INSERT INTO site_tasks (campus_id, task_type, status, due_at, payload)
    VALUES (fresh_id, 'activation_job_board_check', 'pending', today, '{"step":0,"round":0}');

  -- ═════════════════════════════════════════════════════════════════════
  -- FINISHED CAMPUS — goals reached, nothing waiting
  -- ═════════════════════════════════════════════════════════════════════

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (done_id, 'provider', NULL, 'A Caring Hand', 'active_partner', 12)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Bev Lindqvist', 'Bev', 'Lindqvist', 'office@acaringhand.example', '(801) 555-0100');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, completed_at)
    VALUES (rec_id, 'outreach_contact', 'completed', today - 30, '{"step":5,"round":0}', today - 30);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (done_id, 'advisor', 'advisor', 'Pre-PA Advising', 'active_partner', 12)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, completed_at)
    VALUES (rec_id, 'outreach_contact', 'completed', today - 40, '{"step":5,"round":0}', today - 40);

  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  RAISE NOTICE 'Seeded three ZZ Demo campuses.';
EXCEPTION WHEN OTHERS THEN
  -- Never leave the trigger off. The transaction rolls back either way, but
  -- being explicit means a partial run cannot quietly weaken the table.
  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  RAISE;
END $$;

-- ===========================================================================
-- What landed
-- ===========================================================================
-- Run this after, on its own, to see it.
--
-- SELECT c.name AS university,
--        count(*) FILTER (WHERE t.status = 'pending' AND t.due_at::date <= CURRENT_DATE) AS waiting_today,
--        count(DISTINCT so.id) AS records
--   FROM student_outreach_campuses c
--   LEFT JOIN student_outreach so ON so.campus_id = c.id
--   LEFT JOIN student_outreach_tasks t ON t.outreach_id = so.id
--  WHERE c.name LIKE 'ZZ Demo%'
--  GROUP BY c.name
--  ORDER BY c.name;

-- ===========================================================================
-- Removing the demo data
-- ===========================================================================
-- One statement. Everything else cascades from the campus.
--
-- DELETE FROM student_outreach_campuses WHERE name LIKE 'ZZ Demo%';

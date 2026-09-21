-- ===========================================================================
-- Comprehensive demo seed — every state the Tasks board can show
-- ===========================================================================
-- Four universities, 28 records, covering the states worth clicking through:
--
--   Arizona State University    busy. Providers at rung one, mid follow-ups,
--                               follow-up 7 of 7, replied-and-scheduling,
--                               meeting booked, signed up, archived with no
--                               reply, stopped on a wrong number, scheduled
--                               for later, and one overdue. Advisors, orgs
--                               and professors in mixed states, plus the
--                               professor permission gate already granted.
--   Ohio State University       fresh. Three providers at rung one, nothing
--                               behind them. Every other section starts
--                               itself, so this is the empty-campus case.
--   University of Utah          finished. Goals reached, nothing waiting.
--   University of Wisconsin     dead. Everything stopped, archived or
--                               declined — the board with no live work.
--
-- Slugs begin `demo-` so the whole set drops in one statement:
--
--   DELETE FROM student_outreach_campuses WHERE slug LIKE 'demo-%';
--
-- Safe to run repeatedly: it rebuilds only the `demo-` campuses.
--
-- Provider rows carry a synthetic research_data.olera_provider_id because
-- migration 074 requires every kind='provider' row to reference an
-- underlying provider one way or the other.
-- ===========================================================================

DO $$
DECLARE
  busy_id   UUID;
  fresh_id  UUID;
  done_id   UUID;
  dead_id   UUID;
  rec_id    UUID;
  chan_id   UUID;
  crec_id   UUID;
  today     DATE := CURRENT_DATE;

BEGIN
  ALTER TABLE student_outreach_touchpoints DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  CREATE TEMP TABLE IF NOT EXISTS _demo_campus ON COMMIT DROP AS
    SELECT id FROM student_outreach_campuses WHERE slug LIKE 'demo-%' OR slug LIKE 'zz-demo-%';
  CREATE TEMP TABLE IF NOT EXISTS _demo_rows ON COMMIT DROP AS
    SELECT id FROM student_outreach WHERE campus_id IN (SELECT id FROM _demo_campus);

  DELETE FROM student_outreach_touchpoints WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_approvals   WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_tasks       WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach_contacts    WHERE outreach_id IN (SELECT id FROM _demo_rows);
  DELETE FROM student_outreach             WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM site_tasks                   WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM campus_channel_records       WHERE channel_id IN
    (SELECT id FROM campus_channels WHERE campus_id IN (SELECT id FROM _demo_campus));
  DELETE FROM campus_channels              WHERE campus_id  IN (SELECT id FROM _demo_campus);
  DELETE FROM student_outreach_campuses    WHERE id         IN (SELECT id FROM _demo_campus);

  -- ── the campuses ─────────────────────────────────────────────────────
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('Arizona State University', 'demo-arizona-state') RETURNING id INTO busy_id;
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('Ohio State University', 'demo-ohio-state') RETURNING id INTO fresh_id;
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('University of Utah', 'demo-utah') RETURNING id INTO done_id;
  INSERT INTO student_outreach_campuses (name, slug)
    VALUES ('University of Wisconsin-Madison', 'demo-wisconsin') RETURNING id INTO dead_id;

  -- ── channel dots: one campus per colour combination ──────────────────
  INSERT INTO campus_channels (campus_id, channel, status, criteria) VALUES
    (busy_id,  'st3', 'live',           '{"submitted":"2026-08-01","approved":"2026-08-04","visible":"2026-08-09"}'),
    (busy_id,  'st4', 'in_progress',    '{"flyer_sent":"2026-09-01"}'),
    (busy_id,  'st5', 'in_progress',    '{}'),
    (busy_id,  'st6', 'not_yet',        '{}'),
    (busy_id,  'st7', 'in_progress',    '{"pathway":"2026-09-02","approved":"2026-09-03"}'),
    (fresh_id, 'st3', 'not_yet', '{}'),
    (fresh_id, 'st4', 'not_yet', '{}'),
    (fresh_id, 'st5', 'not_yet', '{}'),
    (fresh_id, 'st6', 'not_yet', '{}'),
    (fresh_id, 'st7', 'not_yet', '{}'),
    (done_id,  'st3', 'live', '{"submitted":"2026-06-01","approved":"2026-06-03","visible":"2026-06-08"}'),
    (done_id,  'st4', 'live', '{"flyer_sent":"2026-06-10","agreed":"2026-06-11","confirmed":"2026-06-14"}'),
    (done_id,  'st5', 'live', '{}'),
    (done_id,  'st6', 'live', '{}'),
    (done_id,  'st7', 'live', '{"pathway":"2026-06-02","approved":"2026-06-05"}'),
    -- Wisconsin shows the fourth dot colour: a channel ruled out entirely.
    (dead_id,  'st3', 'not_available', '{}'),
    (dead_id,  'st4', 'not_available', '{}'),
    (dead_id,  'st5', 'not_yet', '{}'),
    (dead_id,  'st6', 'not_yet', '{}'),
    (dead_id,  'st7', 'not_available', '{}');

  -- mid follow-ups, round 3 of 7, with a note in history
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Desert Bloom Home Care', 'outreach_sent', 6, '{"olera_provider_id":"demo-desert-bloom"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Denise Alvarez', 'Denise', 'Alvarez', 'denise@desertbloom.example', '(602) 555-0118');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 8, '{"step":0,"round":0}', 'Gatekeeper is Denise. Only picks up after 2pm.', today - 8),
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":1,"round":0}', NULL, today - 6),
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":2,"round":1}', NULL, today - 4),
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":2,"round":2}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":3}', NULL, NULL);

  -- rung one: no contact yet, the call that finds one is due
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Saguaro Senior Services', 'researched', 0, '{"olera_provider_id":"demo-saguaro"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(602) 555-0142');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}', NULL, NULL);

  -- follow-up 7 of 7 — the last one before it archives
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Ocotillo Care Partners', 'outreach_sent', 12, '{"olera_provider_id":"demo-ocotillo"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Marcus Webb', 'Marcus', 'Webb', 'm.webb@ocotillo.example', '(602) 555-0163');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 16, '{"step":0,"round":0}', NULL, today - 16),
    (rec_id, 'outreach_contact', 'completed', today - 14, '{"step":1,"round":0}', NULL, today - 14),
    (rec_id, 'outreach_contact', 'completed', today - 12, '{"step":2,"round":1}', NULL, today - 12),
    (rec_id, 'outreach_contact', 'completed', today - 10, '{"step":2,"round":2}', NULL, today - 10),
    (rec_id, 'outreach_contact', 'completed', today - 8, '{"step":2,"round":3}', NULL, today - 8),
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":2,"round":4}', NULL, today - 6),
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":2,"round":5}', NULL, today - 4),
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":2,"round":6}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":7}', NULL, NULL);

  -- they replied: broke out of the rounds, now scheduling
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Mesa Family Homecare', 'engaged', 8, '{"olera_provider_id":"demo-mesa"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Priya Raman', 'Priya', 'Raman', 'priya@mesafamily.example', '(480) 555-0199');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 10, '{"step":0,"round":0}', NULL, today - 10),
    (rec_id, 'outreach_contact', 'completed', today - 8, '{"step":1,"round":0}', NULL, today - 8),
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":2,"round":1}', NULL, today - 6),
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":2,"round":2}', 'Called back — wants a time next week.', today - 4),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":3,"round":0}', NULL, NULL);

  -- meeting booked — the log-the-meeting branch is next
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Papago Senior Living', 'meeting_scheduled', 10, '{"olera_provider_id":"demo-papago"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Hal Brenner', 'Hal', 'Brenner', 'hal@papagoliving.example', '(480) 555-0121');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 12, '{"step":0,"round":0}', NULL, today - 12),
    (rec_id, 'outreach_contact', 'completed', today - 10, '{"step":1,"round":0}', NULL, today - 10),
    (rec_id, 'outreach_contact', 'completed', today - 8, '{"step":2,"round":1}', NULL, today - 8),
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":3,"round":0}', NULL, today - 6),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":4,"round":0}', NULL, NULL);

  -- goal reached: signed up
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Copper State Caregivers', 'active_partner', 12, '{"olera_provider_id":"demo-copper-state"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Rita Nguyen', 'Rita', 'Nguyen', 'rita@copperstate.example', '(602) 555-0177');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 20, '{"step":5,"round":0}', NULL, today - 20);

  -- archived — seven follow-ups, no reply
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Cactus Wren Home Aid', 'no_response_closed', 14, '{"olera_provider_id":"demo-cactus-wren"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(602) 555-0188');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 18, '{"step":2,"round":6}', NULL, today - 18),
    (rec_id, 'outreach_contact', 'completed', today - 16, '{"step":2,"round":7}', NULL, today - 16);

  -- stopped: wrong number
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Sonoran Respite Co', 'wrong_contact', 4, '{"olera_provider_id":"demo-sonoran"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(602) 555-0150');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":0,"round":0}', 'Number belongs to a dentist now.', today - 6);

  -- nothing ready — scheduled three days out
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Tempe Trusted Care', 'outreach_sent', 2, '{"olera_provider_id":"demo-tempe"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Joy Okonkwo', 'Joy', 'Okonkwo', 'joy@tempetrusted.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":0,"round":0}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'pending', today + 3, '{"step":1,"round":0}', NULL, NULL);

  -- OVERDUE — due three days ago
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (busy_id, 'provider', NULL, 'Chandler At Home', 'outreach_sent', 6, '{"olera_provider_id":"demo-chandler"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Aaron Pike', 'Aaron', 'Pike', 'aaron@chandlerathome.example', '(480) 555-0134');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 9, '{"step":0,"round":0}', NULL, today - 9),
    (rec_id, 'outreach_contact', 'completed', today - 7, '{"step":1,"round":0}', NULL, today - 7),
    (rec_id, 'outreach_contact', 'pending', today - 3, '{"step":2,"round":1}', NULL, NULL);

  -- advising office mid follow-ups
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'advisor', 'advisor', 'Pre-Health Advising Office', 'outreach_sent', 4)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Karen Whitfield', 'Karen', 'Whitfield', 'prehealth@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 6, '{"step":1,"round":0}', 'Karen asked us to come back the first week of term.', today - 6),
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":2,"round":1}', NULL, today - 4),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":2}', NULL, NULL);

  -- found by research, not yet emailed
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'advisor', 'advisor', 'Nursing Student Services', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":1,"round":0}', NULL, NULL);

  -- declined
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'advisor', 'advisor', 'Career Center', 'not_interested', 6)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dale Kimura', 'Dale', 'Kimura', 'careers@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 8, '{"step":1,"round":0}', 'Said they don''t circulate outside partners.', today - 8);

  -- org needing a named contact
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'student_org', 'student_org', 'Pre-Med Society', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":1,"round":0}', NULL, NULL);

  -- org with a contact, on follow-up one
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'student_org', 'student_org', 'Anesthesia Student Interest Group', 'outreach_sent', 4)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Tyler Brandt', 'Tyler', 'Brandt', 'asig@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 4, '{"step":1,"round":0}', NULL, today - 4),
    (rec_id, 'outreach_contact', 'completed', today - 2, '{"step":2,"round":0}', NULL, today - 2),
    (rec_id, 'outreach_contact', 'pending', today, '{"step":3,"round":1}', NULL, NULL);

  -- professor awaiting their one email
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'professor', 'professor', 'Dr. Priya Mehta · BIO 340', 'researched', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dr. Priya Mehta', 'Dr.', 'Priya Mehta', 'p.mehta@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":2,"round":0}', NULL, NULL);

  -- professor already emailed this season
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'professor', 'professor', 'Dr. Samuel Okafor · NUR 210', 'active_partner', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dr. Samuel Okafor', 'Dr.', 'Samuel Okafor', 's.okafor@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 5, '{"step":2,"round":0}', NULL, today - 5);

  -- the permission gate, granted
  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (busy_id, 'dept_head', 'dept_head', 'Dean Alicia Ford · Health Sciences', 'active_partner', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Alicia Ford', 'Alicia', 'Ford', 'a.ford@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 30, '{"step":0,"round":0}', 'Approved us in writing on the 14th.', today - 30);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (fresh_id, 'provider', NULL, 'Buckeye Home Health', 'researched', 0, '{"olera_provider_id":"demo-buckeye"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(614) 555-0110');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}', NULL, NULL);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (fresh_id, 'provider', NULL, 'Golden Years Home Care', 'researched', 0, '{"olera_provider_id":"demo-golden-years"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(614) 555-0142');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}', NULL, NULL);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (fresh_id, 'provider', NULL, 'Scarlet Care Services', 'researched', 0, '{"olera_provider_id":"demo-scarlet"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(614) 555-0166');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'pending', today, '{"step":0,"round":0}', NULL, NULL);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (done_id, 'provider', NULL, 'A Caring Hand', 'active_partner', 12, '{"olera_provider_id":"demo-a-caring-hand"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Bev Lindqvist', 'Bev', 'Lindqvist', 'office@acaringhand.example', '(801) 555-0100');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 30, '{"step":5,"round":0}', NULL, today - 30);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (done_id, 'provider', NULL, 'Wasatch Senior Support', 'active_partner', 12, '{"olera_provider_id":"demo-wasatch"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Nils Aker', 'Nils', 'Aker', 'nils@wasatch.example', '(801) 555-0144');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 45, '{"step":5,"round":0}', NULL, today - 45);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (done_id, 'advisor', 'advisor', 'Pre-PA Advising', 'active_partner', 12)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Gail Turner', 'Gail', 'Turner', 'prepa@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 40, '{"step":5,"round":0}', NULL, today - 40);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (done_id, 'professor', 'professor', 'Dr. Lena Sandoval · BIOL 220', 'active_partner', 0)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, 'Dr. Lena Sandoval', 'Dr.', 'Lena Sandoval', 'l.sandoval@demo.example', NULL);
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 35, '{"step":2,"round":0}', NULL, today - 35);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (dead_id, 'provider', NULL, 'Badger Home Assist', 'do_not_contact', 8, '{"olera_provider_id":"demo-badger"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(608) 555-0177');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 20, '{"step":0,"round":0}', 'Asked us to stop calling.', today - 20);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day, research_data)
    VALUES (dead_id, 'provider', NULL, 'Lakeside Elder Care', 'no_response_closed', 14, '{"olera_provider_id":"demo-lakeside"}')
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_contacts (outreach_id, name, first_name, last_name, email, phone)
    VALUES (rec_id, '', NULL, NULL, NULL, '(608) 555-0199');
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 24, '{"step":2,"round":7}', NULL, today - 24);

  INSERT INTO student_outreach (campus_id, kind, stakeholder_type, organization_name, status, cadence_day)
    VALUES (dead_id, 'advisor', 'advisor', 'Student Health Advising', 'not_interested', 4)
    RETURNING id INTO rec_id;
  INSERT INTO student_outreach_tasks (outreach_id, task_type, status, due_at, payload, notes, completed_at) VALUES
    (rec_id, 'outreach_contact', 'completed', today - 22, '{"step":1,"round":0}', NULL, today - 22);


  -- ── campus events: they live in the activation ledger, not as outreach
  --    rows, because an event is not someone you run follow-up rounds at ──
  SELECT id INTO chan_id FROM campus_channels WHERE campus_id = busy_id AND channel = 'st6';

  INSERT INTO campus_channel_records (channel_id, kind, name, status, contacts)
    VALUES (chan_id, 'event', 'Fall Career Fair · Oct 14', 'in_progress',
            '[{"name":"Events Office","email":"careerfair@demo.example"}]')
    RETURNING id INTO crec_id;
  INSERT INTO site_tasks (campus_id, record_id, task_type, status, due_at, payload)
    VALUES (busy_id, crec_id, 'activation_event_review', 'pending', today, '{"step":3,"round":0}');

  INSERT INTO campus_channel_records (channel_id, kind, name, status, contacts)
    VALUES (chan_id, 'event', 'Health Professions Night · Nov 2', 'in_progress', '[]')
    RETURNING id INTO crec_id;
  INSERT INTO site_tasks (campus_id, record_id, task_type, status, due_at, payload)
    VALUES (busy_id, crec_id, 'activation_event_review', 'pending', today + 5, '{"step":1,"round":0}');

  INSERT INTO campus_channel_records (channel_id, kind, name, status, contacts)
    VALUES (chan_id, 'event', 'Spring Nursing Expo', 'live', '[]');

  -- Utah's events are done, which is what a finished section looks like.
  SELECT id INTO chan_id FROM campus_channels WHERE campus_id = done_id AND channel = 'st6';
  INSERT INTO campus_channel_records (channel_id, kind, name, status, contacts)
    VALUES (chan_id, 'event', 'Health Careers Fair', 'live', '[]');

  -- ── the job board, one per campus state ──────────────────────────────
  INSERT INTO site_tasks (campus_id, task_type, status, due_at, payload) VALUES
    -- live, monthly check a week out: nothing ready
    (busy_id,  'activation_job_board_check', 'pending', today + 7, '{"step":3,"round":0}'),
    -- never submitted: the first rung is due
    (fresh_id, 'activation_job_board_check', 'pending', today,     '{"step":0,"round":0}');

  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  RAISE NOTICE 'Seeded four demo campuses.';
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RAISE;
END $$;

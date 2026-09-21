-- Reset DuBose University of Olera to its teaching state.
--
-- Safe before every demo, and safe to run twice. It clears everything on the
-- demo campus and puts the same set back, so whatever last night clicked is
-- gone and every screen has something to open.
--
-- Nothing here can reach a real campus. Every statement resolves the campus
-- through is_demo rather than through a name or a slug alone, so a campus
-- somebody renames is still protected and one somebody creates with a
-- similar name is still out of reach. Run migration 238 first: it adds the
-- column and creates the campus.
--
-- Dates are relative to when you run it, so the board always has something
-- overdue, something due today and something due next week. Fixed dates read
-- as plausible for a fortnight and then as a campus nobody has touched.
--
-- What it seeds:
--
--   Providers   one on each rung, plus one at the goal, one archived, one
--               flagged for manager review, and one deep enough into the
--               follow-up block to show the warning
--   Students    four, at four stages
--   Job board   part way through, so the channel dots are not all grey
--
-- Advisors, orgs, events and professors stay empty. Those ladders are not
-- being taught yet, and an empty section reads as not started rather than as
-- broken.
--
-- The map sweep is not seeded and does not need to be: the board shows it
-- for any campus without a completed one, so it is there on a fresh reset
-- and gone again once you demonstrate it.

BEGIN;

-- The campus, resolved once. If this is empty every delete below matches
-- nothing and every insert fails on a missing campus, which is the right way
-- to fail: it means 238 has not been run.
CREATE TEMP TABLE demo_campus ON COMMIT DROP AS
SELECT id FROM student_outreach_campuses
WHERE slug = 'dubose-university-of-olera' AND is_demo;

-- ── clear ───────────────────────────────────────────────────────────────

DELETE FROM student_outreach_tasks t
USING student_outreach o, demo_campus d
WHERE t.outreach_id = o.id AND o.campus_id = d.id;

DELETE FROM student_outreach_contacts c
USING student_outreach o, demo_campus d
WHERE c.outreach_id = o.id AND o.campus_id = d.id;

DELETE FROM student_outreach o USING demo_campus d WHERE o.campus_id = d.id;
DELETE FROM site_tasks s      USING demo_campus d WHERE s.campus_id = d.id;
DELETE FROM campus_channels c USING demo_campus d WHERE c.campus_id = d.id;

-- Demo students carry the marker in their own metadata, because a student
-- profile has no campus column: the board reaches them through the
-- university name. Matching the marker rather than the name means a real
-- student who typed the demo university into their application survives.
DELETE FROM business_profile_tasks t
USING business_profiles p
WHERE t.business_profile_id = p.id AND p.metadata->>'is_demo' = 'true';

-- Placements cascade off either profile, but deleting them first keeps the
-- order readable rather than relying on it.
DELETE FROM medjobs_placements pl
USING business_profiles p
WHERE (pl.student_profile_id = p.id OR pl.provider_profile_id = p.id)
  AND p.metadata->>'is_demo' = 'true';

DELETE FROM business_profiles p WHERE p.metadata->>'is_demo' = 'true';

-- ── providers ───────────────────────────────────────────────────────────

INSERT INTO student_outreach
  (campus_id, kind, stakeholder_type, organization_name, status, research_data)
SELECT d.id, 'provider', NULL, v.name, v.status, v.research
FROM demo_campus d,
(VALUES
  ('Sunrise Home Care of Olera',        'researched',         '{}'::jsonb),
  ('Cedar Valley Caregivers',           'researched',         '{}'::jsonb),
  ('Harbor Point Home Care',            'researched',         '{}'::jsonb),
  ('Meridian Senior Care at Home',      'researched',         '{}'::jsonb),
  ('Crestwood Caregiving',              'researched',         '{}'::jsonb),
  ('Lakeside Family Home Care',         'researched',         '{}'::jsonb),
  ('Willow Creek Home Care',            'researched',         '{}'::jsonb),
  ('Ridgeline Home Services',           'researched',         '{}'::jsonb),
  ('Pinecrest Home Care',               'researched',
     jsonb_build_object('flagged_on', (now() - interval '1 day')::text)),
  ('Summit Ridge Home Care',            'ready_for_students', '{}'::jsonb),
  ('Fairview Home Care',                'archived',
     jsonb_build_object('archived_reason', 'Not interested',
                        'archived_at', (now() - interval '4 days')::text))
) AS v(name, status, research);

INSERT INTO student_outreach_contacts (outreach_id, name, role, email, phone, is_primary)
SELECT o.id, v.contact, v.role, v.email, v.phone, TRUE
FROM student_outreach o
JOIN demo_campus d ON d.id = o.campus_id
JOIN (VALUES
  ('Cedar Valley Caregivers',      'Dana Whitfield', 'Owner',            'dana@example.test',  '555-0101'),
  ('Harbor Point Home Care',       'Miguel Santos',  'Care Manager',     'miguel@example.test','555-0102'),
  ('Meridian Senior Care at Home', 'Priya Raman',    'Director',         'priya@example.test', '555-0103'),
  ('Crestwood Caregiving',         'Tom Alvarez',    'Owner',            'tom@example.test',   '555-0104'),
  ('Lakeside Family Home Care',    'Rita Okafor',    'Staffing Lead',    'rita@example.test',  '555-0105'),
  ('Willow Creek Home Care',       'Nora Feldman',   'Owner',            'nora@example.test',  '555-0109'),
  ('Ridgeline Home Services',      'Sam Beaumont',   'Operations',       'sam@example.test',   '555-0106'),
  ('Pinecrest Home Care',          'Joy Nakamura',   'Owner',            'joy@example.test',   '555-0107'),
  ('Summit Ridge Home Care',       'Ellis Grant',    'Administrator',    'ellis@example.test', '555-0108')
) AS v(name, contact, role, email, phone) ON v.name = o.organization_name;

-- One row per task. `outcome` on a completed row is what the board prints
-- back, so it has to be a label the rung actually offers.
INSERT INTO student_outreach_tasks
  (outreach_id, task_type, status, due_at, completed_at, payload, notes)
SELECT o.id, v.task_type, v.status,
       (current_date + v.due_in)::timestamptz,
       CASE WHEN v.status = 'completed'
            THEN now() - (v.done_ago || ' days')::interval END,
       v.payload, v.notes
FROM student_outreach o
JOIN demo_campus d ON d.id = o.campus_id
JOIN (VALUES
  -- 0 Research, nothing done yet.
  ('Sunrise Home Care of Olera', 'research_initial',  'pending',   0, 0,
     '{"step":0,"round":0}'::jsonb, NULL),

  -- 1 and 2 open together, with a voicemail already logged on the call.
  ('Cedar Valley Caregivers', 'research_initial',  'completed', -4, 4,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, 'Website and address checked.'),
  ('Cedar Valley Caregivers', 'outreach_contact',  'completed', -2, 2,
     '{"step":1,"round":0,"outcome":"Left a voicemail"}'::jsonb, 'Voicemail, no callback yet.'),
  ('Cedar Valley Caregivers', 'outreach_contact',  'pending',    0, 0,
     '{"step":1,"round":1}'::jsonb, NULL),
  ('Cedar Valley Caregivers', 'outreach_contact',  'pending',    1, 0,
     '{"step":2,"round":0}'::jsonb, NULL),

  -- 3 the cold follow-up, first round.
  ('Harbor Point Home Care', 'research_initial', 'completed', -9, 9,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Harbor Point Home Care', 'outreach_contact', 'completed', -7, 7,
     '{"step":1,"round":0,"outcome":"Confirmed contact"}'::jsonb, 'Miguel is the right person.'),
  ('Harbor Point Home Care', 'outreach_contact', 'completed', -6, 6,
     '{"step":2,"round":0,"outcome":"Log email sent"}'::jsonb, 'Program info sent.'),
  ('Harbor Point Home Care', 'outreach_contact', 'pending',    2, 0,
     '{"step":3,"round":1}'::jsonb, NULL),

  -- 3 again, four rounds in and overdue, so the warning shows.
  ('Meridian Senior Care at Home', 'research_initial', 'completed', -22, 22,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'completed', -20, 20,
     '{"step":1,"round":0,"outcome":"Confirmed contact"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'completed', -18, 18,
     '{"step":2,"round":0,"outcome":"Log email sent"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'completed', -14, 14,
     '{"step":3,"round":1,"outcome":"No answer"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'completed', -10, 10,
     '{"step":3,"round":2,"outcome":"No answer"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'completed',  -6,  6,
     '{"step":3,"round":3,"outcome":"Left a voicemail"}'::jsonb, NULL),
  ('Meridian Senior Care at Home', 'outreach_contact', 'pending',    -3,  0,
     '{"step":3,"round":4}'::jsonb, NULL),

  -- 4 the pack has gone, onboarding follow-up waiting.
  ('Crestwood Caregiving', 'research_initial', 'completed', -12, 12,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Crestwood Caregiving', 'outreach_contact', 'completed', -10, 10,
     '{"step":1,"round":0,"outcome":"Interested, start onboarding"}'::jsonb,
     'Said yes on the first call.'),
  ('Crestwood Caregiving', 'outreach_contact', 'completed',  -9,  9,
     '{"step":4,"round":0,"outcome":"Log the pack sent"}'::jsonb, 'Pack and terms sent.'),
  ('Crestwood Caregiving', 'outreach_contact', 'pending',     0,  0,
     '{"step":5,"round":1}'::jsonb, NULL),

  -- 5 second onboarding round.
  ('Lakeside Family Home Care', 'research_initial', 'completed', -16, 16,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Lakeside Family Home Care', 'outreach_contact', 'completed', -13, 13,
     '{"step":2,"round":0,"outcome":"Log email sent"}'::jsonb, NULL),
  ('Lakeside Family Home Care', 'outreach_contact', 'completed',  -8,  8,
     '{"step":3,"round":1,"outcome":"They replied"}'::jsonb, 'Interested, wants the pack.'),
  ('Lakeside Family Home Care', 'outreach_contact', 'completed',  -6,  6,
     '{"step":4,"round":0,"outcome":"Log the pack sent"}'::jsonb, NULL),
  ('Lakeside Family Home Care', 'outreach_contact', 'completed',  -3,  3,
     '{"step":5,"round":1,"outcome":"No answer"}'::jsonb, NULL),
  ('Lakeside Family Home Care', 'outreach_contact', 'pending',     1,  0,
     '{"step":5,"round":2}'::jsonb, NULL),

  -- 4 the pack itself, waiting to be sent. Every other provider has this
  -- rung behind them, and the pack is the longest screen on the ladder.
  ('Willow Creek Home Care', 'research_initial', 'completed', -7, 7,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Willow Creek Home Care', 'outreach_contact', 'completed', -5, 5,
     '{"step":1,"round":0,"outcome":"Confirmed contact"}'::jsonb, NULL),
  ('Willow Creek Home Care', 'outreach_contact', 'completed', -2, 2,
     '{"step":3,"round":1,"outcome":"They replied"}'::jsonb,
     'Interested. Asked for the details in writing.'),
  ('Willow Creek Home Care', 'outreach_contact', 'pending',    0, 0,
     '{"step":4,"round":0}'::jsonb, NULL),

  -- 8 a call booked for later this week.
  ('Ridgeline Home Services', 'research_initial', 'completed', -11, 11,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Ridgeline Home Services', 'outreach_contact', 'completed',  -5,  5,
     '{"step":2,"round":0,"outcome":"Log email sent"}'::jsonb, NULL),
  ('Ridgeline Home Services', 'outreach_contact', 'pending',     2,  0,
     -- from_step and from_round live inside fields, not beside them: that is
     -- where resumeAt looks, and they are strings because every carried
     -- field is. Put at the top level they are silently ignored and the call
     -- returns the provider to round one of a block they are three into.
     jsonb_build_object(
       'step', 8, 'round', 0,
       'fields', jsonb_build_object(
         'meeting_at', to_char(now() + interval '2 days', 'YYYY-MM-DD') || 'T15:00',
         'meeting_where', 'Zoom',
         'from_step', '3', 'from_round', '2')),
     NULL),

  -- 7 an errand, flagged for manager review.
  ('Pinecrest Home Care', 'research_initial', 'completed', -8, 8,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Pinecrest Home Care', 'outreach_contact', 'completed', -4, 4,
     '{"step":2,"round":0,"outcome":"Log email sent"}'::jsonb, NULL),
  ('Pinecrest Home Care', 'outreach_contact', 'pending',    0, 0,
     jsonb_build_object(
       'step', 7, 'round', 0,
       'fields', jsonb_build_object(
         'todo', 'They asked whether students can work overnight shifts.',
         'flag_review', 'on',
         'due_on', to_char(now(), 'YYYY-MM-DD'),
         'from_step', '3', 'from_round', '1')),
     NULL),

  -- The goal. Nothing pending, which is what being finished looks like.
  ('Summit Ridge Home Care', 'research_initial', 'completed', -30, 30,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Summit Ridge Home Care', 'outreach_contact', 'completed', -27, 27,
     '{"step":1,"round":0,"outcome":"Interested, start onboarding"}'::jsonb, NULL),
  ('Summit Ridge Home Care', 'outreach_contact', 'completed', -25, 25,
     '{"step":4,"round":0,"outcome":"Log the pack sent"}'::jsonb, NULL),
  ('Summit Ridge Home Care', 'outreach_contact', 'completed', -21, 21,
     '{"step":5,"round":1,"outcome":"They are ready"}'::jsonb,
     'Ready for their first student, and clear on what happens when one arrives.'),
  -- The seasonal check a finished provider earns. Due today rather than next
  -- term so the rung can be opened and shown; in the wild the goal queues it
  -- months out.
  ('Summit Ridge Home Care', 'outreach_contact', 'pending', 0, 0,
     '{"step":6,"round":0}'::jsonb, NULL),

  -- Archived. Keeps the outcome that archived it, which is the evidence.
  ('Fairview Home Care', 'research_initial', 'completed', -6, 6,
     '{"step":0,"round":0,"outcome":"Done"}'::jsonb, NULL),
  ('Fairview Home Care', 'outreach_contact', 'completed', -4, 4,
     '{"step":1,"round":0,"outcome":"Not interested"}'::jsonb, 'Uses their own bank of caregivers.')
) AS v(name, task_type, status, due_in, done_ago, payload, notes)
  ON v.name = o.organization_name;

-- ── students ────────────────────────────────────────────────────────────
--
-- is_active false keeps them off the public candidate pages, and no slug
-- that resolves means no public URL to land on. They still show on the
-- board, which does not filter on either.

INSERT INTO business_profiles
  (slug, type, display_name, email, phone, city, state, is_active, metadata, created_at)
VALUES
  ('demo-duo-ana-ruiz',      'student', 'Ana Ruiz',      'ana@example.test',  '555-0201', 'Demo', 'TX', FALSE,
    jsonb_build_object('is_demo', true, 'university', 'DuBose University of Olera',
                       'major', 'Nursing', 'application_completed', false),
    now() - interval '3 days'),
  ('demo-duo-ben-oyelaran',  'student', 'Ben Oyelaran',  'ben@example.test',  '555-0202', 'Demo', 'TX', FALSE,
    jsonb_build_object('is_demo', true, 'university', 'DuBose University of Olera',
                       'intended_professional_school', 'Medical school',
                       'application_completed', true),
    now() - interval '12 days'),
  ('demo-duo-cara-lindqvist','student', 'Cara Lindqvist','cara@example.test', '555-0203', 'Demo', 'TX', FALSE,
    jsonb_build_object('is_demo', true, 'university', 'DuBose University of Olera',
                       'intended_professional_school', 'Physician assistant',
                       'application_completed', true),
    now() - interval '26 days'),
  ('demo-duo-dev-patel',     'student', 'Dev Patel',     'dev@example.test',  '555-0204', 'Demo', 'TX', FALSE,
    jsonb_build_object('is_demo', true, 'university', 'DuBose University of Olera',
                       'intended_professional_school', 'Medical school',
                       'application_completed', true),
    now() - interval '48 days');

-- A placement needs a provider with a portal profile, which a directory
-- outreach row is not. One demo organization stands in for Summit Ridge, and
-- is_active false keeps it off the public side like the students.
INSERT INTO business_profiles
  (slug, type, display_name, city, state, is_active, metadata)
VALUES
  ('demo-duo-summit-ridge', 'organization', 'Summit Ridge Home Care', 'Austin', 'TX', FALSE,
    jsonb_build_object('is_demo', true));

-- Dev is hired. Without this the board reads the facts, finds no placement,
-- and shows a student with no state and nothing to do — which looks like a
-- bug rather than like somebody who finished.
INSERT INTO medjobs_placements (provider_profile_id, student_profile_id, status, created_at)
SELECT prov.id, stu.id, 'accepted', now() - interval '18 days'
FROM business_profiles prov, business_profiles stu
WHERE prov.slug = 'demo-duo-summit-ridge' AND stu.slug = 'demo-duo-dev-patel';

-- History outranks derivation on the students ladder, so a completed rung is
-- the reliable way to place somebody. Ana is left with none: she has not
-- finished her application, and the board gives her the rungs she is on.
INSERT INTO business_profile_tasks
  (business_profile_id, kind, task_type, status, due_at, completed_at, payload, notes)
SELECT p.id, 'candidate', 'manual_followup', 'completed',
       now() - (v.done_ago || ' days')::interval,
       now() - (v.done_ago || ' days')::interval,
       v.payload, v.notes
FROM business_profiles p
JOIN (VALUES
  ('demo-duo-ben-oyelaran',   8, '{"step":0,"round":0}'::jsonb, 'Met on Zoom, keen.'),
  ('demo-duo-cara-lindqvist',20, '{"step":0,"round":0}'::jsonb, NULL),
  ('demo-duo-cara-lindqvist',12, '{"step":1,"round":0}'::jsonb, 'Application finished.'),
  ('demo-duo-cara-lindqvist', 4, '{"step":2,"round":0}'::jsonb, 'Interview booked with Summit Ridge.'),
  ('demo-duo-dev-patel',     40, '{"step":0,"round":0}'::jsonb, NULL),
  ('demo-duo-dev-patel',     34, '{"step":1,"round":0}'::jsonb, NULL),
  ('demo-duo-dev-patel',     26, '{"step":2,"round":0}'::jsonb, NULL),
  ('demo-duo-dev-patel',     18, '{"step":3,"round":0}'::jsonb, 'Hired by Summit Ridge.')
) AS v(slug, done_ago, payload, notes) ON v.slug = p.slug;

-- The monthly hours check. Queued by the Hired outcome thirty days out, so a
-- student hired eighteen days ago has one coming; brought forward to today
-- so it can be opened during a demo.
INSERT INTO business_profile_tasks
  (business_profile_id, kind, task_type, status, due_at, payload)
SELECT p.id, 'candidate', 'manual_followup', 'pending', current_date::timestamptz,
       '{"step":4,"round":0}'::jsonb
FROM business_profiles p WHERE p.slug = 'demo-duo-dev-patel';

-- ── the job board ───────────────────────────────────────────────────────

INSERT INTO campus_channels (campus_id, channel, status, criteria, detail)
SELECT d.id, 'st3', 'in_progress', '{}'::jsonb,
       jsonb_build_object(
         'board_url', 'https://example.test/dubose/careers',
         'contact_name', 'Career Services',
         'services_email', 'careers@example.test')
FROM demo_campus d;

-- The job board is one record per campus, so it can only ever be in one
-- state. It starts on rung 1 with the research behind it: far enough in to
-- show a channel in progress, early enough that submitted, approved and
-- first applicant can all be walked forward during the demo.
INSERT INTO site_tasks (campus_id, channel, task_type, due_at, status, payload, notes, completed_at)
SELECT d.id, 'st3', 'activation_job_board_check', v.due, v.status, v.payload, v.notes, v.done_at
FROM demo_campus d,
(VALUES
  ((current_date - 6)::timestamptz, 'completed', '{"step":0,"round":0}'::jsonb,
     'Career services portal found, submission is by email.', now() - interval '6 days'),
  (current_date::timestamptz,       'pending',   '{"step":1,"round":0}'::jsonb, NULL, NULL)
) AS v(due, status, payload, notes, done_at);

COMMIT;

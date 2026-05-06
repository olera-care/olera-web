-- ===========================================================================
-- Monday demo seed — Texas A&M + University of Houston
-- ===========================================================================
-- Tight, curated 13-card demo seed for the Monday admin walkthrough.
-- Two universities, every workflow state covered, smart-hide reveals
-- the right In Basket tabs without overwhelming the team.
--
-- Cards distribute as:
--   Texas A&M (College Station, TX)
--     T1  prospect           — needs research (Prospects → Partner Prospects)
--     T2  researched         — ready to email (Prospects)
--     T3  engaged + reply    — Replies tab (mid_cadence)
--     T4  engaged + want-mtg — Replies + Meetings (in flight)
--     T5  active_partner     — Partners (with pending custom task)
--     T6  no_response_closed — closed history (Prospects entity page)
--   University of Houston (Houston, TX)
--     U7  engaged + voicemail   — Replies (awaiting callback)
--     U8  engaged + post-meeting — Replies (needs followup) + pending call task
--     U9  active_partner     — Partners (with pending custom step)
--     U10 engaged + booked   — Meetings (booked) for tomorrow
--   Catchment business profiles
--     P1  Provider in Bryan, TX  (no T&C)              — Provider Prospects
--     P2  Provider in Houston    (T&C accepted 14d)    — Clients
--     S1  Student at UH (application_completed=true)   — Candidates
--
-- Plus touchpoints today + over the last week so:
--   • Logs Today + breakdown sub-line populates
--   • Streak metric shows 5 consecutive business days
--   • Logs page has visible history
--
-- Idempotent: re-running this seed wipes all `[MONDAY_DEMO]` rows for
-- the two campuses and the three demo business_profiles, then
-- inserts fresh data. Safe to run on staging or main without
-- touching other test data.
--
-- Prerequisites: migrations 064–075 applied. Demo on main after
-- merging this branch through staging.
-- ===========================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Wipe prior Monday-demo rows (cascade clears contacts/tps/tasks)
-- ─────────────────────────────────────────────────────────────────────
-- Every row inserted by this seed is tagged so re-runs are bounded
-- to demo data and don't touch other rows. The WHERE clauses below
-- key off the tags exclusively.

DELETE FROM student_outreach_tasks
 WHERE notes LIKE '[MONDAY_DEMO]%';

DELETE FROM student_outreach
 WHERE notes LIKE '[MONDAY_DEMO]%';

DELETE FROM business_profile_tasks
 WHERE notes LIKE '[MONDAY_DEMO]%';

DELETE FROM site_tasks
 WHERE notes LIKE '[MONDAY_DEMO]%';

DELETE FROM business_profiles
 WHERE metadata @> '{"monday_demo": true}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Ensure the two demo campuses exist + are active
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach_campuses (slug, name, state, city, is_active, research_complete)
VALUES
  ('texas-am',  'Texas A&M University',           'TX', 'College Station', true, false),
  ('u-houston', 'University of Houston / Rice',   'TX', 'Houston',         true, false)
ON CONFLICT (slug) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      research_complete = EXCLUDED.research_complete;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Catchment business_profiles (provider prospects + a Client + a candidate)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO business_profiles (id, type, display_name, slug, city, state, is_active, metadata, created_at, updated_at)
VALUES
  -- P1: Bryan TX provider — surfaces as a virtual Provider Prospect
  -- in Texas A&M's catchment.
  (
    '33333333-3333-3333-3333-000000000001',
    'organization',
    'Aggie Home Health & Companion Care',
    'aggie-home-health-and-companion-care',
    'Bryan', 'TX',
    true,
    jsonb_build_object('monday_demo', true, 'care_types', jsonb_build_array('home_care_non_medical')),
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  -- P2: Houston provider with T&C accepted 14 days ago — appears as
  -- an active Client on the Clients page.
  (
    '33333333-3333-3333-3333-000000000002',
    'organization',
    'Bayou City Senior Care Cooperative',
    'bayou-city-senior-care-cooperative',
    'Houston', 'TX',
    true,
    jsonb_build_object(
      'monday_demo', true,
      'care_types', jsonb_build_array('home_care_non_medical'),
      'interview_terms_accepted_at', (NOW() - INTERVAL '14 days')::text
    ),
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '14 days'
  ),
  -- S1: Live student profile at UH — appears on Candidates page.
  (
    '33333333-3333-3333-3333-000000000003',
    'student',
    'Maya Patel',
    'maya-patel',
    'Houston', 'TX',
    true,
    jsonb_build_object(
      'monday_demo', true,
      'university', 'University of Houston',
      'program_track', 'pre_med',
      'application_completed', true,
      'profile_completeness', 86,
      'video_intro_url', 'https://example.com/intro.mp4',
      'certifications', jsonb_build_array('CNA','BLS')
    ),
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '3 days'
  );

-- ─────────────────────────────────────────────────────────────────────
-- 4. Stakeholder rows (student_outreach) — 10 cards across the two sites
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach
  (id, campus_id, kind, stakeholder_type, organization_name, department, status, programs, contact_permission, viewed_at, notes, created_at, last_edited_at)
VALUES
  -- Texas A&M ─────────────────────────────────────────────────────────
  -- T1: Advisor in research, no contacts yet → Prospects (needs research)
  (
    '11111111-1111-1111-1111-000000000001',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'advisor', 'advisor',
    'Texas A&M Pre-Health Office',
    'Pre-Health Advising',
    'prospect',
    ARRAY[]::TEXT[],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] T1 advisor — needs research',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  -- T2: Dept head researched (contact + programs) → Prospects (ready to email)
  (
    '11111111-1111-1111-1111-000000000002',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'dept_head', 'dept_head',
    'Department of Biology',
    'Pre-Health Track',
    'researched',
    ARRAY['Pre-Med', 'Pre-PA'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] T2 dept head — ready to email',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '1 day'
  ),
  -- T3: Student org engaged with a recent reply → Replies tab
  (
    '11111111-1111-1111-1111-000000000003',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'student_org', 'student_org',
    'Aggie Pre-Med Society',
    NULL,
    'engaged',
    ARRAY['Pre-Med'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] T3 student org — recent reply',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '6 hours'
  ),
  -- T4: Advisor wants meeting (engaged + meeting_in_flight note) → Meetings
  (
    '11111111-1111-1111-1111-000000000004',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'advisor', 'advisor',
    'Aggie Pre-Health Mentoring',
    'Mentor Network',
    'engaged',
    ARRAY['Pre-Med','Pre-PA','Pre-Nursing'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] T4 advisor — wants meeting',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 day'
  ),
  -- T5: Active partner → Partners tab (with custom step task)
  (
    '11111111-1111-1111-1111-000000000005',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'student_org', 'student_org',
    'Aggie Future Physicians',
    NULL,
    'active_partner',
    ARRAY['Pre-Med'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] T5 active partner',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '8 days'
  ),
  -- T6: Closed (no_response_closed) → visible in Prospects entity page history
  (
    '11111111-1111-1111-1111-000000000006',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'professor', 'professor',
    'Dr. Henry Adamson — Anatomy & Physiology',
    'Department of Biology',
    'no_response_closed',
    ARRAY['Pre-Med'],
    'not_yet',
    (NOW() - INTERVAL '35 days'),
    '[MONDAY_DEMO] T6 closed — cadence ran without engagement',
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '30 days'
  ),
  -- University of Houston ────────────────────────────────────────────
  -- U7: Advisor awaiting callback (voicemail) → Replies tab
  (
    '22222222-2222-2222-2222-000000000007',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'u-houston'),
    'advisor', 'advisor',
    'UH Office of Pre-Health Advising',
    'Pre-Health Advising',
    'engaged',
    ARRAY['Pre-Med','Pre-PA'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] U7 advisor — awaiting callback (voicemail)',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days'
  ),
  -- U8: Dept head needs followup (post-meeting) → Replies tab
  --     Will also have a phone task due now → Calls tab
  (
    '22222222-2222-2222-2222-000000000008',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'u-houston'),
    'dept_head', 'dept_head',
    'Department of Biology and Biochemistry',
    'Pre-Health Liaison',
    'engaged',
    ARRAY['Pre-Med','Pre-PA','Pre-Nursing'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] U8 dept head — post-meeting followup',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '4 days'
  ),
  -- U9: Active partner → Partners tab (custom manual_followup task)
  (
    '22222222-2222-2222-2222-000000000009',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'u-houston'),
    'student_org', 'student_org',
    'UH Pre-Health Society',
    NULL,
    'active_partner',
    ARRAY['Pre-Med','Pre-PA'],
    'not_yet',
    NULL,
    '[MONDAY_DEMO] U9 active partner',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '12 days'
  ),
  -- U10: Engaged + meeting booked tomorrow → Meetings tab
  (
    '22222222-2222-2222-2222-000000000010',
    (SELECT id FROM student_outreach_campuses WHERE slug = 'u-houston'),
    'professor', 'professor',
    'Dr. Layla Chen — Health Sciences Career Path',
    'College of Natural Sciences and Mathematics',
    'engaged',
    ARRAY['Pre-Med'],
    'granted_direct',
    NULL,
    '[MONDAY_DEMO] U10 professor — meeting booked tomorrow',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '1 day'
  );

-- ─────────────────────────────────────────────────────────────────────
-- 5. Contacts for stakeholders that have them
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach_contacts
  (outreach_id, name, first_name, last_name, title, email, phone, role, status, is_primary)
VALUES
  ('11111111-1111-1111-1111-000000000002', 'Dr. Marcus Reyes',     'Marcus',  'Reyes',     'Dr.',   'mreyes@tamu.edu',         '+19795551234', 'Department Chair',           'active', true),
  ('11111111-1111-1111-1111-000000000003', 'Aliyah Brooks',        'Aliyah',  'Brooks',    NULL,    'apms-president@tamu.edu', '+19795552345', 'President',                  'active', true),
  ('11111111-1111-1111-1111-000000000004', 'Dr. Sarah Mendez',     'Sarah',   'Mendez',    'Dr.',   'smendez@tamu.edu',        '+19795553456', 'Senior Pre-Health Advisor',  'active', true),
  ('11111111-1111-1111-1111-000000000005', 'Jordan Liu',           'Jordan',  'Liu',       NULL,    'aggiefp-vp@tamu.edu',     '+19795554567', 'VP of Outreach',             'active', true),
  ('11111111-1111-1111-1111-000000000006', 'Dr. Henry Adamson',    'Henry',   'Adamson',   'Dr.',   'hadamson@tamu.edu',       NULL,           'Professor',                  'active', true),
  ('22222222-2222-2222-2222-000000000007', 'Dr. Lina Park',        'Lina',    'Park',      'Dr.',   'lpark@uh.edu',            '+17135551122', 'Pre-Health Advisor',         'active', true),
  ('22222222-2222-2222-2222-000000000008', 'Dr. Martin Cole',      'Martin',  'Cole',      'Dr.',   'mcole@uh.edu',            '+17135552233', 'Pre-Health Liaison',         'active', true),
  ('22222222-2222-2222-2222-000000000009', 'Tara Williams',        'Tara',    'Williams',  NULL,    'uhphs-pres@uh.edu',       '+17135553344', 'President',                  'active', true),
  ('22222222-2222-2222-2222-000000000010', 'Dr. Layla Chen',       'Layla',   'Chen',      'Dr.',   'lchen@uh.edu',            '+17135554455', 'Faculty Advisor',            'active', true);

-- ─────────────────────────────────────────────────────────────────────
-- 6. Touchpoints — drives Replies/Meetings derived states + Logs page
-- ─────────────────────────────────────────────────────────────────────
-- Spread touchpoints across today + the last 5 business days so:
--   • Logs Completed Today populates with a calls/meetings/replies breakdown
--   • Streak shows 5 consecutive business days
--   • Logs page shows real history

INSERT INTO student_outreach_touchpoints
  (outreach_id, touchpoint_type, channel, outcome, notes, payload, created_at)
VALUES
  -- T3 (engaged + recent reply): outreach emails over cadence + reply today
  ('11111111-1111-1111-1111-000000000003', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '12 days'),
  ('11111111-1111-1111-1111-000000000003', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 3),  NOW() - INTERVAL '9 days'),
  ('11111111-1111-1111-1111-000000000003', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 7),  NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-000000000003', 'email_replied',  'email', NULL,           'Generic reply asking for more information about the partnership.', '{}'::jsonb, NOW() - INTERVAL '6 hours'),

  -- T4 (engaged + wants meeting): cadence emails + reply + meeting_in_flight note
  ('11111111-1111-1111-1111-000000000004', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '15 days'),
  ('11111111-1111-1111-1111-000000000004', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 3),  NOW() - INTERVAL '12 days'),
  ('11111111-1111-1111-1111-000000000004', 'email_replied',  'email', NULL,           'Loved the idea — let''s find a time. I''m free Wednesday afternoons.', '{}'::jsonb, NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-000000000004', 'note_added',     NULL,    NULL,           'Sent some times Wednesday. Waiting on confirmation.', jsonb_build_object('reason', 'meeting_in_flight'), NOW() - INTERVAL '1 day'),

  -- T5 (active partner): partner-stage history
  ('11111111-1111-1111-1111-000000000005', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '40 days'),
  ('11111111-1111-1111-1111-000000000005', 'email_replied',  'email', NULL,           'We''re in. Send us materials.', '{}'::jsonb, NOW() - INTERVAL '32 days'),
  ('11111111-1111-1111-1111-000000000005', 'meeting_held',   'meeting', NULL,         'Great kickoff meeting. They''ll post in the chapter newsletter.', '{}'::jsonb, NOW() - INTERVAL '20 days'),
  ('11111111-1111-1111-1111-000000000005', 'distribution_confirmed', NULL, NULL,      'Posted to chapter Slack and IG story.', '{}'::jsonb, NOW() - INTERVAL '8 days'),

  -- T6 (closed): cadence ran without reply
  ('11111111-1111-1111-1111-000000000006', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '70 days'),
  ('11111111-1111-1111-1111-000000000006', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 7),  NOW() - INTERVAL '63 days'),
  ('11111111-1111-1111-1111-000000000006', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 14), NOW() - INTERVAL '56 days'),
  ('11111111-1111-1111-1111-000000000006', 'stage_change',   NULL,    NULL,           NULL, jsonb_build_object('from','outreach_sent','to','no_response_closed'), NOW() - INTERVAL '30 days'),

  -- U7 (awaiting callback / voicemail)
  ('22222222-2222-2222-2222-000000000007', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '10 days'),
  ('22222222-2222-2222-2222-000000000007', 'call_voicemail', 'phone', 'voicemail',    'Left voicemail introducing the program. Asked them to call back.', jsonb_build_object('reason','voicemail'), NOW() - INTERVAL '2 days'),

  -- U8 (post-meeting needs followup)
  ('22222222-2222-2222-2222-000000000008', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '25 days'),
  ('22222222-2222-2222-2222-000000000008', 'email_replied',  'email', NULL,           'Happy to chat — when works for you?', '{}'::jsonb, NOW() - INTERVAL '20 days'),
  ('22222222-2222-2222-2222-000000000008', 'meeting_scheduled', 'meeting', NULL,      NULL, jsonb_build_object('meeting_at',(NOW() - INTERVAL '7 days')::text), NOW() - INTERVAL '15 days'),
  ('22222222-2222-2222-2222-000000000008', 'meeting_held',   'meeting', 'needs_followup', 'Good meeting. They asked us to send a one-pager and a sample listing before they greenlight.', '{}'::jsonb, NOW() - INTERVAL '7 days'),
  ('22222222-2222-2222-2222-000000000008', 'note_added',     NULL,    NULL,           'Need to send the one-pager + sample listing this week.', jsonb_build_object('reason', 'post_meeting_followup'), NOW() - INTERVAL '4 days'),

  -- U9 (active partner): light history
  ('22222222-2222-2222-2222-000000000009', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '60 days'),
  ('22222222-2222-2222-2222-000000000009', 'distribution_confirmed', NULL, NULL,      'Confirmed they''re sharing in monthly newsletter.', '{}'::jsonb, NOW() - INTERVAL '30 days'),

  -- U10 (engaged + meeting booked tomorrow)
  ('22222222-2222-2222-2222-000000000010', 'email_sent',     'email', NULL,           NULL, jsonb_build_object('day', 0),  NOW() - INTERVAL '8 days'),
  ('22222222-2222-2222-2222-000000000010', 'email_replied',  'email', NULL,           'Sure, sent over a Calendly link.', '{}'::jsonb, NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-000000000010', 'meeting_scheduled', 'meeting', NULL,      NULL, jsonb_build_object('meeting_at',(NOW() + INTERVAL '1 day')::text), NOW() - INTERVAL '1 day'),

  -- ── Today's logs — populates Logs Today + breakdown sub-line + Streak ──
  ('11111111-1111-1111-1111-000000000003', 'note_added',     NULL,    NULL,           'Reviewed the reply — generic, no commitment yet. Will email a deeper pitch tomorrow.', '{}'::jsonb, NOW() - INTERVAL '20 minutes'),
  ('22222222-2222-2222-2222-000000000007', 'call_no_answer', 'phone', 'no_answer',    'Tried again from the campus office line. No answer.', '{}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-000000000005', 'email_sent',     'email', NULL,           'Quarterly check-in email.', jsonb_build_object('reason','partner_seasonal_checkin'), NOW() - INTERVAL '40 minutes');

-- ─────────────────────────────────────────────────────────────────────
-- 7. Pending tasks
-- ─────────────────────────────────────────────────────────────────────
-- Stakeholder tasks: drive Calls tab + Partners tab pending work.
-- Entity tasks: site_tasks / business_profile_tasks where the demo
-- exercises Step Board flows.

INSERT INTO student_outreach_tasks (outreach_id, task_type, due_at, status, payload, notes)
VALUES
  -- U8: phone task due now → exercises Calls tab
  ('22222222-2222-2222-2222-000000000008', 'outreach_followup_call',  NOW() - INTERVAL '1 hour',  'pending', jsonb_build_object('day', 14), '[MONDAY_DEMO] U8 call due'),
  -- T2: phone task due now → second Calls card
  ('11111111-1111-1111-1111-000000000002', 'outreach_followup_call',  NOW() - INTERVAL '15 minutes', 'pending', jsonb_build_object('day', 0),  '[MONDAY_DEMO] T2 call due'),
  -- T5 partner: pending partner_share_update task → Partners tab
  ('11111111-1111-1111-1111-000000000005', 'partner_share_update',    NOW() + INTERVAL '2 days',  'pending', jsonb_build_object('reason','job_board_post'), '[MONDAY_DEMO] T5 share update'),
  -- U9 partner: custom manual_followup task → Partners tab
  ('22222222-2222-2222-2222-000000000009', 'manual_followup',         NOW(),                       'pending', jsonb_build_object('reason','custom','description','Send the November newsletter draft for review.'), '[MONDAY_DEMO] U9 custom step');

-- ─────────────────────────────────────────────────────────────────────
-- 8. Entity tasks — Step Board work that surfaces in the In Basket
-- ─────────────────────────────────────────────────────────────────────
-- These populate the In Basket Clients / Candidates / Sites tabs (so
-- they're not smart-hidden during the demo) and exercise the
-- EntityStepBoard on the dedicated drawers.

INSERT INTO site_tasks (campus_id, task_type, due_at, status, payload, notes)
VALUES
  (
    (SELECT id FROM student_outreach_campuses WHERE slug = 'texas-am'),
    'manual_followup',
    NOW(),
    'pending',
    jsonb_build_object('reason','custom','summary','Confirm A&M career fair date with student affairs office.'),
    '[MONDAY_DEMO] Texas A&M site task'
  );

INSERT INTO business_profile_tasks (business_profile_id, kind, task_type, due_at, status, payload, notes)
VALUES
  -- P2 (Bayou City Client): trial check-in due now → In Basket Clients tab
  (
    '33333333-3333-3333-3333-000000000002',
    'client',
    'manual_followup',
    NOW(),
    'pending',
    jsonb_build_object('reason','custom','summary','Check in on the Bayou City pilot — 14 days in, see if they''ve scheduled their first interview.'),
    '[MONDAY_DEMO] Bayou City client task'
  ),
  -- S1 (Maya Patel Candidate): review prompt → In Basket Candidates tab
  (
    '33333333-3333-3333-3333-000000000003',
    'candidate',
    'manual_followup',
    NOW(),
    'pending',
    jsonb_build_object('reason','custom','summary','Review Maya''s updated profile — she added BLS cert.'),
    '[MONDAY_DEMO] Maya candidate review'
  );

-- ─────────────────────────────────────────────────────────────────────
-- 9. Sanity sweep — verify the seed populated as expected
-- ─────────────────────────────────────────────────────────────────────
-- Re-run safe: any of these returning unexpected counts means the
-- migrations or schema have drifted from what this seed assumes.

DO $$
DECLARE
  outreach_count INT;
BEGIN
  SELECT COUNT(*) INTO outreach_count
  FROM student_outreach
  WHERE notes LIKE '[MONDAY_DEMO]%';

  IF outreach_count <> 10 THEN
    RAISE WARNING 'Expected 10 demo student_outreach rows, got %', outreach_count;
  END IF;
END $$;

COMMIT;

-- ===========================================================================
-- Demo walkthrough cheat-sheet
-- ===========================================================================
-- Sidebar fractions (post-seed, before any admin actions):
--   In Basket           ~10/10  (10 unread active rows + entity tasks)
--   Sites               2       (Texas A&M, UH)
--   Prospects           2/2     (T1, T2)
--   Clients             1       (Bayou City)
--   Partners            2/2     (T5, U9)
--   Candidates          1       (Maya Patel)
--   Replies             ~3/4    (T3, T4, U7, U8)
--   Meetings            ~1/2    (T4 in flight, U10 booked tomorrow)
--   Calls               ~2/2    (T2, U8 due now)
--   Logs                —
--
-- Hero (post-seed):
--   Queued              ~13   (10 outreach + 1 partner task + 1 site task + entity counts)
--   Logs Completed Today ~3   (1 reply note + 1 call no-answer + 1 partner email)
--                        breakdown: 1 call · 0 meetings · 0 replies · 1 email · 1 other
--   Streak              1 day (today)  — unless prior touchpoints exist on past business days
--
-- Demo flow:
--   1. Land on In Basket → Clients tab is default. Expand Replies/Meetings
--      tabs visible. Walk through the priority order top-down.
--   2. Click T3 (Aggie Pre-Med Society reply). Drawer opens, shows the
--      reply touchpoint. Click Log → ReplyClassifier modal. Pick "wants
--      meeting" or "Mark as Partner" inline → see the row leave Replies.
--   3. Click U10 (booked meeting). Drawer shows scheduled meeting tomorrow.
--      Click Log → LogMeeting modal. Pick "Mark as Partner ★" with
--      evidence → row converts to Partner.
--   4. Click U8 in Calls. Drawer shows the post-meeting follow-up note.
--      Click Log → LogCall modal. Pick an outcome.
--   5. Switch to Sites page. Click Texas A&M. Drawer opens with the
--      Step Board showing the pending site task (Career fair date).
--   6. Switch to Prospects sidebar page. Show Provider Prospects sub-section
--      (Aggie Home Health) + Partner Prospects sub-section (T1, T2). Show
--      closed history visible inline (T6) with Reopen affordance.
--   7. Switch to Clients. Walk through Bayou City — show pilot status
--      + Step Board.
--   8. Switch to Logs. Show today's logs + filter by Calls / Replies.
-- ===========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- Student Outreach v8.10 demo seed — Texas A&M + University of Houston.
--
-- Prerequisites (apply in Supabase SQL editor BEFORE running this seed):
--   ✓ supabase/migrations/064_student_outreach.sql       (base schema)
--   ✓ supabase/migrations/069_campus_research_complete.sql
--   ✓ supabase/migrations/070_contacts_first_last_name.sql
--   ✓ supabase/migrations/071_contacts_title.sql         (v8.9 — required)
--   (No new migrations for v8.10 — code-only release.)
--
-- Eighteen stakeholders, scoped to two campuses, hitting every workflow
-- the v8.10 panel surfaces — including:
--   ✓ Card / drawer subline appends contact role (President / Chair / etc.)
--   ✓ Calls are tagged with cadence_day so logging Day 0's outcome no
--     longer paints Day 7 + Day 11 with the same status.
--   ✓ Day 12 final email added to dept_head cadence.
--   ✓ Phone block primary CTA = "Log the Call" (opens 7-outcome modal);
--     phone number itself is a tel: link.
--   ✓ Banners suppressed in the drawer when an overdue call is present
--     — the call card is the single source of truth.
--
--   Research tab
--     1. Aggie Pre-Med Society (TAMU)        — student_org, prospect
--     2. TAMU Biology Department (TAMU)      — dept_head, researched
--                                              + Email professors GRANTED
--     3. Dr. James Holloway (TAMU)           — professor (parent=Biology),
--                                              contact_permission=granted_direct
--    16. TAMU Microbiology Department (TAMU) — dept_head, researched, Dr.,
--                                              NO PHONE
--                                              [v8.8 conditional-phone test:
--                                               Schedule outreach should
--                                               queue email-only tasks]
--    18. TAMU New Prospect Department (TAMU) — dept_head, prospect, NO CONTACT
--                                              [v8.9 fallback header test:
--                                               headline falls back to org
--                                               name since no contact yet]
--
--   Calls tab
--     8. UH Pre-Health Advising              — advisor, overdue Day-5 call
--    15. TAMU Aggie Pre-Vet Society          — student_org, overdue Day-5
--                                              phone + future Day-7 email,
--                                              Day-8 phone, Day-10 email
--                                              [v8.8 markCurrentCallTask test:
--                                               log no_answer → only Day-5
--                                               cleared; future tasks remain]
--
--   Replies tab
--     Needs attention
--       5. TAMU Health Professions Office    — wants_meeting (Replies + Meetings/in_flight)
--       9. UH Biology Department             — Interested (replied yesterday)
--                                              + Email professors REQUESTED
--      10. UH Pre-Med Society                — needs_followup (post-meeting notes)
--      11. UH Chemistry Department           — awaiting_callback (voicemail 2d)
--      12. UH Honors Pre-Health Advisor      — awaiting_callback (promised 1d)
--      17. UH Engineering Pre-Health Advisor — Interested + pending Day-5 phone
--                                              [v8.8 supersede test: marking
--                                               meeting_scheduled or stopping
--                                               cancels the future call task]
--     Waiting
--       4. TAMU Pre-Health Advising          — mid_cadence (day-3 email pending)
--     Stale
--      13. UH Honors College Pre-Health      — cadence ended, 8d cold
--
--   Meetings tab
--      5. TAMU Health Professions Office     — finding a time (in_flight)
--      6. TAMU Chemistry Department          — booked tomorrow
--
--   Active Partners tab
--      7. TAMU Pre-Health Honor Society      — active_partner
--                                              + Job board GRANTED + pending task
--                                              + fall seasonal queued
--
--   All tab (Show closed)
--     14. UH Career Services Advisor         — no_response_closed
--
-- v8.8 surface coverage (still tested by the same rows):
--   ✓ "Engaged" pill renders as "Interested" everywhere (rows 9, 12, 17)
--   ✓ All-tab pill uses STATUS_LABELS (no raw enum)
--   ✓ Convert to Active Partner outcome — exercise via Calls tab on row 8 or 15
--   ✓ markCurrentCallTaskComplete — exercise via row 15 (only Day-5 clears)
--   ✓ supersedePendingFollowupCalls — exercise via row 17 (mark meeting / stop)
--   ✓ Conditional phone skip — exercise via row 16 (Schedule outreach)
--   ✓ Voicemail / promised-callback drawer copy no longer mentions "Try again"
--
-- v8.9 surface coverage:
--   ✓ Contact name leads card + drawer headers universally (every row)
--   ✓ "Dr." title prefix renders for dept_head/professor primary contacts
--     (rows 2, 3, 6, 9, 11, 16) — visible in card header, drawer header,
--     and email previews ("Dear Dr. Chen,").
--   ✓ Org-name fallback for contactless rows — row 18 (TAMU New Prospect
--     Department, no contact yet) shows "TAMU New Prospect Department" as
--     the headline because there's no contact to lead with.
--   ✓ Drawer renders OutreachStepList for ALL outreach_sent / engaged /
--     meeting_scheduled rows — phone + call-outcome buttons reachable
--     even when row is in stale / awaiting_callback / engaged sub-states
--     (verify on rows 8, 11, 12, 13, 17).
--
-- Idempotent: wipes everything tied to TAMU + UH before re-inserting. No
-- other campuses or rows are touched.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  admin_id uuid;
  tamu_id  uuid;
  uh_id    uuid;

  -- TAMU stakeholder ids
  o_aggie_premed       uuid := gen_random_uuid();
  o_tamu_biology       uuid := gen_random_uuid();
  o_tamu_holloway      uuid := gen_random_uuid();
  o_tamu_advising      uuid := gen_random_uuid();
  o_tamu_health_prof   uuid := gen_random_uuid();
  o_tamu_chemistry     uuid := gen_random_uuid();
  o_tamu_honor_society uuid := gen_random_uuid();
  o_tamu_prevet        uuid := gen_random_uuid();
  o_tamu_microbio      uuid := gen_random_uuid();
  o_tamu_new_prospect  uuid := gen_random_uuid();

  -- UH stakeholder ids
  o_uh_advising        uuid := gen_random_uuid();
  o_uh_biology         uuid := gen_random_uuid();
  o_uh_premed_society  uuid := gen_random_uuid();
  o_uh_chemistry       uuid := gen_random_uuid();
  o_uh_honors          uuid := gen_random_uuid();
  o_uh_honors_college  uuid := gen_random_uuid();
  o_uh_career_services uuid := gen_random_uuid();
  o_uh_engineering     uuid := gen_random_uuid();

  -- Contact ids (one primary contact per stakeholder)
  c_aggie_premed       uuid := gen_random_uuid();
  c_tamu_biology       uuid := gen_random_uuid();
  c_tamu_holloway      uuid := gen_random_uuid();
  c_tamu_advising      uuid := gen_random_uuid();
  c_tamu_health_prof   uuid := gen_random_uuid();
  c_tamu_chemistry     uuid := gen_random_uuid();
  c_tamu_honor_society uuid := gen_random_uuid();
  c_tamu_prevet        uuid := gen_random_uuid();
  c_tamu_microbio      uuid := gen_random_uuid();
  c_uh_advising        uuid := gen_random_uuid();
  c_uh_biology         uuid := gen_random_uuid();
  c_uh_premed_society  uuid := gen_random_uuid();
  c_uh_chemistry       uuid := gen_random_uuid();
  c_uh_honors          uuid := gen_random_uuid();
  c_uh_honors_college  uuid := gen_random_uuid();
  c_uh_career_services uuid := gen_random_uuid();
  c_uh_engineering     uuid := gen_random_uuid();

  -- Approval ids
  a_tamu_biology_profs    uuid := gen_random_uuid();
  a_uh_biology_profs      uuid := gen_random_uuid();
  a_tamu_partner_jobboard uuid := gen_random_uuid();
BEGIN
  -- 1. Pick the first admin to attribute touchpoints to.
  SELECT user_id INTO admin_id
    FROM admin_users
    ORDER BY created_at ASC
    LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found in admin_users — seed needs a real user_id for touchpoints.created_by';
  END IF;

  -- 2. Bypass the append-only touchpoints trigger for THIS transaction
  -- only so the seed can wipe and re-create demo rows. Reverts at end
  -- of DO block (SET LOCAL is scoped to the surrounding transaction).
  SET LOCAL session_replication_role = 'replica';

  -- 3. Upsert the two demo campuses. Reset research_complete=false so
  -- they show as cards on the Research tab.
  INSERT INTO student_outreach_campuses (slug, name, state, city, is_active)
  VALUES ('texas-am', 'Texas A&M University', 'TX', 'College Station', true)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        is_active = true,
        research_complete = false
  RETURNING id INTO tamu_id;

  INSERT INTO student_outreach_campuses (slug, name, state, city, is_active)
  VALUES ('university-of-houston', 'University of Houston', 'TX', 'Houston', true)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        is_active = true,
        research_complete = false
  RETURNING id INTO uh_id;

  -- 4. Wipe any pre-existing demo rows on these two campuses.
  DELETE FROM student_outreach_tasks
   WHERE outreach_id IN (SELECT id FROM student_outreach WHERE campus_id IN (tamu_id, uh_id));
  DELETE FROM student_outreach_touchpoints
   WHERE outreach_id IN (SELECT id FROM student_outreach WHERE campus_id IN (tamu_id, uh_id));
  DELETE FROM student_outreach_approvals
   WHERE outreach_id IN (SELECT id FROM student_outreach WHERE campus_id IN (tamu_id, uh_id));
  DELETE FROM student_outreach_contacts
   WHERE outreach_id IN (SELECT id FROM student_outreach WHERE campus_id IN (tamu_id, uh_id));
  DELETE FROM student_outreach
   WHERE campus_id IN (tamu_id, uh_id);

  -- ═══════════════════════════════════════════════════════════════════════
  --                                  TAMU
  -- ═══════════════════════════════════════════════════════════════════════

  -- ── 1. Aggie Pre-Med Society — student_org — prospect ──────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_aggie_premed, tamu_id, 'student_org', 'Aggie Pre-Med Society',
    ARRAY['Pre-Med', 'Pre-Dental'], 'prospect', 'not_yet',
    jsonb_build_object('notes', 'Largest pre-health student org on campus, ~200 members.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_aggie_premed, o_aggie_premed, 'Sofia Martinez', 'Sofia', 'Martinez', 'President',
    'smartinez@tamu.edu', '+19798452100', true, 'active', admin_id, admin_id
  );

  -- ── 2. TAMU Biology Department — dept_head — researched ────────────────
  --                                + Email professors GRANTED
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_biology, tamu_id, 'dept_head', 'Biology Department', 'Biology',
    ARRAY['Pre-Med', 'Pre-Dental'], 'researched', 'not_yet',
    jsonb_build_object('notes', '~85 faculty. Dept chair very supportive of pre-health programs.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, title, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_biology, o_tamu_biology, 'Sarah Chen', 'Dr.', 'Sarah', 'Chen', 'Department Chair',
    'schen@bio.tamu.edu', '+19798452721', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_approvals (
    id, outreach_id, approval_type, approval_for, status,
    requested_at, resolved_at, created_by, last_updated_by, last_updated_at
  ) VALUES (
    a_tamu_biology_profs, o_tamu_biology, 'department', 'Email professors directly', 'granted',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', admin_id, admin_id, NOW() - INTERVAL '3 days'
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, touchpoint_type, payload, created_by, created_at
  ) VALUES
    (o_tamu_biology, 'approval_requested',
     jsonb_build_object('approval_id', a_tamu_biology_profs::text,
                        'approval_type', 'department',
                        'approval_for', 'Email professors directly'),
     admin_id, NOW() - INTERVAL '5 days'),
    (o_tamu_biology, 'approval_granted',
     jsonb_build_object('approval_id', a_tamu_biology_profs::text,
                        'approval_type', 'department'),
     admin_id, NOW() - INTERVAL '3 days');

  -- ── 3. Dr. James Holloway — professor — prospect ───────────────────────
  --      Permission inherited from TAMU Biology dept (granted_direct).
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, permission_dependency_id, research_data,
    cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_holloway, tamu_id, 'professor', 'James Holloway', 'Biology',
    ARRAY['Pre-Med'], 'prospect', 'granted_direct', o_tamu_biology,
    jsonb_build_object('notes', 'Teaches BIOL 213. Mentioned interest by Dr. Chen.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, title, first_name, last_name, role, email, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_holloway, o_tamu_holloway, 'James Holloway', 'Dr.', 'James', 'Holloway', 'Professor',
    'jholloway@bio.tamu.edu', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, touchpoint_type, payload, created_by, created_at
  ) VALUES (
    o_tamu_holloway, 'approval_granted',
    jsonb_build_object('source', 'bulk_unlock', 'parent_outreach_id', o_tamu_biology::text, 'permission', 'granted_direct'),
    admin_id, NOW() - INTERVAL '3 days'
  );

  -- ── 4. TAMU Pre-Health Advising — advisor — mid_cadence ────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_advising, tamu_id, 'advisor', 'Elena Rodriguez',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'outreach_sent', 'not_yet',
    '{}'::jsonb, 0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_advising, o_tamu_advising, 'Elena Rodriguez', 'Elena', 'Rodriguez', 'Pre-Health Advisor',
    'erodriguez@tamu.edu', '+19798457777', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES (
    o_tamu_advising, c_tamu_advising, 'email_sent', 'email',
    jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                       'recipient_email', 'erodriguez@tamu.edu',
                       'recipient_name', 'Elena Rodriguez'),
    admin_id, NOW() - INTERVAL '3 days'
  );
  -- Day 3 email pending (mid_cadence — about to fire on the next cron tick)
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_advising, 'outreach_email_send', NOW() + INTERVAL '15 minutes',
    jsonb_build_object('day', 3, 'template', 'followup_light',
                       'subject', 'Following up — Olera for TAMU Pre-Health',
                       'body', 'Hi {first_name}, just following up on my note from earlier this week...'),
    'pending', admin_id
  );

  -- ── 5. TAMU Health Professions Office — advisor — wants_meeting ────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_health_prof, tamu_id, 'advisor', 'Tom Whitfield',
    ARRAY['Pre-Med', 'Pre-PA', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object('notes', 'Open to a 30-min intro chat. Coordinating time over email.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_health_prof, o_tamu_health_prof, 'Tom Whitfield', 'Tom', 'Whitfield', 'Pre-Health Advisor',
    'twhitfield@tamu.edu', '+19798456000', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_tamu_health_prof, c_tamu_health_prof, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'twhitfield@tamu.edu',
                        'recipient_name', 'Tom Whitfield'),
     NULL, admin_id, NOW() - INTERVAL '5 days'),
    (o_tamu_health_prof, c_tamu_health_prof, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Sounds great — when can we meet?'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_tamu_health_prof, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_tamu_health_prof, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'meeting_in_flight'),
     'Asked them for 3 time slots next week.',
     admin_id, NOW() - INTERVAL '2 days');

  -- ── 6. TAMU Chemistry Department — dept_head — booked tomorrow ─────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_chemistry, tamu_id, 'dept_head', 'Chemistry Department', 'Chemistry',
    ARRAY['Pre-Med', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object(
      'notes', 'Booked a 30-min video call with the chair tomorrow.',
      'meeting_at', (NOW() + INTERVAL '1 day')::text,
      'meeting_kind', 'video'
    ),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_chemistry, o_tamu_chemistry, 'Robert Patel', 'Dr.', 'Robert', 'Patel', 'Department Chair',
    'rpatel@chem.tamu.edu', '+19798452201', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_tamu_chemistry, c_tamu_chemistry, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'rpatel@chem.tamu.edu',
                        'recipient_name', 'Robert Patel'),
     NULL, admin_id, NOW() - INTERVAL '6 days'),
    (o_tamu_chemistry, c_tamu_chemistry, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Yes, happy to chat. Tomorrow at 2pm video works.'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_tamu_chemistry, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_tamu_chemistry, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'meeting_in_flight'),
     'Coordinating time over email.',
     admin_id, NOW() - INTERVAL '2 days'),
    (o_tamu_chemistry, NULL, 'meeting_scheduled', 'meeting',
     jsonb_build_object('meeting_at', (NOW() + INTERVAL '1 day')::text, 'kind', 'video'),
     'Tomorrow 2pm video.',
     admin_id, NOW() - INTERVAL '1 day');

  -- ── 7. TAMU Pre-Health Honor Society — student_org — active_partner ────
  --                                + Job board GRANTED + pending task
  --                                + fall seasonal queued
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day,
    distribution_evidence, distribution_evidence_notes, partner_health,
    created_by, last_edited_by
  ) VALUES (
    o_tamu_honor_society, tamu_id, 'student_org', 'TAMU Pre-Health Honor Society',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'active_partner', 'granted_direct',
    jsonb_build_object('notes', 'Distributing flyer to officer pre-health list quarterly.'),
    0,
    'explicit_email', 'Sent confirmation email saying they would share with their pre-health list.',
    'healthy', admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_honor_society, o_tamu_honor_society, 'Mia Thompson', 'Mia', 'Thompson', 'President',
    'mthompson@tamu.edu', '+19798452500', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_tamu_honor_society, c_tamu_honor_society, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'mthompson@tamu.edu',
                        'recipient_name', 'Mia Thompson'),
     NULL, admin_id, NOW() - INTERVAL '21 days'),
    (o_tamu_honor_society, c_tamu_honor_society, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Yes! Happy to share with our pre-health list.'),
     NULL, admin_id, NOW() - INTERVAL '18 days'),
    (o_tamu_honor_society, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '18 days'),
    (o_tamu_honor_society, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'engaged', 'to', 'active_partner'),
     'Committed to share with member list.', admin_id, NOW() - INTERVAL '14 days'),
    (o_tamu_honor_society, NULL, 'distribution_confirmed', NULL,
     jsonb_build_object('evidence', 'explicit_email'),
     'Sent confirmation email saying they would share with their list.',
     admin_id, NOW() - INTERVAL '14 days');

  -- Job board permission GRANTED
  INSERT INTO student_outreach_approvals (
    id, outreach_id, approval_type, approval_for, status,
    requested_at, resolved_at, created_by, last_updated_by, last_updated_at
  ) VALUES (
    a_tamu_partner_jobboard, o_tamu_honor_society, 'job_board', 'Post on university job board',
    'granted',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', admin_id, admin_id, NOW() - INTERVAL '5 days'
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, touchpoint_type, payload, created_by, created_at
  ) VALUES
    (o_tamu_honor_society, 'approval_requested',
     jsonb_build_object('approval_id', a_tamu_partner_jobboard::text,
                        'approval_type', 'job_board',
                        'approval_for', 'Post on university job board'),
     admin_id, NOW() - INTERVAL '7 days'),
    (o_tamu_honor_society, 'approval_granted',
     jsonb_build_object('approval_id', a_tamu_partner_jobboard::text,
                        'approval_type', 'job_board'),
     admin_id, NOW() - INTERVAL '5 days');

  -- Pending job-board post task (drives the "Job board: post pending" pill).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_honor_society, 'partner_share_update', NOW() - INTERVAL '5 days',
    jsonb_build_object('reason', 'job_board_post'), 'pending', admin_id
  );

  -- Next seasonal email queued (drives the "Next: …" partner pill).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_honor_society, 'outreach_email_send', NOW() + INTERVAL '30 days',
    jsonb_build_object('day', -1, 'template', 'seasonal', 'season', 'fall_kickoff',
                       'subject', 'Olera — fall semester pre-health resources',
                       'body', 'Hi {first_name}, kicking off the semester...'),
    'pending', admin_id
  );

  -- ── 15. TAMU Aggie Pre-Vet Society — student_org — multi-call cadence ──
  --      v8.8 markCurrentCallTaskComplete demo: overdue Day-5 phone +
  --      future Day-7 email + future Day-8 phone + future Day-10 email.
  --      Logging "no answer" / "voicemail" / "promised callback" should
  --      mark ONLY the Day-5 phone task complete; the other three remain
  --      pending and the next phone day re-engages naturally.
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_prevet, tamu_id, 'student_org', 'Aggie Pre-Vet Society',
    ARRAY['Pre-Vet'], 'outreach_sent', 'not_yet',
    jsonb_build_object('notes', 'Mid-cadence; been emailing + calling for ~6 days.'),
    5, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_prevet, o_tamu_prevet, 'Daniel Garza', 'Daniel', 'Garza', 'President',
    'dgarza@tamu.edu', '+19798452815', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_tamu_prevet, c_tamu_prevet, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'dgarza@tamu.edu',
                        'recipient_name', 'Daniel Garza'),
     NULL, NULL, admin_id, NOW() - INTERVAL '6 days'),
    -- v8.10: Day-0 call logged as "no answer". Tagged with cadence_day=0
    -- so isCallForDay only matches the Day-0 timeline row, not Day 5/8.
    (o_tamu_prevet, c_tamu_prevet, 'call_no_answer', 'phone',
     jsonb_build_object('cadence_day', 0),
     'No pickup; left no voicemail. Plan to retry next phone day.',
     'no_answer', admin_id, NOW() - INTERVAL '6 days' + INTERVAL '20 minutes'),
    (o_tamu_prevet, c_tamu_prevet, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 3, 'template', 'followup_light', 'success', true,
                        'recipient_email', 'dgarza@tamu.edu',
                        'recipient_name', 'Daniel Garza'),
     NULL, NULL, admin_id, NOW() - INTERVAL '3 days');
  -- Overdue Day-5 phone task (puts row on Calls tab).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_prevet, 'outreach_followup_call', NOW() - INTERVAL '1 day',
    jsonb_build_object('day', 5), 'pending', admin_id
  );
  -- Future Day-7 email task (proves email cadence survives no_answer).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_prevet, 'outreach_email_send', NOW() + INTERVAL '1 day',
    jsonb_build_object('day', 7, 'template', 'followup_socialproof',
                       'subject', 'Quick note — pre-vet students at Olera',
                       'body', 'Hi {first_name}, sharing a quick win we had with...'),
    'pending', admin_id
  );
  -- Future Day-8 phone task (proves next phone day survives no_answer).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_prevet, 'outreach_followup_call', NOW() + INTERVAL '2 days',
    jsonb_build_object('day', 8), 'pending', admin_id
  );
  -- Future Day-10 final email task.
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_tamu_prevet, 'outreach_email_send', NOW() + INTERVAL '4 days',
    jsonb_build_object('day', 10, 'template', 'followup_final',
                       'subject', 'Last note — Olera + pre-vet',
                       'body', 'Hi {first_name}, last check-in on this thread...'),
    'pending', admin_id
  );

  -- ── 16. TAMU Microbiology Department — dept_head — researched, NO PHONE
  --      v8.8 conditional-phone-skip demo: contact has email but no phone.
  --      Clicking "Schedule outreach" should queue email-only tasks
  --      (Day-0 + Day-5), skipping the Day-7 + Day-11 phone-only days
  --      entirely. The row never appears on the Calls tab.
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_microbio, tamu_id, 'dept_head', 'Microbiology Department', 'Microbiology',
    ARRAY['Pre-Med'], 'researched', 'not_yet',
    jsonb_build_object('notes', 'No public phone listing for the chair — email-only outreach.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, title, first_name, last_name, role, email, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_tamu_microbio, o_tamu_microbio, 'Linda Park', 'Dr.', 'Linda', 'Park', 'Department Chair',
    'lpark@micro.tamu.edu', true, 'active', admin_id, admin_id
  );

  -- ═══════════════════════════════════════════════════════════════════════
  --                       UNIVERSITY OF HOUSTON
  -- ═══════════════════════════════════════════════════════════════════════

  -- ── 8. UH Pre-Health Advising — advisor — Calls due ────────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_advising, uh_id, 'advisor', 'Marcus Reyes',
    ARRAY['Pre-Med', 'Pre-PA'], 'outreach_sent', 'not_yet',
    '{}'::jsonb, 0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_advising, o_uh_advising, 'Marcus Reyes', 'Marcus', 'Reyes', 'Pre-Health Advisor',
    'mreyes@uh.edu', '+18324672621', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES (
    o_uh_advising, c_uh_advising, 'email_sent', 'email',
    jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                       'recipient_email', 'mreyes@uh.edu',
                       'recipient_name', 'Marcus Reyes'),
    admin_id, NOW() - INTERVAL '5 days'
  );
  -- Overdue follow-up call task (puts the row on the Calls tab — also the
  -- canonical row to exercise the new Convert-to-Active-Partner outcome).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_uh_advising, 'outreach_followup_call', NOW() - INTERVAL '1 hour',
    jsonb_build_object('day', 5), 'pending', admin_id
  );

  -- ── 9. UH Biology Department — dept_head — Interested ──────────────────
  --                            + Email professors REQUESTED (not granted)
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_biology, uh_id, 'dept_head', 'Biology Department', 'Biology',
    ARRAY['Pre-Med', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object('notes', 'Replied yesterday — open to discussing pre-health programs.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, title, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_biology, o_uh_biology, 'Anita Patel', 'Dr.', 'Anita', 'Patel', 'Department Chair',
    'apatel@uh.edu', '+18327435440', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_uh_biology, c_uh_biology, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'apatel@uh.edu',
                        'recipient_name', 'Anita Patel'),
     admin_id, NOW() - INTERVAL '4 days'),
    (o_uh_biology, c_uh_biology, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Thanks for reaching out — interested but want to know more.'),
     admin_id, NOW() - INTERVAL '1 day'),
    (o_uh_biology, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     admin_id, NOW() - INTERVAL '1 day');
  -- Email professors permission requested but NOT yet granted (drives
  -- Professors-tab State 2 in BulkResearchModal for UH).
  INSERT INTO student_outreach_approvals (
    id, outreach_id, approval_type, approval_for, status,
    requested_at, next_followup_at, created_by, last_updated_by, last_updated_at
  ) VALUES (
    a_uh_biology_profs, o_uh_biology, 'department', 'Email professors directly', 'requested',
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', admin_id, admin_id, NOW() - INTERVAL '1 day'
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, touchpoint_type, payload, created_by, created_at
  ) VALUES (
    o_uh_biology, 'approval_requested',
    jsonb_build_object('approval_id', a_uh_biology_profs::text,
                       'approval_type', 'department',
                       'approval_for', 'Email professors directly'),
    admin_id, NOW() - INTERVAL '1 day'
  );

  -- ── 10. UH Pre-Med Society — student_org — needs_followup ──────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_premed_society, uh_id, 'student_org', 'UH Pre-Med Society',
    ARRAY['Pre-Med'], 'engaged', 'not_yet',
    jsonb_build_object('notes', 'Met with officers; need to follow up after they ask faculty advisor.'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_premed_society, o_uh_premed_society, 'Aisha Singh', 'Aisha', 'Singh', 'President',
    'asingh@uh.edu', '+18324677000', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_uh_premed_society, c_uh_premed_society, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'asingh@uh.edu',
                        'recipient_name', 'Aisha Singh'),
     NULL, NULL, admin_id, NOW() - INTERVAL '10 days'),
    (o_uh_premed_society, c_uh_premed_society, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Would love to chat — Wed at 5?'),
     NULL, NULL, admin_id, NOW() - INTERVAL '7 days'),
    (o_uh_premed_society, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, NULL, admin_id, NOW() - INTERVAL '7 days'),
    (o_uh_premed_society, NULL, 'meeting_scheduled', 'meeting',
     jsonb_build_object('meeting_at', (NOW() - INTERVAL '5 days')::text, 'kind', 'video'),
     'Met with officers.', NULL, admin_id, NOW() - INTERVAL '6 days'),
    (o_uh_premed_society, NULL, 'meeting_held', 'meeting',
     '{}'::jsonb,
     'Officers want to share with their list but need to ask faculty advisor first.',
     'needs_followup', admin_id, NOW() - INTERVAL '5 days'),
    (o_uh_premed_society, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'post_meeting_followup',
                        'notes', 'Officers want to share with their list but need to ask faculty advisor first. Following up next week.'),
     'Officers want to share with their list but need to ask faculty advisor first. Following up next week.',
     NULL, admin_id, NOW() - INTERVAL '5 days');

  -- ── 11. UH Chemistry Department — dept_head — awaiting_callback (vm) ───
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_chemistry, uh_id, 'dept_head', 'Chemistry Department', 'Chemistry',
    ARRAY['Pre-Med', 'Pre-Dental'], 'outreach_sent', 'not_yet',
    '{}'::jsonb, 0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, title, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_chemistry, o_uh_chemistry, 'Robert Kim', 'Dr.', 'Robert', 'Kim', 'Department Chair',
    'rkim@uh.edu', '+18327435200', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_uh_chemistry, c_uh_chemistry, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'rkim@uh.edu',
                        'recipient_name', 'Robert Kim'),
     NULL, NULL, admin_id, NOW() - INTERVAL '5 days'),
    (o_uh_chemistry, c_uh_chemistry, 'call_voicemail', 'phone',
     jsonb_build_object('awaiting_callback', true),
     'Left a brief voicemail mentioning the email and Olera.',
     'voicemail', admin_id, NOW() - INTERVAL '2 days');

  -- ── 12. UH Honors Pre-Health Advisor — promised callback ───────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_honors, uh_id, 'advisor', 'Jenna Alvarado',
    ARRAY['Pre-Med', 'Pre-PA'], 'engaged', 'not_yet',
    '{}'::jsonb, 0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_honors, o_uh_honors, 'Jenna Alvarado', 'Jenna', 'Alvarado', 'Honors Advisor',
    'jalvarado@uh.edu', '+18324672720', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_uh_honors, c_uh_honors, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'jalvarado@uh.edu',
                        'recipient_name', 'Jenna Alvarado'),
     NULL, NULL, admin_id, NOW() - INTERVAL '6 days'),
    (o_uh_honors, c_uh_honors, 'call_connected', 'phone',
     jsonb_build_object('awaiting_callback', true),
     'Picked up briefly — said she would call back tomorrow when out of class.',
     'promised_callback', admin_id, NOW() - INTERVAL '1 day'),
    (o_uh_honors, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, NULL, admin_id, NOW() - INTERVAL '1 day');

  -- ── 13. UH Honors College Pre-Health — advisor — stale ─────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_honors_college, uh_id, 'advisor', 'Marcus Webber',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'outreach_sent', 'not_yet',
    '{}'::jsonb, 10, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_honors_college, o_uh_honors_college, 'Marcus Webber', 'Marcus', 'Webber', 'Pre-Health Coordinator',
    'mwebber@uh.edu', '+18324672805', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_uh_honors_college, c_uh_honors_college, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0,  'template', 'intro',                'success', true,
                        'recipient_email', 'mwebber@uh.edu', 'recipient_name', 'Marcus Webber'),
     admin_id, NOW() - INTERVAL '14 days'),
    (o_uh_honors_college, c_uh_honors_college, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 3,  'template', 'followup_light',       'success', true,
                        'recipient_email', 'mwebber@uh.edu', 'recipient_name', 'Marcus Webber'),
     admin_id, NOW() - INTERVAL '11 days'),
    (o_uh_honors_college, c_uh_honors_college, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 5,  'template', 'followup_socialproof', 'success', true,
                        'recipient_email', 'mwebber@uh.edu', 'recipient_name', 'Marcus Webber'),
     admin_id, NOW() - INTERVAL '9 days'),
    (o_uh_honors_college, c_uh_honors_college, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 10, 'template', 'followup_final',       'success', true,
                        'recipient_email', 'mwebber@uh.edu', 'recipient_name', 'Marcus Webber'),
     admin_id, NOW() - INTERVAL '8 days');

  -- ── 14. UH Career Services Advisor — closed (no_response_closed) ───────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, reopen_at,
    created_by, last_edited_by
  ) VALUES (
    o_uh_career_services, uh_id, 'advisor', 'David Wong',
    ARRAY['Pre-Med'], 'no_response_closed', 'not_yet',
    jsonb_build_object('notes', 'No response after full cadence; auto-reopens in 90 days.'),
    10, (NOW() + INTERVAL '83 days')::date, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_career_services, o_uh_career_services, 'David Wong', 'David', 'Wong', 'Career Services Advisor',
    'dwong@uh.edu', '+18324673999', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_uh_career_services, c_uh_career_services, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'dwong@uh.edu', 'recipient_name', 'David Wong'),
     admin_id, NOW() - INTERVAL '20 days'),
    (o_uh_career_services, c_uh_career_services, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 3, 'template', 'followup_light', 'success', true,
                        'recipient_email', 'dwong@uh.edu', 'recipient_name', 'David Wong'),
     admin_id, NOW() - INTERVAL '17 days'),
    (o_uh_career_services, c_uh_career_services, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 10, 'template', 'followup_final', 'success', true,
                        'recipient_email', 'dwong@uh.edu', 'recipient_name', 'David Wong'),
     admin_id, NOW() - INTERVAL '10 days'),
    (o_uh_career_services, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'no_response_closed', 'reopen_at', (NOW() + INTERVAL '83 days')::text),
     admin_id, NOW() - INTERVAL '7 days');

  -- ── 17. UH Engineering Pre-Health Advisor — Interested + future call ───
  --      v8.8 supersedePendingFollowupCalls demo: row is engaged with a
  --      pending future Day-5 phone task. Marking meeting_scheduled,
  --      flagging wants_meeting, or stopping outreach should cancel the
  --      Day-5 call. The Day-10 final email survives until partner/closed
  --      exit (which then cancels it via tasksToCancelOnExit).
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_uh_engineering, uh_id, 'advisor', 'Priya Krishnan',
    ARRAY['Pre-Med', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object('notes', 'Replied yesterday; future Day-5 phone task still queued.'),
    3, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, first_name, last_name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_uh_engineering, o_uh_engineering, 'Priya Krishnan', 'Priya', 'Krishnan', 'Engineering Pre-Health Advisor',
    'pkrishnan@uh.edu', '+18324674040', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_uh_engineering, c_uh_engineering, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'pkrishnan@uh.edu',
                        'recipient_name', 'Priya Krishnan'),
     admin_id, NOW() - INTERVAL '4 days'),
    (o_uh_engineering, c_uh_engineering, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Interested — when works for a quick call?'),
     admin_id, NOW() - INTERVAL '1 day'),
    (o_uh_engineering, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     admin_id, NOW() - INTERVAL '1 day');
  -- Pending future Day-5 phone task — to be canceled on resolution event.
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_uh_engineering, 'outreach_followup_call', NOW() + INTERVAL '1 day',
    jsonb_build_object('day', 5), 'pending', admin_id
  );
  -- Pending future Day-10 final email task.
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_uh_engineering, 'outreach_email_send', NOW() + INTERVAL '6 days',
    jsonb_build_object('day', 10, 'template', 'followup_final',
                       'subject', 'Quick last note — Olera + UH Engineering Pre-Health',
                       'body', 'Hi {first_name}, last check-in...'),
    'pending', admin_id
  );

  -- ── 18. TAMU New Prospect Department — dept_head — prospect, NO CONTACT
  --      v8.9 contactless-fallback demo: a brand-new row with no contact
  --      yet. Card + drawer headers should fall back to organization_name
  --      ("New Prospect Department") since there's no Linda-Park-style
  --      headline available. Adding a contact in the drawer flips the
  --      header to the contact's name.
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_tamu_new_prospect, tamu_id, 'dept_head', 'New Prospect Department', 'Public Health',
    ARRAY['Pre-Med', 'Pre-PA'], 'prospect', 'not_yet',
    jsonb_build_object('notes', 'Just added — need to find the department chair.'),
    0, admin_id, admin_id
  );

  RAISE NOTICE 'Seeded 18 student-outreach demo rows (v8.10) across Texas A&M (%) and University of Houston (%).', tamu_id, uh_id;
END $$;

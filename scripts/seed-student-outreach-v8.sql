-- ─────────────────────────────────────────────────────────────────────────
-- Student Outreach v8 demo seed — Texas A&M + University of Houston only.
--
-- Twelve stakeholders, one per v8 state, so every tab and row variant is
-- visible at a glance:
--
--   Research tab
--     1. Prospect            → TAMU Aggie Pre-Med Society (no contact yet)
--     2. Researched          → TAMU Biology Department (ready to schedule)
--
--   Calls tab
--     3. Call due now        → UH Pre-Health Advising (advisor) — has a
--                              pending follow-up call task overdue by 1h.
--                              Also carries a custom-task ⭐.
--
--   Replies tab (7 sub-states)
--     4. mid_cadence         → TAMU Pre-Health Advising (advisor)
--     5. engaged             → UH Biology Department (dept_head, with a
--                              pending department approval)
--     6. wants_meeting       → TAMU Chemistry Department
--     7. booked              → TAMU Health Professions Office (also
--                              appears in Meetings tab)
--     8. needs_followup      → UH Pre-Med Society (post-meeting notes)
--     9. awaiting_callback   → UH Chemistry Department (voicemail 2d ago)
--    10. awaiting_callback   → UH Honors Pre-Health (promised callback 1d)
--    11. stale               → UH Honors College Pre-Health (8d cold)
--
--   Active Partners tab
--    12. active_partner      → TAMU Pre-Health Honor Society
--
-- Safe to re-run: only deletes rows tied to the two demo campus_ids before
-- re-inserting. No other data is touched.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  admin_id uuid;
  tamu_id  uuid;
  uh_id    uuid;

  -- Stakeholder ids (declared so children can reference them).
  o_prospect    uuid := gen_random_uuid();
  o_researched  uuid := gen_random_uuid();
  o_calls       uuid := gen_random_uuid();
  o_mid         uuid := gen_random_uuid();
  o_engaged     uuid := gen_random_uuid();
  o_wants       uuid := gen_random_uuid();
  o_booked      uuid := gen_random_uuid();
  o_followup    uuid := gen_random_uuid();
  o_voicemail   uuid := gen_random_uuid();
  o_promised    uuid := gen_random_uuid();
  o_stale       uuid := gen_random_uuid();
  o_partner     uuid := gen_random_uuid();

  c_researched  uuid := gen_random_uuid();
  c_calls       uuid := gen_random_uuid();
  c_mid         uuid := gen_random_uuid();
  c_engaged     uuid := gen_random_uuid();
  c_wants       uuid := gen_random_uuid();
  c_booked      uuid := gen_random_uuid();
  c_followup    uuid := gen_random_uuid();
  c_voicemail   uuid := gen_random_uuid();
  c_promised    uuid := gen_random_uuid();
  c_stale       uuid := gen_random_uuid();
  c_partner     uuid := gen_random_uuid();
BEGIN
  -- 1. Pick the first admin to attribute touchpoints to.
  SELECT user_id INTO admin_id
    FROM admin_users
    ORDER BY created_at ASC
    LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found in admin_users — seed needs a real user_id for touchpoints.created_by';
  END IF;

  -- 2. Upsert the two demo campuses.
  INSERT INTO student_outreach_campuses (slug, name, state, city, is_active)
  VALUES ('texas-am', 'Texas A&M University', 'TX', 'College Station', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true
  RETURNING id INTO tamu_id;

  INSERT INTO student_outreach_campuses (slug, name, state, city, is_active)
  VALUES ('university-of-houston', 'University of Houston', 'TX', 'Houston', true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true
  RETURNING id INTO uh_id;

  -- 3. Wipe any pre-existing demo rows on these two campuses.
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

  -- ── 1. PROSPECT — TAMU Aggie Pre-Med Society (Research tab) ─────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_prospect, tamu_id, 'student_org', 'Aggie Pre-Med Society',
    ARRAY[]::text[], 'prospect', 'not_yet', '{}'::jsonb, 0, admin_id, admin_id
  );

  -- ── 2. RESEARCHED — TAMU Biology Department (Research tab) ──────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs,
    status, contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_researched, tamu_id, 'dept_head', 'Texas A&M Biology Department', 'Biology',
    ARRAY['Pre-Med', 'Pre-Dental'],
    'researched', 'not_yet',
    jsonb_build_object('website', 'https://biology.tamu.edu', 'phone', '+19798452721'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_researched, o_researched, 'Dr. Sarah Chen', 'Department Head',
    'schen@bio.tamu.edu', '+19798452721', true, 'active', admin_id, admin_id
  );

  -- ── 3. CALLS DUE — UH Pre-Health Advising (Calls tab + custom task) ─────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_calls, uh_id, 'advisor', 'UH Pre-Health Advising',
    ARRAY['Pre-Med', 'Pre-PA'], 'outreach_sent', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/honors/pre-health', 'phone', '+18324672621'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_calls, o_calls, 'Marcus Reyes', 'Pre-Health Advisor',
    'mreyes@uh.edu', '+18324672621', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_calls, c_calls, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'mreyes@uh.edu'),
     admin_id, NOW() - INTERVAL '5 days');
  -- Pending phone follow-up — overdue by 1h so it shows in Calls.
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_calls, 'outreach_followup_call', NOW() - INTERVAL '1 hour',
    jsonb_build_object('day', 5), 'pending', admin_id
  );
  -- Custom task ⭐ to demo the star indicator.
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_calls, 'manual_followup', NOW(),
    jsonb_build_object('reason', 'custom', 'notes', 'Confirm office hours before calling'),
    'pending', admin_id
  );

  -- ── 4. MID_CADENCE — TAMU Pre-Health Advising (Replies tab) ─────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_mid, tamu_id, 'advisor', 'TAMU Pre-Health Advising',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'outreach_sent', 'not_yet',
    jsonb_build_object('website', 'https://aggiepremed.tamu.edu', 'phone', '+19798457777'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_mid, o_mid, 'Dr. Elena Rodriguez', 'Pre-Health Advisor',
    'erodriguez@tamu.edu', '+19798457777', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_mid, c_mid, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'erodriguez@tamu.edu'),
     admin_id, NOW() - INTERVAL '3 days');
  -- Day 3 email pending (the cron will fire it; this row is not stale).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_mid, 'outreach_email_send', NOW() + INTERVAL '15 minutes',
    jsonb_build_object('day', 3, 'template', 'followup_light',
                       'subject', 'Following up — Olera for TAMU Pre-Health',
                       'body', 'Hi Dr. Rodriguez, just following up on my note from earlier this week...'),
    'pending', admin_id
  );

  -- ── 5. ENGAGED — UH Biology Department (Replies + pending approval) ─────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_engaged, uh_id, 'dept_head', 'University of Houston Biology Department', 'Biology',
    ARRAY['Pre-Med', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/nsm/biology', 'phone', '+18327435440'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_engaged, o_engaged, 'Dr. Anita Patel', 'Department Chair',
    'apatel@uh.edu', '+18327435440', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_engaged, c_engaged, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'apatel@uh.edu'),
     admin_id, NOW() - INTERVAL '4 days'),
    (o_engaged, c_engaged, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Thanks for reaching out — interested but want to know more.'),
     admin_id, NOW() - INTERVAL '1 day'),
    (o_engaged, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     admin_id, NOW() - INTERVAL '1 day');
  -- Pending approval to demo the permission checklist.
  INSERT INTO student_outreach_approvals (
    outreach_id, approval_type, approval_for, status, requested_at,
    next_followup_at, created_by, last_updated_by
  ) VALUES (
    o_engaged, 'department', 'Email professors directly', 'requested',
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', admin_id, admin_id
  );

  -- ── 6. WANTS_MEETING — TAMU Chemistry Department ────────────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_wants, tamu_id, 'dept_head', 'Texas A&M Chemistry Department', 'Chemistry',
    ARRAY['Pre-Med', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object('website', 'https://chem.tamu.edu', 'phone', '+19798452201'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_wants, o_wants, 'Dr. James Holloway', 'Department Head',
    'jholloway@chem.tamu.edu', '+19798452201', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_wants, c_wants, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'jholloway@chem.tamu.edu'),
     NULL, admin_id, NOW() - INTERVAL '5 days'),
    (o_wants, c_wants, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Sounds great — when can we meet?'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_wants, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_wants, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'meeting_in_flight'),
     'Asked them for 3 time slots next week.',
     admin_id, NOW() - INTERVAL '2 days');

  -- ── 7. BOOKED — TAMU Health Professions Office (Replies + Meetings) ─────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_booked, tamu_id, 'advisor', 'TAMU Health Professions Office',
    ARRAY['Pre-Med', 'Pre-PA', 'Pre-Dental'], 'engaged', 'not_yet',
    jsonb_build_object(
      'website', 'https://hpo.tamu.edu',
      'phone',   '+19798456000',
      'meeting_at',   (NOW() + INTERVAL '1 day')::text,
      'meeting_kind', 'video'
    ),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_booked, o_booked, 'Tom Whitfield', 'Pre-Health Advisor',
    'twhitfield@tamu.edu', '+19798456000', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_booked, c_booked, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'twhitfield@tamu.edu'),
     NULL, admin_id, NOW() - INTERVAL '6 days'),
    (o_booked, c_booked, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Yes, happy to chat. Tomorrow at 2pm works.'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_booked, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '3 days'),
    (o_booked, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'meeting_in_flight'),
     'Coordinating time over email.',
     admin_id, NOW() - INTERVAL '2 days'),
    (o_booked, NULL, 'meeting_scheduled', 'meeting',
     jsonb_build_object('meeting_at', (NOW() + INTERVAL '1 day')::text, 'kind', 'video'),
     'Tomorrow 2pm video.',
     admin_id, NOW() - INTERVAL '1 day');

  -- ── 8. NEEDS_FOLLOWUP — UH Pre-Med Society ──────────────────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_followup, uh_id, 'student_org', 'UH Pre-Med Society',
    ARRAY['Pre-Med'], 'engaged', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/orgs/pre-med', 'phone', '+18324677000'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_followup, o_followup, 'Aisha Singh', 'President',
    'asingh@uh.edu', '+18324677000', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_followup, c_followup, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'asingh@uh.edu'),
     NULL, NULL, admin_id, NOW() - INTERVAL '10 days'),
    (o_followup, c_followup, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Would love to chat — Wed at 5?'),
     NULL, NULL, admin_id, NOW() - INTERVAL '7 days'),
    (o_followup, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, NULL, admin_id, NOW() - INTERVAL '7 days'),
    (o_followup, NULL, 'meeting_scheduled', 'meeting',
     jsonb_build_object('meeting_at', (NOW() - INTERVAL '5 days')::text, 'kind', 'video'),
     'Met with officers.', NULL,
     admin_id, NOW() - INTERVAL '6 days'),
    (o_followup, NULL, 'meeting_held', 'meeting',
     '{}'::jsonb,
     'Officers want to share with their list but need to ask faculty advisor first.',
     'needs_followup', admin_id, NOW() - INTERVAL '5 days'),
    (o_followup, NULL, 'note_added', NULL,
     jsonb_build_object('reason', 'post_meeting_followup',
                        'notes', 'Officers want to share with their list but need to ask faculty advisor first. Following up next week.'),
     'Officers want to share with their list but need to ask faculty advisor first. Following up next week.',
     NULL, admin_id, NOW() - INTERVAL '5 days');

  -- ── 9. AWAITING_CALLBACK (voicemail) — UH Chemistry Department ──────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, department, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_voicemail, uh_id, 'dept_head', 'University of Houston Chemistry Department', 'Chemistry',
    ARRAY['Pre-Med', 'Pre-Dental'], 'outreach_sent', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/nsm/chemistry', 'phone', '+18327435200'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_voicemail, o_voicemail, 'Dr. Robert Kim', 'Department Chair',
    'rkim@uh.edu', '+18327435200', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_voicemail, c_voicemail, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'rkim@uh.edu'),
     NULL, NULL, admin_id, NOW() - INTERVAL '5 days'),
    (o_voicemail, c_voicemail, 'call_voicemail', 'phone',
     jsonb_build_object('awaiting_callback', true),
     'Left a brief voicemail mentioning the email and Olera.', 'voicemail',
     admin_id, NOW() - INTERVAL '2 days');

  -- ── 10. AWAITING_CALLBACK (promised) — UH Honors Pre-Health ─────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_promised, uh_id, 'advisor', 'UH Honors Pre-Health Advisor',
    ARRAY['Pre-Med', 'Pre-PA'], 'engaged', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/honors', 'phone', '+18324672720'),
    0, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_promised, o_promised, 'Jenna Alvarado', 'Honors Advisor',
    'jalvarado@uh.edu', '+18324672720', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, outcome, created_by, created_at
  ) VALUES
    (o_promised, c_promised, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'jalvarado@uh.edu'),
     NULL, NULL, admin_id, NOW() - INTERVAL '6 days'),
    (o_promised, c_promised, 'call_connected', 'phone',
     jsonb_build_object('awaiting_callback', true),
     'Picked up briefly — said she would call back tomorrow when out of class.',
     'promised_callback',
     admin_id, NOW() - INTERVAL '1 day'),
    (o_promised, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, NULL, admin_id, NOW() - INTERVAL '1 day');

  -- ── 11. STALE — UH Honors College Pre-Health ────────────────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day, created_by, last_edited_by
  ) VALUES (
    o_stale, uh_id, 'advisor', 'UH Honors College Pre-Health',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'outreach_sent', 'not_yet',
    jsonb_build_object('website', 'https://uh.edu/honors/pre-health', 'phone', '+18324672805'),
    10, admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_stale, o_stale, 'Marcus Webber', 'Pre-Health Coordinator',
    'mwebber@uh.edu', '+18324672805', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, created_by, created_at
  ) VALUES
    (o_stale, c_stale, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0,  'template', 'intro',                'success', true,
                        'recipient_email', 'mwebber@uh.edu'),
     admin_id, NOW() - INTERVAL '14 days'),
    (o_stale, c_stale, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 3,  'template', 'followup_light',       'success', true,
                        'recipient_email', 'mwebber@uh.edu'),
     admin_id, NOW() - INTERVAL '11 days'),
    (o_stale, c_stale, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 5,  'template', 'followup_socialproof', 'success', true,
                        'recipient_email', 'mwebber@uh.edu'),
     admin_id, NOW() - INTERVAL '9 days'),
    (o_stale, c_stale, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 10, 'template', 'followup_final',       'success', true,
                        'recipient_email', 'mwebber@uh.edu'),
     admin_id, NOW() - INTERVAL '8 days');

  -- ── 12. ACTIVE_PARTNER — TAMU Pre-Health Honor Society ──────────────────
  INSERT INTO student_outreach (
    id, campus_id, stakeholder_type, organization_name, programs, status,
    contact_permission, research_data, cadence_day,
    distribution_evidence, distribution_evidence_notes, partner_health,
    created_by, last_edited_by
  ) VALUES (
    o_partner, tamu_id, 'student_org', 'TAMU Pre-Health Honor Society',
    ARRAY['Pre-Med', 'Pre-Dental', 'Pre-PA'], 'active_partner', 'granted_direct',
    jsonb_build_object('website', 'https://aggiehonors.tamu.edu/pre-health',
                       'phone', '+19798452100'),
    0, 'explicit_email', 'Sent confirmation email saying they would share with their list.',
    'healthy', admin_id, admin_id
  );
  INSERT INTO student_outreach_contacts (
    id, outreach_id, name, role, email, phone, is_primary, status, created_by, last_edited_by
  ) VALUES (
    c_partner, o_partner, 'Sofia Martinez', 'President',
    'smartinez@tamu.edu', '+19798452100', true, 'active', admin_id, admin_id
  );
  INSERT INTO student_outreach_touchpoints (
    outreach_id, contact_id, touchpoint_type, channel, payload, notes, created_by, created_at
  ) VALUES
    (o_partner, c_partner, 'email_sent', 'email',
     jsonb_build_object('cadence_day', 0, 'template', 'intro', 'success', true,
                        'recipient_email', 'smartinez@tamu.edu'),
     NULL, admin_id, NOW() - INTERVAL '21 days'),
    (o_partner, c_partner, 'email_replied', 'email',
     jsonb_build_object('reply_excerpt', 'Yes! Happy to share with our pre-health list.'),
     NULL, admin_id, NOW() - INTERVAL '18 days'),
    (o_partner, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'outreach_sent', 'to', 'engaged'),
     NULL, admin_id, NOW() - INTERVAL '18 days'),
    (o_partner, NULL, 'stage_change', NULL,
     jsonb_build_object('from', 'engaged', 'to', 'active_partner'),
     'Committed to share with member list.', admin_id, NOW() - INTERVAL '14 days'),
    (o_partner, NULL, 'distribution_confirmed', NULL,
     jsonb_build_object('evidence', 'explicit_email'),
     'Sent confirmation email saying they would share with their list.',
     admin_id, NOW() - INTERVAL '14 days');
  -- Next seasonal email queued (~30 days out — placeholder snapshot).
  INSERT INTO student_outreach_tasks (
    outreach_id, task_type, due_at, payload, status, created_by
  ) VALUES (
    o_partner, 'outreach_email_send', NOW() + INTERVAL '30 days',
    jsonb_build_object('day', -1, 'template', 'seasonal', 'season', 'fall_kickoff',
                       'subject', 'Olera — fall semester pre-health resources',
                       'body', 'Hi Sofia, kicking off the semester...'),
    'pending', admin_id
  );

  RAISE NOTICE 'Seeded 12 student-outreach demo rows across Texas A&M (%) and University of Houston (%).', tamu_id, uh_id;
END $$;

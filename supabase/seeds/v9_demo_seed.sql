-- ===========================================================================
-- v9.0 MedJobs demo seed — copy-paste into Supabase SQL Editor
-- ===========================================================================
-- Six campuses, each at a different operational maturity stage. Together
-- they exercise every code path in the In Basket / Completed Tasks /
-- All Tasks experience.
--
--   A. u-houston   — brand new (no activity)
--   B. ut-austin   — provider funnel (8 catchment providers, 0 clients)
--   C. u-florida   — Stage 2 unlocked (1 client → "research needed" banner)
--   D. duke        — active workflow (1 client + 8 stakeholders + 1 provider)
--   E. vanderbilt  — mature (2 clients + 4 partners + 6 candidates)
--   F. uva         — terminal-state graveyard (5 closed rows, 1 redirected)
--
-- Idempotent: re-running wipes prior demo data first. Demo records are
-- tagged with metadata.demo_data_v1=true (business_profiles) or notes
-- prefix '[DEMO_DATA_V1]' (student_outreach). Cascade FKs handle
-- contacts / touchpoints / tasks / interviews on wipe.
--
-- Prerequisites: migrations 064, 069, 072, 073, 074 must already be
-- applied. The 6 target campuses (u-houston, ut-austin, u-florida,
-- duke, vanderbilt, uva) are seeded by migration 064.
-- ===========================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Wipe prior demo data (cascades clear contacts/touchpoints/tasks)
-- ─────────────────────────────────────────────────────────────────────

DELETE FROM student_outreach
 WHERE notes LIKE '[DEMO_DATA_V1]%';

DELETE FROM business_profiles
 WHERE metadata @> '{"demo_data_v1": true}'::jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Campus state (UVA is research_complete=true; others false)
-- ─────────────────────────────────────────────────────────────────────

UPDATE student_outreach_campuses SET research_complete = TRUE
 WHERE slug = 'uva';

UPDATE student_outreach_campuses SET research_complete = FALSE
 WHERE slug IN ('u-houston','ut-austin','u-florida','duke','vanderbilt');

-- ─────────────────────────────────────────────────────────────────────
-- 3. Providers (business_profiles type='organization')
-- ─────────────────────────────────────────────────────────────────────
-- IDs use a stable scheme so we can reference them in FKs below:
--   Providers:  00000000-0000-0000-aa00-XXXXXXXXXXXX
--   Students:   00000000-0000-0000-bb00-XXXXXXXXXXXX
--   Outreach:   00000000-0000-0000-cc00-XXXXXXXXXXXX
--   Contacts:   00000000-0000-0000-dd00-XXXXXXXXXXXX

-- Note: business_profiles in production does NOT have a `business_name`
-- column. Provider name lives in display_name; business-name semantics
-- can be added to metadata if needed later.
INSERT INTO business_profiles (id, type, slug, display_name, email, phone, city, state, is_active, created_at, metadata) VALUES
  -- Duke catchment (Durham/Chapel Hill/Raleigh)
  ('00000000-0000-0000-aa00-000000000001', 'organization', 'demo-triangle-home-care',         'Triangle Home Care',         'contact@trianglehomecare.example',         '+19195551001', 'Durham',          'NC', true, NOW() - INTERVAL '120 days', jsonb_build_object('demo_data_v1', true, 'interview_terms_accepted_at', (NOW() - INTERVAL '60 days')::text, 'medjobs_credits_used', 3)),
  ('00000000-0000-0000-aa00-000000000002', 'organization', 'demo-bull-city-caregivers',       'Bull City Caregivers',       'contact@bullcitycaregivers.example',       '+19195551002', 'Durham',          'NC', true, NOW() - INTERVAL '90 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000003', 'organization', 'demo-tobacco-road-senior',        'Tobacco Road Senior Services','contact@tobaccoroadseniorservices.example','+19195551003', 'Durham',          'NC', true, NOW() - INTERVAL '85 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000004', 'organization', 'demo-carolina-companions',        'Carolina Companions',        'contact@carolinacompanions.example',        '+19195551004', 'Chapel Hill',     'NC', true, NOW() - INTERVAL '70 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000005', 'organization', 'demo-research-triangle-care',     'Research Triangle Care',     'contact@researchtrianglecare.example',     '+19195551005', 'Raleigh',         'NC', true, NOW() - INTERVAL '50 days',  jsonb_build_object('demo_data_v1', true)),
  -- U Florida catchment (Gainesville)
  ('00000000-0000-0000-aa00-000000000006', 'organization', 'demo-gator-care-services',        'Gator Care Services',        'contact@gatorcareservices.example',        '+13525551006', 'Gainesville',     'FL', true, NOW() - INTERVAL '60 days',  jsonb_build_object('demo_data_v1', true, 'interview_terms_accepted_at', (NOW() - INTERVAL '30 days')::text, 'medjobs_credits_used', 1)),
  ('00000000-0000-0000-aa00-000000000007', 'organization', 'demo-sunshine-home-health',       'Sunshine Home Health',       'contact@sunshinehomehealth.example',       '+13525551007', 'Gainesville',     'FL', true, NOW() - INTERVAL '45 days',  jsonb_build_object('demo_data_v1', true)),
  -- Vanderbilt catchment (Nashville/Murfreesboro/Franklin)
  ('00000000-0000-0000-aa00-000000000008', 'organization', 'demo-music-city-home-health',     'Music City Home Health',     'contact@musiccityhomehealth.example',      '+16155551008', 'Nashville',       'TN', true, NOW() - INTERVAL '180 days', jsonb_build_object('demo_data_v1', true, 'interview_terms_accepted_at', (NOW() - INTERVAL '100 days')::text, 'medjobs_credits_used', 8, 'medjobs_subscription_active', true, 'medjobs_stripe_customer_id', 'cus_demoMusicCity', 'medjobs_subscription_id', 'sub_demo01234567')),
  ('00000000-0000-0000-aa00-000000000009', 'organization', 'demo-cumberland-caregivers',      'Cumberland Caregivers',      'contact@cumberlandcaregivers.example',     '+16155551009', 'Nashville',       'TN', true, NOW() - INTERVAL '110 days', jsonb_build_object('demo_data_v1', true, 'interview_terms_accepted_at', (NOW() - INTERVAL '80 days')::text, 'medjobs_credits_used', 4)),
  ('00000000-0000-0000-aa00-000000000010', 'organization', 'demo-tennessee-senior-solutions', 'Tennessee Senior Solutions', 'contact@tennesseeseniorsolutions.example', '+16155551010', 'Nashville',       'TN', true, NOW() - INTERVAL '120 days', jsonb_build_object('demo_data_v1', true, 'interview_terms_accepted_at', (NOW() - INTERVAL '95 days')::text, 'medjobs_credits_used', 2)),
  ('00000000-0000-0000-aa00-000000000011', 'organization', 'demo-smoky-mountain-care',        'Smoky Mountain Care',        'contact@smokymountaincare.example',        '+16155551011', 'Murfreesboro',    'TN', true, NOW() - INTERVAL '40 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000012', 'organization', 'demo-hatch-show-caregivers',      'Hatch Show Caregivers',      'contact@hatchshowcaregivers.example',      '+16155551012', 'Franklin',        'TN', true, NOW() - INTERVAL '220 days', jsonb_build_object('demo_data_v1', true)),
  -- UT Austin catchment (Austin/Round Rock/Cedar Park) — Stage 1 prospects
  ('00000000-0000-0000-aa00-000000000013', 'organization', 'demo-sunshine-senior-care',       'Sunshine Senior Care',       'contact@sunshineseniorcare.example',       '+15125551013', 'Austin',          'TX', true, NOW() - INTERVAL '40 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000014', 'organization', 'demo-capital-caregivers',         'Capital Caregivers',         'contact@capitalcaregivers.example',        '+15125551014', 'Austin',          'TX', true, NOW() - INTERVAL '38 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000015', 'organization', 'demo-hill-country-home-health',   'Hill Country Home Health',   'contact@hillcountryhomehealth.example',    '+15125551015', 'Round Rock',      'TX', true, NOW() - INTERVAL '35 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000016', 'organization', 'demo-lone-star-companions',       'Lone Star Companions',       'contact@lonestarcompanions.example',       '+15125551016', 'Cedar Park',      'TX', true, NOW() - INTERVAL '32 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000017', 'organization', 'demo-alamo-family-care',          'Alamo Family Care',          'contact@alamofamilycare.example',          '+15125551017', 'Austin',          'TX', true, NOW() - INTERVAL '28 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000018', 'organization', 'demo-bluebonnet-in-home',         'Bluebonnet In-Home Services','contact@bluebonnetinhomeservices.example', '+15125551018', 'Round Rock',      'TX', true, NOW() - INTERVAL '24 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000019', 'organization', 'demo-texas-care-connect',         'Texas Care Connect',         'contact@texascareconnect.example',         '+15125551019', 'Austin',          'TX', true, NOW() - INTERVAL '20 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000020', 'organization', 'demo-live-oak-caregivers',        'Live Oak Caregivers',        'contact@liveoakcaregivers.example',        '+15125551020', 'Cedar Park',      'TX', true, NOW() - INTERVAL '15 days',  jsonb_build_object('demo_data_v1', true)),
  -- UVA catchment (Charlottesville)
  ('00000000-0000-0000-aa00-000000000021', 'organization', 'demo-blue-ridge-care-services',   'Blue Ridge Care Services',   'contact@blueridgecareservices.example',    '+14345551021', 'Charlottesville', 'VA', true, NOW() - INTERVAL '90 days',  jsonb_build_object('demo_data_v1', true)),
  ('00000000-0000-0000-aa00-000000000022', 'organization', 'demo-cavalier-companions',        'Cavalier Companions',        'contact@cavaliercompanions.example',       '+14345551022', 'Charlottesville', 'VA', true, NOW() - INTERVAL '85 days',  jsonb_build_object('demo_data_v1', true));

-- ─────────────────────────────────────────────────────────────────────
-- 4. Students (business_profiles type='student')
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO business_profiles (id, type, slug, display_name, email, city, state, is_active, created_at, metadata) VALUES
  -- 6 Vanderbilt live candidates (Campus E)
  ('00000000-0000-0000-bb00-000000000001', 'student', 'demo-sarah-chen',      'Sarah Chen',      'schen@example.edu',      'Nashville', 'TN', true, NOW() - INTERVAL '14 days', jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'pre-nursing', 'application_completed', true,  'has_video', true,  'certifications_count', 2)),
  ('00000000-0000-0000-bb00-000000000002', 'student', 'demo-marcus-reyes',    'Marcus Reyes',    'mreyes@example.edu',     'Nashville', 'TN', true, NOW() - INTERVAL '22 days', jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'pre-med',     'application_completed', true,  'has_video', true,  'certifications_count', 1)),
  ('00000000-0000-0000-bb00-000000000003', 'student', 'demo-priya-patel',     'Priya Patel',     'ppatel@example.edu',     'Nashville', 'TN', true, NOW() - INTERVAL '8 days',  jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'pre-pa',      'application_completed', true,  'has_video', true,  'certifications_count', 3)),
  ('00000000-0000-0000-bb00-000000000004', 'student', 'demo-jordan-williams', 'Jordan Williams', 'jwilliams@example.edu',  'Nashville', 'TN', true, NOW() - INTERVAL '35 days', jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'nursing',     'application_completed', true,  'has_video', false, 'certifications_count', 4)),
  ('00000000-0000-0000-bb00-000000000005', 'student', 'demo-emily-rodriguez', 'Emily Rodriguez', 'erodriguez@example.edu', 'Nashville', 'TN', true, NOW() - INTERVAL '41 days', jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'pre-med',     'application_completed', true,  'has_video', false, 'certifications_count', 2)),
  ('00000000-0000-0000-bb00-000000000006', 'student', 'demo-tyler-brooks',    'Tyler Brooks',    'tbrooks@example.edu',    'Nashville', 'TN', true, NOW() - INTERVAL '12 days', jsonb_build_object('demo_data_v1', true, 'university', 'Vanderbilt University', 'program_track', 'pre-pa',      'application_completed', true,  'has_video', true,  'certifications_count', 1)),
  -- Duke (2 live + 1 incomplete)
  ('00000000-0000-0000-bb00-000000000007', 'student', 'demo-aisha-patel',     'Aisha Patel',     'apatel@example.edu',     'Durham',    'NC', true, NOW() - INTERVAL '16 days', jsonb_build_object('demo_data_v1', true, 'university', 'Duke University',                  'program_track', 'pre-med',     'application_completed', true,  'has_video', true,  'certifications_count', 2)),
  ('00000000-0000-0000-bb00-000000000008', 'student', 'demo-devon-kim',       'Devon Kim',       'dkim@example.edu',       'Durham',    'NC', true, NOW() - INTERVAL '28 days', jsonb_build_object('demo_data_v1', true, 'university', 'Duke University',                  'program_track', 'nursing',     'application_completed', true,  'has_video', false, 'certifications_count', 3)),
  ('00000000-0000-0000-bb00-000000000009', 'student', 'demo-lauren-thompson', 'Lauren Thompson', 'lthompson@example.edu',  'Durham',    'NC', true, NOW() - INTERVAL '5 days',  jsonb_build_object('demo_data_v1', true, 'university', 'Duke University',                  'program_track', 'pre-nursing', 'application_completed', false, 'has_video', false, 'certifications_count', 0)),
  -- Other universities — incomplete signups
  ('00000000-0000-0000-bb00-000000000010', 'student', 'demo-mia-garcia',      'Mia Garcia',      'mgarcia@example.edu',    'Gainesville',     'FL', true, NOW() - INTERVAL '9 days',  jsonb_build_object('demo_data_v1', true, 'university', 'University of Florida',            'program_track', 'pre-med', 'application_completed', false, 'has_video', false, 'certifications_count', 0)),
  ('00000000-0000-0000-bb00-000000000011', 'student', 'demo-noah-anderson',   'Noah Anderson',   'nanderson@example.edu',  'Charlottesville', 'VA', true, NOW() - INTERVAL '18 days', jsonb_build_object('demo_data_v1', true, 'university', 'University of Virginia',           'program_track', 'nursing', 'application_completed', false, 'has_video', false, 'certifications_count', 0)),
  ('00000000-0000-0000-bb00-000000000012', 'student', 'demo-riley-foster',    'Riley Foster',    'rfoster@example.edu',    'Austin',          'TX', true, NOW() - INTERVAL '3 days',  jsonb_build_object('demo_data_v1', true, 'university', 'University of Texas at Austin',    'program_track', 'pre-pa',  'application_completed', false, 'has_video', false, 'certifications_count', 1));

-- ─────────────────────────────────────────────────────────────────────
-- 5. Outreach rows (capture campus IDs via subquery for FK)
-- ─────────────────────────────────────────────────────────────────────
-- Campus D (Duke) — full active workflow

INSERT INTO student_outreach (id, campus_id, stakeholder_type, kind, provider_business_profile_id, organization_name, department, programs, status, contact_permission, research_data, cadence_day, notes, viewed_at, last_edited_at, created_at, meeting_at, distribution_evidence, distribution_evidence_notes, redirected_to_id) VALUES
  -- Duke
  ('00000000-0000-0000-cc00-000000000001', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'student_org', 'student_org', NULL, 'Pre-Med Society at Duke',     'Student Organizations', '{}', 'prospect',          'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NULL,                       NOW() - INTERVAL '0 days',  NOW() - INTERVAL '1 day',   NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000002', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'advisor',     'advisor',     NULL, 'Duke Pre-Health Advising',    'Office of the Dean',    '{}', 'researched',        'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NULL,                       NOW() - INTERVAL '1 day',   NOW() - INTERVAL '2 days',  NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000003', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'dept_head',   'dept_head',   NULL, 'Duke Department of Biology',  'Biology',               '{}', 'outreach_sent',     'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '5 days',  NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000004', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'student_org', 'student_org', NULL, 'Duke Pre-PA Society',         'Student Organizations', '{}', 'engaged',           'not_yet', '{}', 6, '[DEMO_DATA_V1] ', NULL,                       NOW() - INTERVAL '8 minutes',NOW() - INTERVAL '7 days',  NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000005', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'advisor',     'advisor',     NULL, 'Office of Pre-Health',        'Trinity College',       '{}', 'meeting_scheduled', 'not_yet', '{}', 6, '[DEMO_DATA_V1] ', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '10 days', NOW() + INTERVAL '3 days', NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000006', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'dept_head',   'dept_head',   NULL, 'Duke School of Nursing',      'Nursing',               '{}', 'agreed',            'not_yet', '{}', 12,'[DEMO_DATA_V1] ', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '6 days',  NOW() - INTERVAL '14 days', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000007', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'advisor',     'advisor',     NULL, 'Duke Health Sciences Office', 'Pre-Health Programs',   '{}', 'engaged',           'not_yet', '{}', 9, '[DEMO_DATA_V1] Met in person at career fair. Wants more details before sharing.', NULL, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '16 days', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000008', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       'student_org', 'student_org', NULL, 'Coach K''s Office',            'Athletics — Pre-Med Liaison','{}', 'engaged',         'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NULL,                       NOW() - INTERVAL '1 day',   NOW() - INTERVAL '8 days',  NULL, NULL, NULL, NULL),
  -- Duke materialized provider (kind='provider', stakeholder_type=NULL)
  ('00000000-0000-0000-cc00-000000000009', (SELECT id FROM student_outreach_campuses WHERE slug = 'duke'),       NULL,          'provider',    '00000000-0000-0000-aa00-000000000002', 'Bull City Caregivers', NULL, '{}', 'outreach_sent', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '1 day',   NOW() - INTERVAL '3 days',  NOW() - INTERVAL '5 days',  NULL, NULL, NULL, NULL),
  -- Vanderbilt
  ('00000000-0000-0000-cc00-000000000010', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), 'student_org', 'student_org', NULL, 'Vanderbilt Pre-Med Society',  'Student Organizations', '{}', 'active_partner', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '95 days', NULL, 'observed_external', 'Saw their newsletter linking our profiles 3 weeks ago.', NULL),
  ('00000000-0000-0000-cc00-000000000011', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), 'advisor',     'advisor',     NULL, 'Vanderbilt Pre-Health Advising','Career Center',         '{}', 'active_partner', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '50 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '115 days', NULL, 'explicit_email',     'Confirmed in email — sharing with the pre-health listserv quarterly.', NULL),
  ('00000000-0000-0000-cc00-000000000012', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), 'dept_head',   'dept_head',   NULL, 'Vandy School of Nursing',     'Nursing',               '{}', 'active_partner', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '75 days', NULL, 'self_reported',      'Tracking via the spring intake survey.', NULL),
  ('00000000-0000-0000-cc00-000000000013', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), 'dept_head',   'dept_head',   NULL, 'Vanderbilt Public Health',    'Public Health',         '{}', 'distributed',    'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '45 days', NULL, 'explicit_verbal',    'Confirmed verbally in a meeting that they''ve shared the program.', NULL),
  ('00000000-0000-0000-cc00-000000000014', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), 'student_org', 'student_org', NULL, 'Vanderbilt Pre-PA Club',      'Student Organizations', '{}', 'outreach_sent', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '6 days',  NULL, NULL, NULL, NULL),
  -- Vanderbilt historical provider partner
  ('00000000-0000-0000-cc00-000000000015', (SELECT id FROM student_outreach_campuses WHERE slug = 'vanderbilt'), NULL,          'provider',    '00000000-0000-0000-aa00-000000000012', 'Hatch Show Caregivers', NULL, '{}', 'active_partner', 'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '100 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '210 days', NULL, 'self_reported', 'Provider was an early adopter. Now regularly hires from our pool.', NULL),
  -- UVA terminal-state graveyard
  ('00000000-0000-0000-cc00-000000000016', (SELECT id FROM student_outreach_campuses WHERE slug = 'uva'),        'student_org', 'student_org', NULL, 'UVA Pre-Med Society',         'Student Organizations', '{}', 'not_interested',     'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '35 days', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000017', (SELECT id FROM student_outreach_campuses WHERE slug = 'uva'),        'advisor',     'advisor',     NULL, 'UVA Pre-Health Advising',     'Office of the Dean',    '{}', 'no_response_closed', 'not_yet', '{}', 14,'[DEMO_DATA_V1] ', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '65 days', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000018', (SELECT id FROM student_outreach_campuses WHERE slug = 'uva'),        'dept_head',   'dept_head',   NULL, 'UVA Health Sciences',         'Health Sciences',       '{}', 'do_not_contact',     'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '40 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '75 days', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-cc00-000000000019', (SELECT id FROM student_outreach_campuses WHERE slug = 'uva'),        'professor',   'professor',   NULL, 'UVA Biology',                 'Biology',               '{}', 'wrong_contact',      'via_dept', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '35 days', NULL, NULL, NULL, NULL),
  -- Redirected row (points at Duke #1)
  ('00000000-0000-0000-cc00-000000000020', (SELECT id FROM student_outreach_campuses WHERE slug = 'uva'),        'student_org', 'student_org', NULL, 'UVA Pre-PA Club',             'Student Organizations', '{}', 'redirected',         'not_yet', '{}', 0, '[DEMO_DATA_V1] ', NOW() - INTERVAL '15 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '30 days', NULL, NULL, NULL, '00000000-0000-0000-cc00-000000000001');

-- ─────────────────────────────────────────────────────────────────────
-- 6. Contacts (one per outreach row that has a contact)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach_contacts (id, outreach_id, name, first_name, last_name, title, role, email, phone, is_primary, status) VALUES
  ('00000000-0000-0000-dd00-000000000001', '00000000-0000-0000-cc00-000000000001', 'Marcus Reyes',      'Marcus',  'Reyes',     NULL,    'President',                 'premed@duke.example.edu',         NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000002', '00000000-0000-0000-cc00-000000000002', 'Dr. Sarah Chen',    'Sarah',   'Chen',      'Dr.',   'Pre-Health Advisor',        'schen@duke.example.edu',          '+19195551234', true, 'active'),
  ('00000000-0000-0000-dd00-000000000003', '00000000-0000-0000-cc00-000000000003', 'Prof. Andrew Sato', 'Andrew',  'Sato',      'Prof.', 'Department Chair',          'asato@duke.example.edu',          NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000004', '00000000-0000-0000-cc00-000000000004', 'Priya Patel',       'Priya',   'Patel',     NULL,    'VP',                        'prepa@duke.example.edu',          NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000005', '00000000-0000-0000-cc00-000000000005', 'Dr. Helen Whitaker','Helen',   'Whitaker',  'Dr.',   'Director',                  'hwhitaker@duke.example.edu',      NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000006', '00000000-0000-0000-cc00-000000000006', 'Dr. Robert Patel',  'Robert',  'Patel',     'Dr.',   'Dean of Students',          'rpatel-nursing@duke.example.edu', NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000007', '00000000-0000-0000-cc00-000000000007', 'Dr. Maya Sharma',   'Maya',    'Sharma',    'Dr.',   'Pre-Health Coordinator',    'msharma@duke.example.edu',        NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000008', '00000000-0000-0000-cc00-000000000008', 'Devon Kim',         'Devon',   'Kim',       NULL,    'Liaison',                   NULL,                              '+19195559876', true, 'active'),
  ('00000000-0000-0000-dd00-000000000010', '00000000-0000-0000-cc00-000000000010', 'Sarah Chen',        'Sarah',   'Chen',      NULL,    'President',                 'premed@vandy.example.edu',        NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000011', '00000000-0000-0000-cc00-000000000011', 'Dr. James Iverson', 'James',   'Iverson',   'Dr.',   'Pre-Health Advisor',        'jiverson@vandy.example.edu',      NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000012', '00000000-0000-0000-cc00-000000000012', 'Dr. Rachel Okonkwo','Rachel',  'Okonkwo',   'Dr.',   'Department Chair',          'rokonkwo@vandy.example.edu',      NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000013', '00000000-0000-0000-cc00-000000000013', 'Dr. Olivia Park',   'Olivia',  'Park',      'Dr.',   'Department Chair',          'opark@vandy.example.edu',         NULL,           true, 'active'),
  ('00000000-0000-0000-dd00-000000000014', '00000000-0000-0000-cc00-000000000014', 'Tyler Brooks',      'Tyler',   'Brooks',    NULL,    'Outreach Officer',          'prepa@vandy.example.edu',         NULL,           true, 'active');

-- ─────────────────────────────────────────────────────────────────────
-- 7. Touchpoints (action history per outreach row)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach_touchpoints (outreach_id, contact_id, touchpoint_type, channel, outcome, notes, payload, created_at) VALUES
  -- Duke #2 (researched + research note)
  ('00000000-0000-0000-cc00-000000000002', '00000000-0000-0000-dd00-000000000002', 'note_added',       NULL,      NULL,            'Active advisor. Reachable via email.', '{}'::jsonb, NOW() - INTERVAL '1 day'),
  -- Duke #3 (outreach_sent — Day 0 email)
  ('00000000-0000-0000-cc00-000000000003', '00000000-0000-0000-dd00-000000000003', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'dept_head_intro', 'day', 0), NOW() - INTERVAL '2 days'),
  -- Duke #4 (engaged — full sequence)
  ('00000000-0000-0000-cc00-000000000004', '00000000-0000-0000-dd00-000000000004', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'student_org_intro', 'day', 0), NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-cc00-000000000004', '00000000-0000-0000-dd00-000000000004', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'student_org_followup', 'day', 3), NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-cc00-000000000004', '00000000-0000-0000-dd00-000000000004', 'email_replied',    'email',   'keep_emailing', 'Hi! Yes we''d love to share with our members. What''s the next step?', '{}'::jsonb, NOW() - INTERVAL '8 minutes'),
  -- Duke #5 (meeting_scheduled — full)
  ('00000000-0000-0000-cc00-000000000005', '00000000-0000-0000-dd00-000000000005', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'advisor_intro', 'day', 0), NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-cc00-000000000005', '00000000-0000-0000-dd00-000000000005', 'email_replied',    'email',   'wants_meeting', 'Happy to chat. Tuesday at 3pm?',         '{}'::jsonb, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-cc00-000000000005', '00000000-0000-0000-dd00-000000000005', 'meeting_scheduled','meeting', NULL,            NULL,                                    jsonb_build_object('meeting_at', (NOW() + INTERVAL '3 days')::text), NOW() - INTERVAL '4 days'),
  -- Duke #6 (agreed — meeting held)
  ('00000000-0000-0000-cc00-000000000006', '00000000-0000-0000-dd00-000000000006', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'dept_head_intro', 'day', 0), NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-cc00-000000000006', '00000000-0000-0000-dd00-000000000006', 'email_replied',    'email',   'wants_meeting', NULL,                                    '{}'::jsonb, NOW() - INTERVAL '9 days'),
  ('00000000-0000-0000-cc00-000000000006', '00000000-0000-0000-dd00-000000000006', 'meeting_scheduled','meeting', NULL,            NULL,                                    '{}'::jsonb, NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-cc00-000000000006', '00000000-0000-0000-dd00-000000000006', 'meeting_held',     'meeting', NULL,            'Great call. They want to share with junior + senior cohorts.', '{}'::jsonb, NOW() - INTERVAL '6 days'),
  -- Duke #7 (engaged + needs_followup — meeting held but not yet partner)
  ('00000000-0000-0000-cc00-000000000007', '00000000-0000-0000-dd00-000000000007', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'advisor_intro', 'day', 0), NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-cc00-000000000007', '00000000-0000-0000-dd00-000000000007', 'email_replied',    'email',   'wants_meeting', NULL,                                    '{}'::jsonb, NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-cc00-000000000007', '00000000-0000-0000-dd00-000000000007', 'meeting_scheduled','meeting', NULL,            NULL,                                    '{}'::jsonb, NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-cc00-000000000007', '00000000-0000-0000-dd00-000000000007', 'meeting_held',     'meeting', NULL,            'Wants more detail on the screening process before sharing with students. Will follow up via email.', '{}'::jsonb, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-cc00-000000000007', '00000000-0000-0000-dd00-000000000007', 'note_added',       NULL,      NULL,            'Needs follow-up email with screening criteria + sample profile.', '{}'::jsonb, NOW() - INTERVAL '1 day'),
  -- Duke #8 (engaged — voicemail awaiting callback)
  ('00000000-0000-0000-cc00-000000000008', '00000000-0000-0000-dd00-000000000008', 'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'student_org_intro', 'day', 0), NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-cc00-000000000008', '00000000-0000-0000-dd00-000000000008', 'call_voicemail',   'phone',   NULL,            'Left voicemail with callback number.', '{}'::jsonb, NOW() - INTERVAL '1 day'),
  -- Duke #9 (materialized provider, outreach_sent)
  ('00000000-0000-0000-cc00-000000000009', NULL,                                    'email_sent',       'email',   NULL,            NULL,                                    jsonb_build_object('template', 'provider_intro', 'day', 0), NOW() - INTERVAL '3 days'),
  -- Vanderbilt #10 (active_partner — full history)
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('template', 'student_org_intro', 'day', 0), NOW() - INTERVAL '90 days'),
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'email_replied',        'email',   'wants_meeting', NULL,                       '{}'::jsonb, NOW() - INTERVAL '87 days'),
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'meeting_held',         'meeting', NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '80 days'),
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'distribution_confirmed', NULL,    NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '75 days'),
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'agreed', 'to', 'active_partner'), NOW() - INTERVAL '75 days'),
  ('00000000-0000-0000-cc00-000000000010', '00000000-0000-0000-dd00-000000000010', 'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('template', 'partner_seasonal_checkin'), NOW() - INTERVAL '30 days'),
  -- Vanderbilt #11 (active_partner)
  ('00000000-0000-0000-cc00-000000000011', '00000000-0000-0000-dd00-000000000011', 'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '110 days'),
  ('00000000-0000-0000-cc00-000000000011', '00000000-0000-0000-dd00-000000000011', 'email_replied',        'email',   'wants_meeting', NULL,                       '{}'::jsonb, NOW() - INTERVAL '107 days'),
  ('00000000-0000-0000-cc00-000000000011', '00000000-0000-0000-dd00-000000000011', 'meeting_held',         'meeting', NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '100 days'),
  ('00000000-0000-0000-cc00-000000000011', '00000000-0000-0000-dd00-000000000011', 'distribution_confirmed', NULL,    NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '95 days'),
  ('00000000-0000-0000-cc00-000000000011', '00000000-0000-0000-dd00-000000000011', 'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'agreed', 'to', 'active_partner'), NOW() - INTERVAL '95 days'),
  -- Vanderbilt #12 (active_partner)
  ('00000000-0000-0000-cc00-000000000012', '00000000-0000-0000-dd00-000000000012', 'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '70 days'),
  ('00000000-0000-0000-cc00-000000000012', '00000000-0000-0000-dd00-000000000012', 'meeting_held',         'meeting', NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-cc00-000000000012', '00000000-0000-0000-dd00-000000000012', 'distribution_confirmed', NULL,    NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '50 days'),
  ('00000000-0000-0000-cc00-000000000012', '00000000-0000-0000-dd00-000000000012', 'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'agreed', 'to', 'active_partner'), NOW() - INTERVAL '50 days'),
  -- Vanderbilt #13 (distributed)
  ('00000000-0000-0000-cc00-000000000013', '00000000-0000-0000-dd00-000000000013', 'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '40 days'),
  ('00000000-0000-0000-cc00-000000000013', '00000000-0000-0000-dd00-000000000013', 'meeting_held',         'meeting', NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '25 days'),
  ('00000000-0000-0000-cc00-000000000013', '00000000-0000-0000-dd00-000000000013', 'distribution_confirmed', NULL,    NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '15 days'),
  -- Vanderbilt #14 (outreach_sent)
  ('00000000-0000-0000-cc00-000000000014', '00000000-0000-0000-dd00-000000000014', 'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('template', 'student_org_intro', 'day', 0), NOW() - INTERVAL '4 days'),
  -- Vanderbilt #15 (historical provider partner)
  ('00000000-0000-0000-cc00-000000000015', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '200 days'),
  ('00000000-0000-0000-cc00-000000000015', NULL,                                    'meeting_held',         'meeting', NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '180 days'),
  ('00000000-0000-0000-cc00-000000000015', NULL,                                    'distribution_confirmed', NULL,    NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '150 days'),
  ('00000000-0000-0000-cc00-000000000015', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'agreed', 'to', 'active_partner'), NOW() - INTERVAL '150 days'),
  -- UVA #16 (not_interested)
  ('00000000-0000-0000-cc00-000000000016', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-cc00-000000000016', NULL,                                    'email_replied',        'email',   'not_interested','We have our own program — not a fit at this time. Best of luck!', '{}'::jsonb, NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-cc00-000000000016', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'engaged', 'to', 'not_interested'), NOW() - INTERVAL '20 days'),
  -- UVA #17 (no_response_closed — Day 0/3/7/14 emails then closure)
  ('00000000-0000-0000-cc00-000000000017', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('day', 0),  NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-cc00-000000000017', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('day', 3),  NOW() - INTERVAL '57 days'),
  ('00000000-0000-0000-cc00-000000000017', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('day', 7),  NOW() - INTERVAL '53 days'),
  ('00000000-0000-0000-cc00-000000000017', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       jsonb_build_object('day', 14), NOW() - INTERVAL '46 days'),
  ('00000000-0000-0000-cc00-000000000017', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'outreach_sent', 'to', 'no_response_closed'), NOW() - INTERVAL '35 days'),
  -- UVA #18 (do_not_contact)
  ('00000000-0000-0000-cc00-000000000018', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '70 days'),
  ('00000000-0000-0000-cc00-000000000018', NULL,                                    'email_replied',        'email',   'do_not_contact','Please remove us from your outreach list.', '{}'::jsonb, NOW() - INTERVAL '50 days'),
  ('00000000-0000-0000-cc00-000000000018', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'engaged', 'to', 'do_not_contact'), NOW() - INTERVAL '50 days'),
  -- UVA #19 (wrong_contact)
  ('00000000-0000-0000-cc00-000000000019', NULL,                                    'email_sent',           'email',   NULL,            NULL,                       '{}'::jsonb, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-cc00-000000000019', NULL,                                    'email_replied',        'email',   'wrong_contact', 'I''m in chemistry now. You probably want Dr. Ramirez in biology.', '{}'::jsonb, NOW() - INTERVAL '25 days'),
  ('00000000-0000-0000-cc00-000000000019', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'outreach_sent', 'to', 'wrong_contact'), NOW() - INTERVAL '25 days'),
  -- UVA #20 (redirected)
  ('00000000-0000-0000-cc00-000000000020', NULL,                                    'redirect_initiated',   NULL,      NULL,            'Redirected to Duke per their request — they have a chapter relationship there.', '{}'::jsonb, NOW() - INTERVAL '18 days'),
  ('00000000-0000-0000-cc00-000000000020', NULL,                                    'stage_change',         NULL,      NULL,            NULL,                       jsonb_build_object('from', 'engaged', 'to', 'redirected'), NOW() - INTERVAL '18 days');

-- ─────────────────────────────────────────────────────────────────────
-- 8. Pending tasks (Step Board items)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO student_outreach_tasks (outreach_id, task_type, due_at, status, payload) VALUES
  ('00000000-0000-0000-cc00-000000000003', 'outreach_followup_email', NOW() + INTERVAL '1 day',  'pending', '{}'::jsonb),
  ('00000000-0000-0000-cc00-000000000008', 'outreach_followup_call',  NOW() + INTERVAL '2 hours','pending', '{}'::jsonb),
  ('00000000-0000-0000-cc00-000000000014', 'outreach_followup_email', NOW() + INTERVAL '2 days', 'pending', '{}'::jsonb);

-- ─────────────────────────────────────────────────────────────────────
-- 9. Interviews (link Music City Home Health → 4 Vanderbilt candidates)
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO interviews (provider_profile_id, student_profile_id, proposed_by, type, status, proposed_time, confirmed_time, duration_minutes, created_at) VALUES
  ('00000000-0000-0000-aa00-000000000008', '00000000-0000-0000-bb00-000000000001', '00000000-0000-0000-aa00-000000000008', 'video', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 30, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-aa00-000000000008', '00000000-0000-0000-bb00-000000000002', '00000000-0000-0000-aa00-000000000008', 'phone', 'confirmed', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days', 30, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-aa00-000000000008', '00000000-0000-0000-bb00-000000000003', '00000000-0000-0000-aa00-000000000008', 'video', 'proposed',  NOW() + INTERVAL '4 days', NULL,                       30, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-aa00-000000000008', '00000000-0000-0000-bb00-000000000004', '00000000-0000-0000-aa00-000000000008', 'phone', 'proposed',  NOW() + INTERVAL '5 days', NULL,                       30, NOW() - INTERVAL '8 days');

COMMIT;

-- ─────────────────────────────────────────────────────────────────────
-- Done. Summary:
--   22 providers (5 clients + 1 expired + 16 prospects)
--   12 students (6 live candidates + 6 signups)
--   20 outreach rows (Duke 9, Vanderbilt 6, UVA 5)
--   13 contacts
--   ~60 touchpoints
--   3 pending tasks
--   4 interviews
-- ─────────────────────────────────────────────────────────────────────

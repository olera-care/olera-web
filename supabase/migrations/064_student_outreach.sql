-- Migration: Student Outreach Funnel
--
-- Tables for the high-touch outreach workflow that recruits students into
-- Olera as candidates by going through university gatekeepers (student
-- orgs, pre-health advisors, dept heads, and permission-gated professors).
--
-- Mirrors staffing_outreach's drawer/queue/touchpoint architecture but
-- with a stakeholder funnel + separate tasks/approvals subsystems.
--
-- Tables:
--   student_outreach_campuses     one row per university campus
--   student_outreach              one row per stakeholder (org or person)
--   student_outreach_contacts     people under a stakeholder
--   student_outreach_touchpoints  append-only event log
--   student_outreach_approvals    permission requests
--   student_outreach_tasks        unified pending-work queue
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Campuses ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_outreach_campuses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  state         TEXT,
  city          TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_campuses_active
  ON student_outreach_campuses (is_active);

-- ── Outreach (one per stakeholder) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_outreach (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id                   UUID NOT NULL REFERENCES student_outreach_campuses(id) ON DELETE RESTRICT,
  stakeholder_type            TEXT NOT NULL CHECK (stakeholder_type IN
                                ('student_org','advisor','professor','dept_head')),
  organization_name           TEXT NOT NULL,
  department                  TEXT,
  programs                    TEXT[] NOT NULL DEFAULT '{}',

  status                      TEXT NOT NULL DEFAULT 'prospect'
                                CHECK (status IN (
                                  'prospect',
                                  'researched',
                                  'outreach_sent',
                                  'engaged',
                                  'meeting_scheduled',
                                  'agreed',
                                  'distributed',
                                  'active_partner',
                                  'not_interested',
                                  'no_response_closed',
                                  'do_not_contact',
                                  'wrong_contact',
                                  'redirected'
                                )),

  -- Professors only: blocks outreach until permission obtained
  contact_permission          TEXT NOT NULL DEFAULT 'not_yet'
                                CHECK (contact_permission IN
                                  ('not_yet','granted_direct','via_dept','via_listserv','denied')),
  permission_dependency_id    UUID REFERENCES student_outreach(id) ON DELETE SET NULL,

  research_data               JSONB NOT NULL DEFAULT '{}',
  cadence_day                 INT NOT NULL DEFAULT 0,
  snoozed_until               TIMESTAMPTZ,

  distribution_evidence       TEXT
                                CHECK (distribution_evidence IS NULL OR distribution_evidence IN
                                  ('explicit_email','explicit_verbal','observed_external','self_reported')),
  distribution_evidence_notes TEXT,

  reopen_at                   DATE,
  partner_health              TEXT
                                CHECK (partner_health IS NULL OR partner_health IN
                                  ('healthy','at_risk','dormant')),

  notes                       TEXT,
  redirected_to_id            UUID REFERENCES student_outreach(id) ON DELETE SET NULL,
  referred_from_id            UUID REFERENCES student_outreach(id) ON DELETE SET NULL,

  created_by                  UUID,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_edited_by              UUID,
  last_edited_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_campus_status      ON student_outreach (campus_id, status);
CREATE INDEX IF NOT EXISTS idx_so_status             ON student_outreach (status);
CREATE INDEX IF NOT EXISTS idx_so_stakeholder_type   ON student_outreach (stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_so_reopen             ON student_outreach (reopen_at)
  WHERE reopen_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_so_perm_dep           ON student_outreach (permission_dependency_id)
  WHERE permission_dependency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_so_blocked_professors ON student_outreach (campus_id)
  WHERE stakeholder_type = 'professor' AND contact_permission = 'not_yet';

-- ── Contacts (people under a stakeholder) ───────────────────────────────

CREATE TABLE IF NOT EXISTS student_outreach_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id       UUID NOT NULL REFERENCES student_outreach(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  role              TEXT,
  email             TEXT,
  phone             TEXT,
  instagram         TEXT,
  contact_form_url  TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','stale','incorrect','no_longer_valid')),
  notes             TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_edited_by    UUID,
  last_edited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_contacts_outreach ON student_outreach_contacts (outreach_id);
CREATE INDEX IF NOT EXISTS idx_so_contacts_email    ON student_outreach_contacts (email)
  WHERE email IS NOT NULL;

-- ── Touchpoints (append-only event log) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS student_outreach_touchpoints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id       UUID NOT NULL REFERENCES student_outreach(id) ON DELETE CASCADE,
  contact_id        UUID REFERENCES student_outreach_contacts(id) ON DELETE SET NULL,
  touchpoint_type   TEXT NOT NULL CHECK (touchpoint_type IN (
    -- email
    'email_sent','email_replied','email_bounced',
    -- phone
    'call_no_answer','call_voicemail','call_connected','call_wrong_number',
    -- alt channels
    'ig_dm_sent','ig_dm_replied','contact_form_submitted',
    -- meetings
    'meeting_scheduled','meeting_held','meeting_no_show','meeting_rescheduled',
    -- approvals
    'approval_requested','approval_granted','approval_denied','approval_expired',
    -- distribution
    'distribution_confirmed',
    -- contacts
    'contact_added','contact_marked_stale','contact_replaced',
    -- workflow
    'redirect_initiated','stage_change','note_added',
    'snoozed','task_cancelled','task_superseded',
    -- system
    'system_seasonal_due'
  )),
  channel           TEXT
                      CHECK (channel IS NULL OR channel IN
                        ('email','phone','ig_dm','contact_form','meeting','system')),
  outcome           TEXT,
  notes             TEXT,
  payload           JSONB NOT NULL DEFAULT '{}',
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_tp_outreach ON student_outreach_touchpoints (outreach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_so_tp_type     ON student_outreach_touchpoints (touchpoint_type);

-- Append-only: block UPDATE and DELETE so history can't drift.
CREATE OR REPLACE FUNCTION student_outreach_touchpoints_append_only()
  RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'student_outreach_touchpoints is append-only (% blocked)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_outreach_touchpoints_no_mutate ON student_outreach_touchpoints;
CREATE TRIGGER student_outreach_touchpoints_no_mutate
  BEFORE UPDATE OR DELETE ON student_outreach_touchpoints
  FOR EACH ROW EXECUTE FUNCTION student_outreach_touchpoints_append_only();

-- ── Approvals ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_outreach_approvals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id       UUID NOT NULL REFERENCES student_outreach(id) ON DELETE CASCADE,
  approval_type     TEXT NOT NULL CHECK (approval_type IN
                      ('department','marketing','listserv','job_board','other')),
  approval_for      TEXT NOT NULL,
  approval_from     TEXT,
  status            TEXT NOT NULL DEFAULT 'requested'
                      CHECK (status IN ('requested','granted','denied','expired')),
  next_followup_at  TIMESTAMPTZ,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  notes             TEXT,
  created_by        UUID,
  last_updated_by   UUID,
  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_appr_outreach ON student_outreach_approvals (outreach_id);
CREATE INDEX IF NOT EXISTS idx_so_appr_open     ON student_outreach_approvals (status)
  WHERE status = 'requested';

-- ── Tasks (unified queue, supports parallel pending tasks per row) ──────

CREATE TABLE IF NOT EXISTS student_outreach_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id     UUID NOT NULL REFERENCES student_outreach(id) ON DELETE CASCADE,
  approval_id     UUID REFERENCES student_outreach_approvals(id) ON DELETE CASCADE,
  task_type       TEXT NOT NULL CHECK (task_type IN (
    'research_initial',
    'outreach_day_0',
    'outreach_multichannel_orgs',
    'outreach_followup_email',
    'outreach_followup_call',
    'meeting_held_logging',
    'agreement_followup',
    'distribution_confirmation',
    'move_to_active_partner',
    'partner_seasonal_checkin',
    'partner_share_update',
    'partner_event_coordination',
    'approval_request_followup',
    'yearly_leadership_recheck',
    'manual_followup'
  )),
  due_at          TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','cancelled','superseded')),
  payload         JSONB NOT NULL DEFAULT '{}',
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_so_tasks_due      ON student_outreach_tasks (due_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_so_tasks_outreach ON student_outreach_tasks (outreach_id, status);
CREATE INDEX IF NOT EXISTS idx_so_tasks_approval ON student_outreach_tasks (approval_id)
  WHERE approval_id IS NOT NULL;

-- ── RLS: service-role only (admin pages go through API routes) ──────────

ALTER TABLE student_outreach_campuses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outreach              ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outreach_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outreach_touchpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outreach_approvals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outreach_tasks        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on student_outreach_campuses"
  ON student_outreach_campuses FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on student_outreach"
  ON student_outreach FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on student_outreach_contacts"
  ON student_outreach_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on student_outreach_touchpoints"
  ON student_outreach_touchpoints FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on student_outreach_approvals"
  ON student_outreach_approvals FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on student_outreach_tasks"
  ON student_outreach_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Seed campuses (mirrors lib/staffing-outreach/partner-universities) ──
-- Admin can add more via UI later.

INSERT INTO student_outreach_campuses (slug, name, city, state) VALUES
  ('ut-austin',             'University of Texas at Austin',                'Austin',          'TX'),
  ('texas-am',              'Texas A&M University',                         'College Station', 'TX'),
  ('u-houston',             'University of Houston / Rice',                 'Houston',         'TX'),
  ('u-florida',             'University of Florida',                        'Gainesville',     'FL'),
  ('florida-state',         'Florida State University',                     'Tallahassee',     'FL'),
  ('u-georgia',             'University of Georgia',                        'Athens',          'GA'),
  ('emory',                 'Emory University',                             'Atlanta',         'GA'),
  ('unc-chapel-hill',       'University of North Carolina at Chapel Hill',  'Chapel Hill',     'NC'),
  ('duke',                  'Duke University',                              'Durham',          'NC'),
  ('uva',                   'University of Virginia',                       'Charlottesville', 'VA'),
  ('virginia-tech',         'Virginia Tech',                                'Blacksburg',      'VA'),
  ('vanderbilt',            'Vanderbilt University',                        'Nashville',       'TN'),
  ('u-tennessee-knoxville', 'University of Tennessee Knoxville',            'Knoxville',       'TN'),
  ('u-kentucky',            'University of Kentucky',                       'Lexington',       'KY'),
  ('ohio-state',            'Ohio State University',                        'Columbus',        'OH'),
  ('u-michigan',            'University of Michigan',                       'Ann Arbor',       'MI'),
  ('michigan-state',        'Michigan State University',                    'East Lansing',    'MI'),
  ('penn-state',            'Penn State University',                        'State College',   'PA'),
  ('uw-madison',            'University of Wisconsin-Madison',              'Madison',         'WI'),
  ('u-minnesota',           'University of Minnesota',                      'Minneapolis',     'MN'),
  ('uiuc',                  'University of Illinois Urbana-Champaign',      'Champaign',       'IL'),
  ('indiana-bloomington',   'Indiana University Bloomington',               'Bloomington',     'IN'),
  ('cu-boulder',            'University of Colorado Boulder',               'Boulder',         'CO'),
  ('arizona-state',         'Arizona State University',                     'Tempe',           'AZ'),
  ('u-utah',                'University of Utah',                           'Salt Lake City',  'UT')
ON CONFLICT (slug) DO NOTHING;

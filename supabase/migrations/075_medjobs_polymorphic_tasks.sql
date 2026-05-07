-- v9.0 Phase 7 Commit B: polymorphic task tables for MedJobs entities
-- beyond stakeholders.
--
-- The legacy student_outreach_tasks table covers stakeholder rows
-- (outreach_id FK). Clients/Candidates (business_profiles) and Sites
-- (student_outreach_campuses) need their own pending-work queues so
-- the In Basket can surface a uniform "X has a pending task" signal
-- across all four entity types.
--
-- We chose Option B (separate tables, one per entity) over a
-- polymorphic FK or a unified subject_type/subject_id column because:
--   1. FK integrity stays at the schema level (cascade delete works
--      naturally per parent table).
--   2. RLS + indexes are simpler — each table optimizes for its own
--      access patterns.
--   3. The queue endpoint is the only consumer that unions them, and
--      it already does multi-source unions for the In Basket feed.
--
-- For the v9.0 MVP, only the "manual_followup" task_type is allowed
-- (custom tasks created by admins from the entity drawer's Step
-- Board). Auto-firing tasks (e.g. "Trial ending in 7 days") are
-- deferred. The CHECK constraint here is intentionally narrow so we
-- don't paint the schema into a corner before the auto-fire ruleset
-- is designed.

-- ── business_profile_tasks (Clients + Candidates) ─────────────────────

CREATE TABLE IF NOT EXISTS business_profile_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  -- 'client' (provider business_profile in pilot/sub) vs 'candidate'
  -- (student business_profile, type='student'). The queue endpoint
  -- routes the task to the right In Basket tab off this column.
  kind                TEXT NOT NULL CHECK (kind IN ('client', 'candidate')),
  task_type           TEXT NOT NULL CHECK (task_type IN ('manual_followup')),
  due_at              TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'cancelled', 'superseded')),
  payload             JSONB NOT NULL DEFAULT '{}',
  notes               TEXT,
  completed_at        TIMESTAMPTZ,
  completed_by        UUID,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bp_tasks_pending_due
  ON business_profile_tasks (due_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bp_tasks_profile_status
  ON business_profile_tasks (business_profile_id, status);

CREATE INDEX IF NOT EXISTS idx_bp_tasks_kind_pending
  ON business_profile_tasks (kind, due_at)
  WHERE status = 'pending';

ALTER TABLE business_profile_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on business_profile_tasks"
  ON business_profile_tasks;
CREATE POLICY "Service role full access on business_profile_tasks"
  ON business_profile_tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── site_tasks (Sites) ────────────────────────────────────────────────
--
-- DB column references the existing campus table. UI says "site";
-- schema says "campus". The new table name uses "site" because it's
-- a brand-new surface — no legacy data to migrate.

CREATE TABLE IF NOT EXISTS site_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id           UUID NOT NULL REFERENCES student_outreach_campuses(id) ON DELETE CASCADE,
  task_type           TEXT NOT NULL CHECK (task_type IN ('manual_followup')),
  due_at              TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'cancelled', 'superseded')),
  payload             JSONB NOT NULL DEFAULT '{}',
  notes               TEXT,
  completed_at        TIMESTAMPTZ,
  completed_by        UUID,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_tasks_pending_due
  ON site_tasks (due_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_site_tasks_campus_status
  ON site_tasks (campus_id, status);

ALTER TABLE site_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on site_tasks"
  ON site_tasks;
CREATE POLICY "Service role full access on site_tasks"
  ON site_tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

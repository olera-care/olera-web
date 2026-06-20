-- 114_archived_question_providers.sql
--
-- Provider-level "stop the questions" list for the admin Questions queue.
-- A provider_id listed here is archived FOR Q&A ONLY:
--   1. Its existing questions are bulk-moved to status='archived' when archived.
--   2. New questions submitted for it (app/api/questions/route.ts) are inserted
--      directly as status='archived', is_public=false, and skip the provider
--      notification email — so they never enter the QA queue.
--
-- Why this exists: the QA team (front-line on /admin/questions) kept re-clearing
-- new questions for providers they'd already decided to stop working — a manual
-- treadmill. Archiving the PROVIDER (not each question) ends it.
--
-- Why a dedicated table (not a provider metadata flag): the existing
-- business_profiles.metadata.admin_archived flag only covers providers that HAVE
-- a business_profile. Most queue providers are olera-providers-only, and that
-- table has no metadata column. Keying on the literal provider_id string the
-- question was submitted under works for BOTH, and matches whatever id the
-- provider page / question row already uses.
--
-- Q&A-scoped by design: this does NOT touch admin_archived, so nudges, lead
-- routing, welcome/re-engagement emails, and connection routing are unaffected.
-- Full provider archive remains a separate directory action.
--
-- Reversible: delete the row(s) to resume normal Q&A intake. Already-archived
-- questions stay archived (restore them individually if needed). Audited via
-- archived_by + reason.

CREATE TABLE IF NOT EXISTS archived_question_providers (
  provider_id  TEXT PRIMARY KEY,                          -- literal provider_id as submitted (slug or legacy id)
  reason       TEXT,                                       -- free-text reason (optional)
  notes        TEXT,                                       -- additional context (optional)
  archived_by  TEXT,                                       -- admin email / actor who archived it
  archived_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE archived_question_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on archived_question_providers"
  ON archived_question_providers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE archived_question_providers IS
  'Q&A-scoped provider archive list. A provider_id here has its existing questions archived and all new questions auto-archived (app/api/questions/route.ts) so they never reach the /admin/questions queue. Keyed by literal provider_id string so it covers both business_profiles and olera-providers-only providers. Does NOT set admin_archived — leaves nudges/leads/connections untouched. Reversible: delete the row.';

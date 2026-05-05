-- Migration: accounts.session_id
--
-- Context: The Family Intake A/B test stores an anonymous session_id on
-- every event (provider_activity, seeker_activity) so the funnel can
-- dedupe and segment. When a session reaches the Submitted stage,
-- /api/benefits/save-results creates an `accounts` row — but until now
-- nothing wrote the session_id onto that row. That broke the
-- session→email link, so the admin drill-in could only match
-- "approximately one of these sessions submitted" via close-timestamp
-- heuristics. Adding the column gives us an exact join.
--
-- Existing rows (created before this migration lands) stay NULL and
-- show "—" for session linkage in the admin drill-in. Acceptable: the
-- drill-in is a forward-looking tool; historical rows weren't going to
-- be drillable anyway.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS session_id TEXT NULL;

-- Partial index — most rows pre-migration are NULL, and we'll only ever
-- look up "give me the account row for this session_id" when session_id
-- is set. Keeps the index small.
CREATE INDEX IF NOT EXISTS accounts_session_id_idx
  ON accounts (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN accounts.session_id IS
  'Anonymous session identifier (lib/analytics/session.ts) of the visitor at the moment they submitted the SBF intake. Populated by /api/benefits/save-results. Joins to provider_activity.metadata.session_id and seeker_activity.metadata.session_id so the admin drill-in can show the same session''s journey across impression → started → submitted.';

-- Outreach arm parallels: agent_outreach_requests stores the submission
-- but didn't track session_id, so the same drill-in for the outreach
-- 4th-arm couldn't join request → impressions. Same column, same shape.
ALTER TABLE agent_outreach_requests
  ADD COLUMN IF NOT EXISTS session_id TEXT NULL;

CREATE INDEX IF NOT EXISTS agent_outreach_requests_session_id_idx
  ON agent_outreach_requests (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN agent_outreach_requests.session_id IS
  'Anonymous session identifier of the visitor when they submitted the outreach request. Populated by /api/outreach/request. Joins to seeker_activity events to reconstruct the impression → card click → submission journey for the admin drill-in.';

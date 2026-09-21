-- ===========================================================================
-- 239 — medjobs_scripts
-- ===========================================================================
-- The master scripts and email copy, in one place everyone can edit.
--
-- It used to live in lib/medjobs/ladders.ts, shown inline on a task behind a
-- "Show suggested call script and email copy" toggle. That put the copy where
-- only someone who could commit to the repo could improve it, and repeated it
-- on every rung's screen rather than anywhere you could read end to end or
-- train somebody from.
--
-- So the copy moves here and the task links to it. One row per rung, plus
-- rows for the situations no rung covers — the front desk, the voicemail,
-- the price question, the reply that says yes. `notes` is the part that
-- grows: what worked, what they asked, what to say next time.
--
-- Access is through the service client, which bypasses RLS, the same as
-- every other admin-only table here. RLS is on so the anon key reads nothing.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS medjobs_scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The anchor a task deep-links to. Stable: renaming a rung's title must
  -- not break every link into the document.
  slug          TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL CHECK (kind IN ('rung', 'situation')),
  -- Which ladder, and which rung on it. Null on a situation.
  section       TEXT,
  rung_key      TEXT,
  title         TEXT NOT NULL,
  call_script   TEXT,
  email_subject TEXT,
  email_body    TEXT,
  -- What we have learned. Common questions, what worked, what not to say.
  -- The reason the document is a table and not a file.
  notes         TEXT,
  position      INT NOT NULL DEFAULT 0,
  updated_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per rung, so a second seed run cannot double the document.
CREATE UNIQUE INDEX IF NOT EXISTS uq_medjobs_scripts_rung
  ON medjobs_scripts (section, rung_key)
  WHERE kind = 'rung';

CREATE INDEX IF NOT EXISTS idx_medjobs_scripts_position
  ON medjobs_scripts (position);

ALTER TABLE medjobs_scripts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_scripts IS
  'The master call scripts, email copy and situation notes for MedJobs. '
  'One row per ladder rung plus one per situation no rung covers. Edited '
  'from /admin/medjobs/sop/scripts, and linked from every task. Seeded by '
  'the API from lib/medjobs/ladders.ts, so a new rung gets a section with '
  'nothing to remember.';


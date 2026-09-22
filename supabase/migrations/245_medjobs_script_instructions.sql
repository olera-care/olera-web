-- ===========================================================================
-- 245 — instructions, a video, and a way to suggest a better way
-- ===========================================================================
-- The scripts document becomes the whole reference for a step, not just the
-- words to say. A task screen now carries no instructions of its own: it
-- links here, and what is written here is what the operator reads.
--
-- Which means this text has to be editable by the people doing the work,
-- and it has to be improvable without waiting for anyone. Hence the
-- suggestions table: anybody raises one against a section, any admin
-- resolves it.
-- ===========================================================================

ALTER TABLE medjobs_scripts
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS video_url    TEXT;

COMMENT ON COLUMN medjobs_scripts.instructions IS
  'What to do on this step and why. Seeded from the rung what/why/steps, '
  'then owned by whoever edits it.';

COMMENT ON COLUMN medjobs_scripts.video_url IS
  'A YouTube link walking through this step.';

CREATE TABLE IF NOT EXISTS medjobs_script_suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The section it is about. Null when somebody is proposing a new step
  -- rather than changing an existing one.
  script_slug  TEXT REFERENCES medjobs_scripts(slug) ON DELETE CASCADE,
  kind         TEXT NOT NULL DEFAULT 'improvement'
                 CHECK (kind IN ('improvement', 'new_step')),
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'accepted', 'declined')),
  -- What the reviewer said back. The point of a queue is that raising
  -- something gets an answer, not that it disappears.
  response     TEXT,
  raised_by    UUID,
  raised_email TEXT,
  raised_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by  UUID,
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_medjobs_script_suggestions_open
  ON medjobs_script_suggestions (raised_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_medjobs_script_suggestions_slug
  ON medjobs_script_suggestions (script_slug);

ALTER TABLE medjobs_script_suggestions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_script_suggestions IS
  'Process improvements raised against a step. Anyone with admin access can '
  'raise one and anyone with admin access can resolve it.';

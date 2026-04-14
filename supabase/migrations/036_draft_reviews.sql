-- Review status and comments for pipeline-generated content drafts
CREATE TABLE IF NOT EXISTS draft_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  state_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'published', 'needs-changes')),
  comment TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_reviews_program ON draft_reviews(program_id);
CREATE INDEX IF NOT EXISTS idx_draft_reviews_state ON draft_reviews(state_id);

-- No RLS — admin-only table, accessed via service role key from admin pages

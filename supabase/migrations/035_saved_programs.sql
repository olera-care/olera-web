-- Saved benefit programs for care seekers
-- Lightweight table: user saves a waiver-library program ID for later reference
CREATE TABLE IF NOT EXISTS saved_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  state_id TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  program_type TEXT,
  savings_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_saved_programs_user_id ON saved_programs(user_id);

-- RLS: users can only see/modify their own saves
ALTER TABLE saved_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved programs"
  ON saved_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save programs"
  ON saved_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave programs"
  ON saved_programs FOR DELETE
  USING (auth.uid() = user_id);

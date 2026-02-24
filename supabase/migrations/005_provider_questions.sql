-- Provider Questions (Asked Questions)
-- Caregivers ask questions on provider pages. Admins moderate. Providers answer.
-- NEW TABLE — does not alter any existing shared tables.

CREATE TABLE IF NOT EXISTS provider_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,           -- olera-providers.provider_id
  asker_name TEXT NOT NULL,            -- Display name of person asking
  asker_email TEXT,                    -- Email for notification (optional)
  asker_user_id UUID,                 -- auth.users.id if logged in
  question TEXT NOT NULL,
  answer TEXT,                         -- Provider's response (null until answered)
  answered_by UUID,                   -- business_profiles.id of who answered
  answered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'answered', 'rejected', 'flagged')),
  is_public BOOLEAN NOT NULL DEFAULT false,  -- Visible on provider page only when true
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_provider_questions_provider ON provider_questions(provider_id);
CREATE INDEX idx_provider_questions_status ON provider_questions(status);
CREATE INDEX idx_provider_questions_user ON provider_questions(asker_user_id);

-- RLS: Enable but allow service role to bypass
ALTER TABLE provider_questions ENABLE ROW LEVEL SECURITY;

-- Public can read approved/answered questions
CREATE POLICY "Public can read public questions"
  ON provider_questions FOR SELECT
  USING (is_public = true AND status IN ('approved', 'answered'));

-- Authenticated users can insert questions
CREATE POLICY "Authenticated users can ask questions"
  ON provider_questions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own questions regardless of status
CREATE POLICY "Users can view own questions"
  ON provider_questions FOR SELECT
  USING (asker_user_id = auth.uid());

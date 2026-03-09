-- Add user_id to disputes so we can authenticate and rate-limit submissions
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes (user_id);

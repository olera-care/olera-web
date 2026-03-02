-- Simple table to collect "Notify me" emails on Coming Soon pages
CREATE TABLE IF NOT EXISTS feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,          -- e.g. 'reviews', 'qna'
  email text NOT NULL,
  profile_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feature, email)
);

-- RLS: anyone can insert their own email, only admins can read
ALTER TABLE feature_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to waitlist"
  ON feature_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own waitlist entries"
  ON feature_waitlist FOR SELECT
  USING (email = auth.jwt() ->> 'email');

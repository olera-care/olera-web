-- Enable RLS on disputes table and add access policies
-- The disputes API uses the service role for inserts, but we need RLS
-- to prevent direct client-side reads of all disputes.

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Users can view their own disputes
CREATE POLICY "Users can view own disputes" ON disputes
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert disputes (enforced via API, but belt-and-suspenders)
CREATE POLICY "Users can insert own disputes" ON disputes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Service role bypasses RLS for admin access
CREATE POLICY "Service role can manage disputes" ON disputes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

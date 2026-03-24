-- Email audit log: tracks every email sent through Resend
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id TEXT,
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'Olera <noreply@olera.care>',
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'unknown',
  recipient_type TEXT,
  provider_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  html_body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log(recipient);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_provider_id ON email_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient_type ON email_log(recipient_type);

-- RLS: service role only (no public access)
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_log"
  ON email_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

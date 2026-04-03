-- WhatsApp audit log: tracks every WhatsApp message sent through Twilio
CREATE TABLE IF NOT EXISTS whatsapp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_sid TEXT,
  recipient TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'unknown',
  content_sid TEXT,
  recipient_type TEXT,
  profile_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_recipient ON whatsapp_log(recipient);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_message_type ON whatsapp_log(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_created_at ON whatsapp_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_profile_id ON whatsapp_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_status ON whatsapp_log(status);

-- RLS: service role only (no public access)
ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on whatsapp_log"
  ON whatsapp_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

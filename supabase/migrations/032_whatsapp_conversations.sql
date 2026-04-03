-- WhatsApp conversation state machine for seeker enrichment flow.
-- Tracks multi-message conversations triggered after connection requests.
-- Phone is the primary lookup key (Twilio inbound only knows sender phone).

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  phone TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'sent_q1_recipient',
  care_recipient TEXT,
  care_needs_text TEXT,
  urgency TEXT,
  provider_name TEXT,
  provider_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Primary lookup: find active conversation by inbound phone number
CREATE INDEX IF NOT EXISTS idx_wa_conv_phone ON whatsapp_conversations(phone);

-- Find active (non-complete) conversations efficiently
CREATE INDEX IF NOT EXISTS idx_wa_conv_active ON whatsapp_conversations(phone, created_at DESC)
  WHERE state != 'complete';

-- Lookup by connection for enrichment display
CREATE INDEX IF NOT EXISTS idx_wa_conv_connection ON whatsapp_conversations(connection_id);

-- RLS: service role only (webhook + server-side orchestrator)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on whatsapp_conversations"
  ON whatsapp_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

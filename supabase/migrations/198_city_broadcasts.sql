-- Migration: city broadcasts system
--
-- WHY
-- When family activity (questions asked, profiles published) occurs in a city,
-- we want to notify dormant providers in that city to show them families are
-- actively looking for care. This encourages providers to claim their profiles.
--
-- This migration creates two tables:
--   - city_broadcast_events: tracks each trigger event (question/profile)
--   - city_broadcast_recipients: tracks each provider notification attempt
--
-- Idempotent: safe to re-run.

-- Events table (tracks each trigger)
CREATE TABLE IF NOT EXISTS city_broadcast_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('question_asked', 'profile_published')),
  event_id UUID NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'skipped')),
  skip_reason TEXT,
  providers_eligible INT DEFAULT 0,
  providers_sent INT DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipients table (tracks each provider notification)
CREATE TABLE IF NOT EXISTS city_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES city_broadcast_events(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  skip_reason TEXT,
  email_log_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_city_broadcast_events_status ON city_broadcast_events(status);
CREATE INDEX IF NOT EXISTS idx_city_broadcast_events_created_at ON city_broadcast_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_broadcast_events_city ON city_broadcast_events(city);
CREATE INDEX IF NOT EXISTS idx_city_broadcast_events_event_id ON city_broadcast_events(event_id);

CREATE INDEX IF NOT EXISTS idx_city_broadcast_recipients_event_id ON city_broadcast_recipients(event_id);
CREATE INDEX IF NOT EXISTS idx_city_broadcast_recipients_provider_id ON city_broadcast_recipients(provider_id);
CREATE INDEX IF NOT EXISTS idx_city_broadcast_recipients_status ON city_broadcast_recipients(status);

-- RLS policies (admin only via service role, no direct user access)
ALTER TABLE city_broadcast_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- No public policies - these tables are accessed only via service role

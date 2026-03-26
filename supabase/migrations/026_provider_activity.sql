-- Migration: Provider Activity Tracking
-- Tracks provider engagement events (email clicks, page views, etc.)
-- Used by the admin Activity Center to identify conversion-ready providers

CREATE TABLE IF NOT EXISTS provider_activity (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id     TEXT NOT NULL,
  profile_id      UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'email_click', 'page_view', 'lead_opened', 'question_responded', 'review_viewed'
  )),
  email_log_id    UUID,
  email_type      TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Primary query pattern: admin Activity Center feed (recent events)
CREATE INDEX idx_provider_activity_created_at ON provider_activity (created_at DESC);

-- Provider-level aggregation (Activity Center providers view)
CREATE INDEX idx_provider_activity_provider_id ON provider_activity (provider_id);

-- Filter by event type
CREATE INDEX idx_provider_activity_event_type ON provider_activity (event_type);

-- Filter by email type (connection_request, question_received, new_review)
CREATE INDEX idx_provider_activity_email_type ON provider_activity (email_type);

-- Join to business_profiles for claimed providers
CREATE INDEX idx_provider_activity_profile_id ON provider_activity (profile_id);

-- Composite: provider + time for per-provider timeline queries
CREATE INDEX idx_provider_activity_provider_created ON provider_activity (provider_id, created_at DESC);

-- Enable RLS — service role only (like email_log)
ALTER TABLE provider_activity ENABLE ROW LEVEL SECURITY;

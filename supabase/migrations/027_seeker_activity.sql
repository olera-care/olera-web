-- Migration: Care Seeker Activity Tracking
-- Tracks family/care seeker engagement events (connections, profile enrichment, email clicks, etc.)
-- Used by the admin Activity Center (Families tab) to identify engaged families
-- Parallel to provider_activity (026) but keyed on business_profiles.id

CREATE TABLE IF NOT EXISTS seeker_activity (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id          UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL CHECK (event_type IN (
    'connection_sent', 'profile_enriched', 'email_click',
    'question_asked', 'matches_activated'
  )),
  email_log_id        UUID,
  email_type          TEXT,
  related_provider_id TEXT,            -- which provider was involved (slug or olera-providers ID)
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Primary query pattern: admin Activity Center feed (recent events)
CREATE INDEX idx_seeker_activity_created_at ON seeker_activity (created_at DESC);

-- Per-person aggregation (Activity Center families view)
CREATE INDEX idx_seeker_activity_profile_id ON seeker_activity (profile_id);

-- Per-person timeline (profile detail drill-down)
CREATE INDEX idx_seeker_activity_profile_created ON seeker_activity (profile_id, created_at DESC);

-- Filter by event type
CREATE INDEX idx_seeker_activity_event_type ON seeker_activity (event_type);

-- Filter by email type (for email_click events)
CREATE INDEX idx_seeker_activity_email_type ON seeker_activity (email_type);

-- Enable RLS — service role only (like provider_activity and email_log)
ALTER TABLE seeker_activity ENABLE ROW LEVEL SECURITY;

-- Migration: page_events table
--
-- Context: Lightweight event tracking for standalone pages (not tied to a
-- specific provider). Initial use case: Young Caregivers page engagement
-- funnel — page views, scroll depth, time on page, section visibility,
-- and Discord join clicks.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS page_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page        text NOT NULL,
  event_type  text NOT NULL,
  session_id  text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT page_events_event_type_check
    CHECK (event_type IN (
      'page_view',
      'scroll_depth',
      'section_visible',
      'time_on_page',
      'discord_join_clicked'
    ))
);

-- Index for admin dashboard queries (page + date range)
CREATE INDEX idx_page_events_page_created
  ON page_events (page, created_at DESC);

-- Index for funnel queries (page + event_type + date range)
CREATE INDEX idx_page_events_funnel
  ON page_events (page, event_type, created_at DESC);

-- RLS: service-role inserts only (no public access)
ALTER TABLE page_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE page_events IS
  'Lightweight event tracking for standalone pages. Not provider-scoped. See migration 082.';

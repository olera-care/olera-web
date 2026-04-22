-- Migration: Provider Analytics Phase 0 — extend event_type CHECK + page_view dedup index
--
-- Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
-- Plan: plans/provider-analytics-phase-0-instrumentation-plan.md
--
-- Adds four new provider_activity event types needed for Phase 0 instrumentation:
--   - lead_received        (fired when a connection/lead row is created)
--   - review_received      (fired when a review is published)
--   - search_click         (fired when a care seeker clicks a provider card from search/browse)
--   - cta_click_public     (fired when a care seeker clicks a CTA on the public provider page)
--
-- Also adds a partial index on (provider_id, created_at, session_id-from-metadata) for
-- fast nightly dedup aggregation: COUNT(DISTINCT metadata->>'session_id') per provider per day.
--
-- Additive and safe per CLAUDE.md. Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;
ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click',
    'page_view',
    'lead_opened',
    'lead_received',
    'question_received',
    'question_responded',
    'review_viewed',
    'review_received',
    'one_click_access',
    'contact_revealed',
    'reviews_cta_clicked',
    'suspicious_claim',
    'search_click',
    'cta_click_public'
  ));

CREATE INDEX IF NOT EXISTS idx_provider_activity_pageview_dedup
  ON provider_activity (provider_id, created_at, (metadata->>'session_id'))
  WHERE event_type = 'page_view';

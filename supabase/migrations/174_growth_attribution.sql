-- Migration 174: first-party growth attribution
--
-- One event vocabulary connects an organic landing to the CTA experience and
-- a server-confirmed Olera outcome. GA4 remains the traffic/reconciliation
-- source; this table exists because aggregate GA4 users cannot be joined to an
-- individual inquiry or benefits intake.

CREATE TABLE IF NOT EXISTS growth_attribution_events (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anonymous_id      text NOT NULL,
  visit_id          text NOT NULL,
  subject_id        text,
  event_type        text NOT NULL CHECK (event_type IN (
    'page_landed',
    'cta_visible',
    'cta_engaged',
    'lead_started',
    'lead_created',
    'contact_intent'
  )),
  page_path         text NOT NULL,
  page_category     text NOT NULL CHECK (page_category IN ('provider', 'benefit', 'editorial')),
  cta_id            text,
  cta_surface       text,
  conversion_type   text,
  conversion_id     text,
  traffic_channel   text CHECK (traffic_channel IS NULL OR traffic_channel IN (
    'organic_search',
    'paid_search',
    'direct',
    'referral',
    'social',
    'ai_chat',
    'olera_internal',
    'other'
  )),
  metadata          jsonb NOT NULL DEFAULT '{}',
  occurred_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_attribution_page_time
  ON growth_attribution_events (page_path, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_attribution_visitor_time
  ON growth_attribution_events (anonymous_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_attribution_visit
  ON growth_attribution_events (anonymous_id, visit_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_growth_attribution_event_time
  ON growth_attribution_events (event_type, occurred_at DESC);

-- Provider inquiries use the connection id and benefits completions use the
-- persisted seeker_activity id. Retried analytics writes must not create two
-- opportunities for one domain record.
CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_attribution_conversion_unique
  ON growth_attribution_events (conversion_type, conversion_id);

ALTER TABLE growth_attribution_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE growth_attribution_events IS
  'First-party organic landing → CTA → confirmed lead attribution for provider, benefit, and editorial pages. Service-role only.';
COMMENT ON COLUMN growth_attribution_events.anonymous_id IS
  'Sliding 30-day anonymous browser identifier. Historical code calls this session_id.';
COMMENT ON COLUMN growth_attribution_events.visit_id IS
  'Thirty-minute visit identifier used for same-visit conversion rates.';
COMMENT ON COLUMN growth_attribution_events.subject_id IS
  'Stable family/profile identifier when known; anonymous_id is the fallback for unique-family counts.';

-- Per-page decision metrics. A conversion is credited to the organic landing
-- in the same visit when available, otherwise the most recent organic landing
-- by the same anonymous visitor within seven days. The conversion page itself
-- determines whether that credit is direct or assisted.
CREATE OR REPLACE FUNCTION get_growth_attribution_pages(p_from date, p_to date)
RETURNS TABLE (
  page_path text,
  page_category text,
  tracked_organic_visits bigint,
  cta_views bigint,
  cta_engagements bigint,
  lead_starts bigint,
  unique_families bigint,
  opportunities bigint,
  direct_leads bigint,
  assisted_leads bigint,
  contact_intents bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH organic_visits AS (
    SELECT DISTINCT ON (e.anonymous_id, e.visit_id)
      e.anonymous_id,
      e.visit_id,
      e.page_path,
      e.page_category,
      e.occurred_at
    FROM growth_attribution_events e
    WHERE e.event_type = 'page_landed'
      AND e.traffic_channel = 'organic_search'
      AND e.occurred_at >= (p_from::timestamptz - interval '7 days')
      AND e.occurred_at < ((p_to + 1)::timestamptz)
    ORDER BY e.anonymous_id, e.visit_id, e.occurred_at ASC
  ), reporting_visits AS (
    SELECT *
    FROM organic_visits v
    WHERE (v.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), activity AS (
    SELECT
      v.page_path,
      v.page_category,
      COUNT(DISTINCT (v.anonymous_id, v.visit_id))::bigint AS tracked_organic_visits,
      COUNT(DISTINCT (e.anonymous_id, e.visit_id)) FILTER (WHERE e.event_type = 'cta_visible')::bigint AS cta_views,
      COUNT(DISTINCT (e.anonymous_id, e.visit_id)) FILTER (WHERE e.event_type = 'cta_engaged')::bigint AS cta_engagements,
      COUNT(DISTINCT (e.anonymous_id, e.visit_id)) FILTER (WHERE e.event_type = 'lead_started')::bigint AS lead_starts,
      COUNT(e.id) FILTER (WHERE e.event_type = 'contact_intent')::bigint AS contact_intents
    FROM reporting_visits v
    LEFT JOIN growth_attribution_events e
      ON e.anonymous_id = v.anonymous_id
      AND e.visit_id = v.visit_id
      AND e.page_path = v.page_path
      AND e.occurred_at >= v.occurred_at
    GROUP BY v.page_path, v.page_category
  ), conversions AS (
    SELECT e.*
    FROM growth_attribution_events e
    WHERE e.event_type = 'lead_created'
      AND (e.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), attributed AS (
    SELECT
      c.*,
      landing.page_path AS landing_page_path,
      landing.page_category AS landing_page_category,
      landing.occurred_at AS landing_occurred_at
    FROM conversions c
    JOIN LATERAL (
      SELECT v.page_path, v.page_category, v.occurred_at
      FROM organic_visits v
      WHERE v.anonymous_id = c.anonymous_id
        AND v.occurred_at <= c.occurred_at
        AND v.occurred_at >= c.occurred_at - interval '7 days'
      ORDER BY (v.visit_id = c.visit_id) DESC, v.occurred_at DESC
      LIMIT 1
    ) landing ON true
    WHERE (landing.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), outcomes AS (
    SELECT
      a.landing_page_path AS page_path,
      a.landing_page_category AS page_category,
      COUNT(DISTINCT COALESCE(a.subject_id, a.anonymous_id))::bigint AS unique_families,
      COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text))::bigint AS opportunities,
      COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text)) FILTER (WHERE a.page_path = a.landing_page_path)::bigint AS direct_leads,
      COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text)) FILTER (WHERE a.page_path <> a.landing_page_path)::bigint AS assisted_leads
    FROM attributed a
    GROUP BY a.landing_page_path, a.landing_page_category
  ), keys AS (
    SELECT a.page_path, a.page_category FROM activity a
    UNION
    SELECT o.page_path, o.page_category FROM outcomes o
  )
  SELECT
    k.page_path,
    k.page_category,
    COALESCE(a.tracked_organic_visits, 0),
    COALESCE(a.cta_views, 0),
    COALESCE(a.cta_engagements, 0),
    COALESCE(a.lead_starts, 0),
    COALESCE(o.unique_families, 0),
    COALESCE(o.opportunities, 0),
    COALESCE(o.direct_leads, 0),
    COALESCE(o.assisted_leads, 0),
    COALESCE(a.contact_intents, 0)
  FROM keys k
  LEFT JOIN activity a USING (page_path, page_category)
  LEFT JOIN outcomes o USING (page_path, page_category);
$$;

-- Exact overall/category totals. Unique families are calculated here rather
-- than summed from page rows because one family can legitimately appear on
-- more than one landing page.
CREATE OR REPLACE FUNCTION get_growth_attribution_summary(p_from date, p_to date)
RETURNS TABLE (
  scope text,
  tracked_organic_visits bigint,
  unique_families bigint,
  opportunities bigint,
  direct_leads bigint,
  assisted_leads bigint,
  cta_engagements bigint,
  contact_intents bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH organic_visits AS (
    SELECT DISTINCT ON (e.anonymous_id, e.visit_id)
      e.anonymous_id, e.visit_id, e.page_path, e.page_category, e.occurred_at
    FROM growth_attribution_events e
    WHERE e.event_type = 'page_landed'
      AND e.traffic_channel = 'organic_search'
      AND e.occurred_at >= (p_from::timestamptz - interval '7 days')
      AND e.occurred_at < ((p_to + 1)::timestamptz)
    ORDER BY e.anonymous_id, e.visit_id, e.occurred_at ASC
  ), reporting_visits AS (
    SELECT * FROM organic_visits v
    WHERE (v.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), conversions AS (
    SELECT e.* FROM growth_attribution_events e
    WHERE e.event_type = 'lead_created'
      AND (e.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), attributed AS (
    SELECT c.*, l.page_path AS landing_page_path, l.page_category AS landing_page_category,
      l.occurred_at AS landing_occurred_at
    FROM conversions c
    JOIN LATERAL (
      SELECT v.page_path, v.page_category, v.occurred_at
      FROM organic_visits v
      WHERE v.anonymous_id = c.anonymous_id
        AND v.occurred_at <= c.occurred_at
        AND v.occurred_at >= c.occurred_at - interval '7 days'
      ORDER BY (v.visit_id = c.visit_id) DESC, v.occurred_at DESC
      LIMIT 1
    ) l ON true
    WHERE (l.occurred_at AT TIME ZONE 'America/Chicago')::date BETWEEN p_from AND p_to
  ), scopes AS (
    SELECT 'all'::text AS scope
    UNION ALL SELECT 'provider'
    UNION ALL SELECT 'benefit'
    UNION ALL SELECT 'editorial'
  )
  SELECT
    s.scope,
    (SELECT COUNT(DISTINCT (v.anonymous_id, v.visit_id))
      FROM reporting_visits v
      WHERE s.scope = 'all' OR v.page_category = s.scope)::bigint,
    (SELECT COUNT(DISTINCT COALESCE(a.subject_id, a.anonymous_id))
      FROM attributed a
      WHERE s.scope = 'all' OR a.landing_page_category = s.scope)::bigint,
    (SELECT COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text))
      FROM attributed a
      WHERE s.scope = 'all' OR a.landing_page_category = s.scope)::bigint,
    (SELECT COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text))
      FROM attributed a
      WHERE (s.scope = 'all' OR a.landing_page_category = s.scope)
        AND a.page_path = a.landing_page_path)::bigint,
    (SELECT COUNT(DISTINCT COALESCE(a.conversion_id, a.id::text))
      FROM attributed a
      WHERE (s.scope = 'all' OR a.landing_page_category = s.scope)
        AND a.page_path <> a.landing_page_path)::bigint,
    (SELECT COUNT(DISTINCT (e.anonymous_id, e.visit_id))
      FROM reporting_visits v
      JOIN growth_attribution_events e
        ON e.anonymous_id = v.anonymous_id AND e.visit_id = v.visit_id
        AND e.page_path = v.page_path AND e.event_type = 'cta_engaged'
      WHERE s.scope = 'all' OR v.page_category = s.scope)::bigint,
    (SELECT COUNT(e.id)
      FROM reporting_visits v
      JOIN growth_attribution_events e
        ON e.anonymous_id = v.anonymous_id AND e.visit_id = v.visit_id
        AND e.page_path = v.page_path AND e.event_type = 'contact_intent'
      WHERE s.scope = 'all' OR v.page_category = s.scope)::bigint
  FROM scopes s;
$$;

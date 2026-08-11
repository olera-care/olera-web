-- Migration 173: page-level organic growth drivers
--
-- One row is one canonical public page in one Sunday-Saturday reporting week.
-- The weekly snapshot remains the headline record; this table provides the
-- drill-down needed to explain which provider, benefit, and editorial pages
-- produced the movement.

CREATE TABLE IF NOT EXISTS growth_page_metrics (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_start          date NOT NULL,
  page_path           text NOT NULL,
  page_category       text NOT NULL
    CHECK (page_category IN ('provider', 'benefit', 'editorial')),
  organic_users       integer NOT NULL DEFAULT 0 CHECK (organic_users >= 0),
  organic_sessions    integer NOT NULL DEFAULT 0 CHECK (organic_sessions >= 0),
  search_clicks       integer NOT NULL DEFAULT 0 CHECK (search_clicks >= 0),
  search_impressions  integer NOT NULL DEFAULT 0 CHECK (search_impressions >= 0),
  search_ctr          double precision NOT NULL DEFAULT 0 CHECK (search_ctr >= 0 AND search_ctr <= 1),
  search_position     double precision,
  collected_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_page_metrics_week_page_unique UNIQUE (week_start, page_path),
  CONSTRAINT growth_page_metrics_snapshot_fk
    FOREIGN KEY (week_start) REFERENCES growth_metric_snapshots (week_start) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_growth_page_metrics_category_week
  ON growth_page_metrics (page_category, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_growth_page_metrics_week_users
  ON growth_page_metrics (week_start DESC, organic_users DESC);

ALTER TABLE growth_page_metrics ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE growth_page_metrics IS
  'Weekly GA4 Organic Search landing and Search Console performance for canonical provider, benefit, and editorial pages. Server-side only.';

-- Aggregate the selected reporting window while retaining category totals.
-- The result contains the union of each category's top user, click, and
-- impression pages so both leaders and SEO opportunities survive the limit.
CREATE OR REPLACE FUNCTION get_growth_page_performance(
  p_from date,
  p_to date,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  page_path text,
  page_category text,
  organic_users bigint,
  organic_sessions bigint,
  search_clicks bigint,
  search_impressions bigint,
  search_ctr double precision,
  search_position double precision,
  category_organic_users numeric,
  category_organic_sessions numeric,
  category_search_clicks numeric,
  category_search_impressions numeric,
  weeks_present bigint,
  first_week date,
  last_week date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH aggregated AS (
    SELECT
      m.page_path,
      m.page_category,
      SUM(m.organic_users)::bigint AS organic_users,
      SUM(m.organic_sessions)::bigint AS organic_sessions,
      SUM(m.search_clicks)::bigint AS search_clicks,
      SUM(m.search_impressions)::bigint AS search_impressions,
      CASE WHEN SUM(m.search_impressions) > 0
        THEN SUM(m.search_clicks)::double precision / SUM(m.search_impressions)
        ELSE 0
      END AS search_ctr,
      CASE WHEN SUM(m.search_impressions) > 0
        THEN SUM(COALESCE(m.search_position, 0) * m.search_impressions)::double precision
          / SUM(m.search_impressions)
        ELSE NULL
      END AS search_position,
      COUNT(DISTINCT m.week_start)::bigint AS weeks_present,
      MIN(m.week_start) AS first_week,
      MAX(m.week_start) AS last_week
    FROM growth_page_metrics m
    WHERE m.week_start BETWEEN p_from AND p_to
    GROUP BY m.page_path, m.page_category
  ), ranked AS (
    SELECT
      a.*,
      SUM(a.organic_users) OVER (PARTITION BY a.page_category) AS category_organic_users,
      SUM(a.organic_sessions) OVER (PARTITION BY a.page_category) AS category_organic_sessions,
      SUM(a.search_clicks) OVER (PARTITION BY a.page_category) AS category_search_clicks,
      SUM(a.search_impressions) OVER (PARTITION BY a.page_category) AS category_search_impressions,
      ROW_NUMBER() OVER (PARTITION BY a.page_category ORDER BY a.organic_users DESC, a.page_path) AS users_rank,
      ROW_NUMBER() OVER (PARTITION BY a.page_category ORDER BY a.search_clicks DESC, a.page_path) AS clicks_rank,
      ROW_NUMBER() OVER (PARTITION BY a.page_category ORDER BY a.search_impressions DESC, a.page_path) AS impressions_rank
    FROM aggregated a
  )
  SELECT
    r.page_path,
    r.page_category,
    r.organic_users,
    r.organic_sessions,
    r.search_clicks,
    r.search_impressions,
    r.search_ctr,
    r.search_position,
    r.category_organic_users,
    r.category_organic_sessions,
    r.category_search_clicks,
    r.category_search_impressions,
    r.weeks_present,
    r.first_week,
    r.last_week
  FROM ranked r
  WHERE r.users_rank <= GREATEST(5, LEAST(p_limit, 100))
     OR r.clicks_rank <= GREATEST(5, LEAST(p_limit, 100))
     OR r.impressions_rank <= GREATEST(5, LEAST(p_limit, 100));
$$;
CREATE OR REPLACE FUNCTION get_growth_category_trend(p_from date, p_to date)
RETURNS TABLE (
  week_start date,
  page_category text,
  organic_users bigint,
  search_clicks bigint,
  search_impressions bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    m.week_start,
    m.page_category,
    SUM(m.organic_users)::bigint,
    SUM(m.search_clicks)::bigint,
    SUM(m.search_impressions)::bigint
  FROM growth_page_metrics m
  WHERE m.week_start BETWEEN p_from AND p_to
  GROUP BY m.week_start, m.page_category
  ORDER BY m.week_start, m.page_category;
$$;

-- Migration: Provider Analytics Phase 0 — daily aggregation tables
--
-- Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
-- Plan: plans/provider-analytics-phase-0-instrumentation-plan.md
--
-- Two tables populated by /api/cron/aggregate-provider-views (runs nightly 8 AM UTC):
--
--   provider_page_view_stats        — per-provider per-day rollup of raw + unique views,
--                                      enriched with city/state/category for fast benchmark joins.
--
--   city_category_view_benchmarks   — per-(date, city, state, category) peer aggregates
--                                      (avg, p50, p90, provider_count) so a per-provider
--                                      "what's MY peer average" lookup is a single-row scan.
--
-- RLS service-role only for Phase 0. Phase 1 will add provider-owner read policies once
-- the dashboard exists.
--
-- Additive and safe per CLAUDE.md. Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS provider_page_view_stats (
  provider_id        TEXT        NOT NULL,
  date               DATE        NOT NULL,
  raw_view_count     INT         NOT NULL DEFAULT 0,
  unique_view_count  INT         NOT NULL DEFAULT 0,
  city               TEXT,
  state              TEXT,
  category           TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, date)
);

CREATE INDEX IF NOT EXISTS idx_provider_page_view_stats_city_category_date
  ON provider_page_view_stats (city, category, date DESC);

CREATE INDEX IF NOT EXISTS idx_provider_page_view_stats_state_category_date
  ON provider_page_view_stats (state, category, date DESC);

CREATE INDEX IF NOT EXISTS idx_provider_page_view_stats_date
  ON provider_page_view_stats (date DESC);

ALTER TABLE provider_page_view_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS city_category_view_benchmarks (
  date            DATE        NOT NULL,
  city            TEXT        NOT NULL DEFAULT '',
  state           TEXT        NOT NULL DEFAULT '',
  category        TEXT        NOT NULL DEFAULT '',
  avg_views       NUMERIC(10, 2),
  p50_views       INT,
  p90_views       INT,
  provider_count  INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (date, city, state, category)
);

CREATE INDEX IF NOT EXISTS idx_city_category_benchmarks_lookup
  ON city_category_view_benchmarks (city, state, category, date DESC);

ALTER TABLE city_category_view_benchmarks ENABLE ROW LEVEL SECURITY;

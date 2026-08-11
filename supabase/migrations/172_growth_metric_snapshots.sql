-- Migration 172: canonical weekly growth history
--
-- One row is one immutable Sunday-Saturday observation. The row is deliberately
-- atomic: GA4, Search Console, and Olera product outcomes either describe the
-- same reporting week or nothing is written. Service-role jobs own writes;
-- authenticated admin API routes own reads.

CREATE TABLE IF NOT EXISTS growth_metric_snapshots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          date NOT NULL UNIQUE,
  week_end            date NOT NULL,
  reporting_timezone  text NOT NULL DEFAULT 'America/Chicago',
  source              text NOT NULL DEFAULT 'google_supabase'
    CHECK (source IN ('google_supabase', 'airtable_legacy')),
  definition_version  integer NOT NULL DEFAULT 1 CHECK (definition_version > 0),
  ga4                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  gsc                 jsonb,
  marketplace         jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_status       jsonb NOT NULL DEFAULT '{}'::jsonb,
  anomalies           jsonb NOT NULL DEFAULT '[]'::jsonb,
  legacy              jsonb,
  collected_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_metric_snapshots_complete_week
    CHECK (week_end = week_start + 6)
);

CREATE INDEX IF NOT EXISTS idx_growth_metric_snapshots_recent
  ON growth_metric_snapshots (week_start DESC);

ALTER TABLE growth_metric_snapshots ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE growth_metric_snapshots IS
  'Canonical, immutable weekly GA4 + GSC + Olera marketplace growth history. Read and written server-side only.';
COMMENT ON COLUMN growth_metric_snapshots.ga4 IS
  'GA4 overview and channel acquisition metrics for the reporting week.';
COMMENT ON COLUMN growth_metric_snapshots.gsc IS
  'Search Console performance, queries, and pages. Null only for an explicitly GA4-only collection.';
COMMENT ON COLUMN growth_metric_snapshots.marketplace IS
  'Olera outcomes in the same reporting window: inquiries, questions, benefits completions, and responding providers.';
COMMENT ON COLUMN growth_metric_snapshots.legacy IS
  'Original Airtable-only observations retained during the one-time history import; null for live Google/Supabase rows.';

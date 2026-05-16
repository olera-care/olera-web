-- Migration: Persistent unsubscribe store for unclaimed providers.
--
-- Background: the weekly provider digest reaches both claimed providers
-- (rows in business_profiles) and unclaimed providers (synthesized from
-- olera-providers). The opt-out for claimed providers lives at
-- business_profiles.metadata.analytics_digest_unsubscribed -- that works.
--
-- The /api/providers/unsubscribe route's olera-providers branch was
-- trying to mirror that pattern by writing to olera-providers.metadata,
-- but olera-providers has no metadata column -- the update was a silent
-- no-op. An unclaimed provider clicking Unsubscribe saw the green
-- confirmation page but kept receiving the digest every Monday.
--
-- This adds an email-keyed sibling table so unsubscribes persist for
-- providers that don't have a business_profiles row. The digest filter
-- treats membership in this table the same way it treats
-- metadata.analytics_digest_unsubscribed=true on claimed providers.
--
-- Keyed by email (not slug or provider_id) because:
--   1. The digest dedupes recipients by lowercased email, so one
--      unsubscribe should cover every identifier that resolves to it.
--   2. The same physical provider may appear under both a slug-style
--      provider_id and a legacy alphanumeric provider_id; an email-keyed
--      table catches both without needing to know which IDs alias.
--
-- RLS: service-role only (mirrors cron_runs / email_log).
--
-- Apply via the Supabase dashboard (NOT the CLI), same as 082.

CREATE TABLE IF NOT EXISTS provider_unsubscribes (
  email              TEXT NOT NULL,
  channel            TEXT NOT NULL
                       CHECK (channel IN ('leads', 'analytics_digest')),
  unsubscribed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_slug        TEXT,                              -- slug that initiated the unsubscribe (for traceback)
  source_provider_id TEXT,                              -- olera-providers.provider_id that initiated it (for traceback)
  PRIMARY KEY (email, channel)
);

-- The digest pre-fetches every email opted out of a given channel; a
-- channel-leading index supports that scan. Point lookups by (email,
-- channel) are served by the primary key.
CREATE INDEX IF NOT EXISTS idx_provider_unsubscribes_channel
  ON provider_unsubscribes (channel, email);

ALTER TABLE provider_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on provider_unsubscribes"
  ON provider_unsubscribes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE provider_unsubscribes IS
  'Email-keyed opt-out store. Written by /api/providers/unsubscribe (olera-providers branch). Read by /api/cron/weekly-provider-digest as a sibling to business_profiles.metadata.analytics_digest_unsubscribed for unclaimed providers.';

-- Short links for claim URLs (used in contact form outreach)
-- Converts long claim tokens into short 8-character codes

CREATE TABLE IF NOT EXISTS claim_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,

  -- Index for fast lookups by code
  CONSTRAINT claim_short_links_code_idx UNIQUE (code)
);

-- Index for cleanup of expired links
CREATE INDEX IF NOT EXISTS claim_short_links_expires_at_idx ON claim_short_links(expires_at);

-- Index for looking up links by provider
CREATE INDEX IF NOT EXISTS claim_short_links_provider_id_idx ON claim_short_links(provider_id);

-- RLS: Only service role can access (admin operations only)
ALTER TABLE claim_short_links ENABLE ROW LEVEL SECURITY;

-- No public access - all operations go through service role

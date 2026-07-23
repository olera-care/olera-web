-- City-level ownership for provider outreach
-- Allows assigning all providers in a city to a specific admin

CREATE TABLE IF NOT EXISTS provider_outreach_city_owners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT NOT NULL,
  city        TEXT NOT NULL,
  owner_id    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  owner_name  TEXT,  -- Denormalized for display; updated when admin changes display_name
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state, city)
);

-- Index for efficient state-level queries
CREATE INDEX IF NOT EXISTS idx_po_city_owners_state ON provider_outreach_city_owners(state);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_city_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_city_owners_updated_at ON provider_outreach_city_owners;
CREATE TRIGGER trigger_update_city_owners_updated_at
  BEFORE UPDATE ON provider_outreach_city_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_city_owners_updated_at();

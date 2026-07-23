-- Migration: Sync city owner names when admin display_name changes
-- This ensures provider_outreach_city_owners.owner_name stays in sync with admin_users.display_name

-- Function to update owner_name in city_owners when admin display_name changes
CREATE OR REPLACE FUNCTION sync_city_owner_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if display_name actually changed
  IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
    UPDATE provider_outreach_city_owners
    SET
      owner_name = NEW.display_name,
      updated_at = NOW()
    WHERE owner_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_sync_city_owner_display_name ON admin_users;

-- Create trigger on admin_users
CREATE TRIGGER trigger_sync_city_owner_display_name
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_city_owner_display_name();

-- Comment for documentation
COMMENT ON FUNCTION sync_city_owner_display_name() IS
  'Syncs provider_outreach_city_owners.owner_name when admin_users.display_name changes';

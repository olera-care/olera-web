-- Migration: Provider Outreach Email Variant Testing
--
-- Allows A/B testing of Day 0 email variants to find the best-performing
-- first email. Does NOT change the Day 0 → Day 7 timeline, only swaps
-- which content is used for Day 0.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ============================================================================
-- 1. New table: provider_outreach_variants
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_outreach_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique key for display/reference (e.g., "intro_v2_shorter")
  variant_key TEXT NOT NULL UNIQUE,

  -- Human-readable name (e.g., "Shorter Value Prop")
  name TEXT NOT NULL,

  -- Baseline variant for comparison
  is_control BOOLEAN NOT NULL DEFAULT false,

  -- Currently enrolling new providers
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Percentage of new launches to assign to this variant (0-100)
  allocation_percent INT NOT NULL DEFAULT 25
    CHECK (allocation_percent >= 0 AND allocation_percent <= 100),

  -- Template content (markdown with {placeholders})
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Denormalized stats for quick display (updated by triggers/batch jobs)
  enrolled_count INT NOT NULL DEFAULT 0,
  claimed_count INT NOT NULL DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES admin_users(id),
  notes TEXT
);

-- Index for quick lookup of active variants
CREATE INDEX IF NOT EXISTS idx_provider_outreach_variants_active
  ON provider_outreach_variants (is_active) WHERE is_active = true;

-- Service-role only (admin access via service client)
ALTER TABLE provider_outreach_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on provider_outreach_variants"
  ON provider_outreach_variants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. New columns on provider_outreach_tracking
-- ============================================================================

-- Which variant was assigned to this provider (NULL = control/default)
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES provider_outreach_variants(id);

-- Variant key for display (e.g., "intro_v2_shorter")
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS variant_key TEXT;

-- When the variant was assigned
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS variant_enrolled_at TIMESTAMPTZ;

-- Index for variant-based queries
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_variant
  ON provider_outreach_tracking (variant_id) WHERE variant_id IS NOT NULL;

-- ============================================================================
-- 3. Trigger to update enrolled_count on variants table
-- ============================================================================

CREATE OR REPLACE FUNCTION update_variant_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On insert or update of variant_id, increment/decrement counts
  IF TG_OP = 'INSERT' AND NEW.variant_id IS NOT NULL THEN
    UPDATE provider_outreach_variants
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.variant_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Decrement old variant count if changed
    IF OLD.variant_id IS DISTINCT FROM NEW.variant_id AND OLD.variant_id IS NOT NULL THEN
      UPDATE provider_outreach_variants
      SET enrolled_count = GREATEST(0, enrolled_count - 1)
      WHERE id = OLD.variant_id;
    END IF;
    -- Increment new variant count
    IF OLD.variant_id IS DISTINCT FROM NEW.variant_id AND NEW.variant_id IS NOT NULL THEN
      UPDATE provider_outreach_variants
      SET enrolled_count = enrolled_count + 1
      WHERE id = NEW.variant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_variant_enrolled_count
  AFTER INSERT OR UPDATE OF variant_id ON provider_outreach_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_enrolled_count();

-- ============================================================================
-- 4. Trigger to update claimed_count on variants table
-- ============================================================================

CREATE OR REPLACE FUNCTION update_variant_claimed_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When stage changes to 'claimed', increment claimed_count for the variant
  IF OLD.stage IS DISTINCT FROM NEW.stage
     AND NEW.stage = 'claimed'
     AND NEW.variant_id IS NOT NULL THEN
    UPDATE provider_outreach_variants
    SET claimed_count = claimed_count + 1
    WHERE id = NEW.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_variant_claimed_count
  AFTER UPDATE OF stage ON provider_outreach_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_claimed_count();

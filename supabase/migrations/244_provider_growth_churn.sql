-- Provider Growth Churn Tracking
-- Adds timestamp columns to track when providers churned from each product

-- Add churn timestamp columns
ALTER TABLE provider_growth_tracking
ADD COLUMN IF NOT EXISTS ads_churned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS medjobs_churned_at TIMESTAMPTZ;

-- Add new touchpoint types for churn tracking
-- First drop the existing constraint
ALTER TABLE provider_growth_touchpoints
DROP CONSTRAINT IF EXISTS pgt_touchpoint_type_check;

-- Add constraint with new types
ALTER TABLE provider_growth_touchpoints
ADD CONSTRAINT pgt_touchpoint_type_check CHECK (
  touchpoint_type IN (
    'stage_changed', 'meeting_scheduled', 'meeting_completed', 'meeting_cancelled',
    'meeting_no_show', 'pitch_logged', 'note_added', 'call_attempted', 'activity_logged',
    'ads_converted', 'medjobs_converted', 'ads_upgraded', 'medjobs_upgraded',
    'ads_churned', 'medjobs_churned',
    'marked_not_interested', 'eligibility_updated', 'assigned'
  )
);

-- Index for efficient churned provider queries
CREATE INDEX IF NOT EXISTS idx_pgt_churned ON provider_growth_tracking(ads_churned_at, medjobs_churned_at)
WHERE ads_churned_at IS NOT NULL OR medjobs_churned_at IS NOT NULL;

COMMENT ON COLUMN provider_growth_tracking.ads_churned_at IS 'Timestamp when provider cancelled their ads subscription';
COMMENT ON COLUMN provider_growth_tracking.medjobs_churned_at IS 'Timestamp when provider cancelled their medjobs subscription';

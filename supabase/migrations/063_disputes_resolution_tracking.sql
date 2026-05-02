-- Add resolution tracking columns to disputes table
-- These columns track when and by whom a dispute was resolved

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add claimant_phone if it doesn't exist (may have been added manually)
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS claimant_phone TEXT;

-- Create index for finding disputes resolved by a specific admin
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by ON disputes (resolved_by);

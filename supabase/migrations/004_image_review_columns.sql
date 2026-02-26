-- Add admin review columns to provider_image_metadata
-- Tracks whether classifications were auto-generated, admin-confirmed, or admin-overridden.
-- The classify script respects admin_overridden and never overwrites those rows.

ALTER TABLE provider_image_metadata
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'auto_classified'
    CHECK (review_status IN ('auto_classified', 'admin_reviewed', 'admin_overridden')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Fast lookup for images needing review
CREATE INDEX IF NOT EXISTS idx_pim_review_status ON provider_image_metadata(review_status);

-- Low-confidence images that likely need vision AI or manual review
CREATE INDEX IF NOT EXISTS idx_pim_low_confidence ON provider_image_metadata(classification_confidence)
  WHERE classification_confidence < 0.7;

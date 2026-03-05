-- Migration: Add provider reply fields to reviews table
-- Enables providers to respond to family reviews

-- Add provider reply fields
ALTER TABLE reviews
ADD COLUMN provider_reply TEXT,
ADD COLUMN replied_at TIMESTAMPTZ,
ADD COLUMN replied_by UUID REFERENCES business_profiles(id);

-- Index for filtering replied reviews efficiently
CREATE INDEX idx_reviews_replied ON reviews(provider_id) WHERE provider_reply IS NOT NULL;

-- Allow providers to update their own reviews (for replying)
CREATE POLICY "Providers can update replies on their reviews"
  ON reviews FOR UPDATE
  USING (
    -- Check if the current user owns the provider profile that this review is for
    EXISTS (
      SELECT 1 FROM business_profiles bp
      JOIN accounts a ON bp.account_id = a.id
      WHERE bp.slug = reviews.provider_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles bp
      JOIN accounts a ON bp.account_id = a.id
      WHERE bp.slug = reviews.provider_id
        AND a.user_id = auth.uid()
    )
  );

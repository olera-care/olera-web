-- Add claimant_email to disputes for public (unauthenticated) submissions
-- The dispute form no longer requires auth, so we need email for contact/rate-limiting

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS claimant_email TEXT;

-- Create index for rate limiting by email
CREATE INDEX IF NOT EXISTS idx_disputes_claimant_email ON disputes (claimant_email);

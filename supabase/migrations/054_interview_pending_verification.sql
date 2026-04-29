-- Add is_pending_verification column to interviews table
-- When true, the interview is stored but the student has not been notified
-- Used when unverified providers schedule interviews (similar to Q&A pending pattern)

ALTER TABLE public.interviews
ADD COLUMN is_pending_verification BOOLEAN NOT NULL DEFAULT false;

-- Add partial index for efficient querying of pending verification interviews
CREATE INDEX idx_interviews_pending_verification
ON public.interviews(provider_profile_id, is_pending_verification)
WHERE is_pending_verification = true;

COMMENT ON COLUMN public.interviews.is_pending_verification IS 'When true, interview is saved but student not notified until provider verifies';

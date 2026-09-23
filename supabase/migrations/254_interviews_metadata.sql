-- ============================================================
-- 252: Add metadata column to interviews table
-- ============================================================
-- Stores additional interview context like job_details snapshot
-- (shifts, prn status, job description) captured at scheduling time

ALTER TABLE public.interviews
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.interviews.metadata IS
  'JSON blob for extensible interview data. Currently stores job_details snapshot (shifts, prn, job_description) captured when provider schedules interview.';

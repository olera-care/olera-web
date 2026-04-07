-- Add "rejected" to business_profiles verification_state check constraint
-- This allows admins to reject verification requests and track rejected providers

-- First drop the existing check constraint
ALTER TABLE public.business_profiles
DROP CONSTRAINT IF EXISTS business_profiles_verification_state_check;

-- Recreate with rejected included
ALTER TABLE public.business_profiles
ADD CONSTRAINT business_profiles_verification_state_check
  CHECK (verification_state IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add "pending_verification" to business_profiles verification_state check constraint
-- This state is used for low-trust claims that require verification before full access

-- First drop the existing check constraint
ALTER TABLE public.business_profiles
DROP CONSTRAINT IF EXISTS business_profiles_verification_state_check;

-- Recreate with pending_verification included
ALTER TABLE public.business_profiles
ADD CONSTRAINT business_profiles_verification_state_check
  CHECK (verification_state IN ('unverified', 'pending', 'verified', 'rejected', 'pending_verification'));

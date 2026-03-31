-- ============================================================
-- 029: MedJobs Interview Scheduling
-- ============================================================

CREATE TABLE public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Participants
  provider_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,

  -- Status & Type
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  type TEXT NOT NULL DEFAULT 'video'
    CHECK (type IN ('video', 'in_person', 'phone')),

  -- Scheduling
  proposed_time TIMESTAMPTZ NOT NULL,
  alternative_time TIMESTAMPTZ,
  confirmed_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 30,

  -- Location / Link
  location TEXT,

  -- Notes
  notes TEXT,

  -- Who proposed
  proposed_by UUID NOT NULL REFERENCES public.business_profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_interviews_provider ON public.interviews(provider_profile_id);
CREATE INDEX idx_interviews_student ON public.interviews(student_profile_id);
CREATE INDEX idx_interviews_status ON public.interviews(status);
CREATE INDEX idx_interviews_confirmed_time ON public.interviews(confirmed_time);

-- Auto-update updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Both parties can view their own interviews
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT USING (
    provider_profile_id IN (
      SELECT id FROM public.business_profiles
      WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )
    OR student_profile_id IN (
      SELECT id FROM public.business_profiles
      WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )
  );

-- Providers can create interviews (they initiate scheduling)
CREATE POLICY "Providers can create interviews" ON public.interviews
  FOR INSERT WITH CHECK (
    proposed_by IN (
      SELECT id FROM public.business_profiles
      WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )
  );

-- Both parties can update interviews they're part of (confirm, cancel, reschedule)
CREATE POLICY "Participants can update interviews" ON public.interviews
  FOR UPDATE USING (
    provider_profile_id IN (
      SELECT id FROM public.business_profiles
      WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )
    OR student_profile_id IN (
      SELECT id FROM public.business_profiles
      WHERE account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    )
  );

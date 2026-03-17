-- ============================================================
-- MedJobs Foundation
-- Adds student profile type + MedJobs-specific tables
-- business_profiles.type uses TEXT + CHECK constraint (not an enum)
-- ============================================================

-- Widen the CHECK constraint on business_profiles.type to include 'student'
-- Drop the existing constraint and recreate with the new value
ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_type_check;
ALTER TABLE public.business_profiles ADD CONSTRAINT business_profiles_type_check
  CHECK (type IN ('organization', 'caregiver', 'family', 'student'));

-- ============================================================
-- MEDJOBS UNIVERSITIES
-- Expansion unit: add campuses as rows, not code changes.
-- ============================================================

CREATE TABLE public.medjobs_universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  state text NOT NULL,
  lat double precision,
  lng double precision,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medjobs_universities_state ON public.medjobs_universities(state);
CREATE INDEX idx_medjobs_universities_slug ON public.medjobs_universities(slug);

CREATE TRIGGER medjobs_universities_updated_at
  BEFORE UPDATE ON public.medjobs_universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MEDJOBS EXPERIENCE LOGS
-- Credential engine backbone: tracks hours worked at a provider.
-- Provider can confirm/dispute. Becomes the Clinical Transcript.
-- ============================================================

CREATE TABLE public.medjobs_experience_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hours numeric(7,1) NOT NULL CHECK (hours > 0),
  care_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  supervisor_name text,
  supervisor_title text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medjobs_exp_student ON public.medjobs_experience_logs(student_profile_id);
CREATE INDEX idx_medjobs_exp_provider ON public.medjobs_experience_logs(provider_profile_id);
CREATE INDEX idx_medjobs_exp_status ON public.medjobs_experience_logs(status);

CREATE TRIGGER medjobs_experience_logs_updated_at
  BEFORE UPDATE ON public.medjobs_experience_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MEDJOBS JOB POSTS (Phase 2+)
-- Provider-specific job listings. Empty for now but schema ready.
-- ============================================================

CREATE TABLE public.medjobs_job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  care_types text[] NOT NULL DEFAULT '{}',
  hours_per_week_min integer,
  hours_per_week_max integer,
  pay_rate_min numeric(6,2),
  pay_rate_max numeric(6,2),
  location_type text NOT NULL DEFAULT 'on_site' CHECK (location_type IN ('on_site', 'hybrid', 'flexible')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medjobs_jobs_provider ON public.medjobs_job_posts(provider_profile_id);
CREATE INDEX idx_medjobs_jobs_status ON public.medjobs_job_posts(status);
CREATE INDEX idx_medjobs_jobs_care_types ON public.medjobs_job_posts USING gin(care_types);

CREATE TRIGGER medjobs_job_posts_updated_at
  BEFORE UPDATE ON public.medjobs_job_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.medjobs_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medjobs_experience_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medjobs_job_posts ENABLE ROW LEVEL SECURITY;

-- Universities: public read
CREATE POLICY "Anyone can read active universities"
  ON public.medjobs_universities FOR SELECT
  USING (is_active = true);

-- Experience logs: student sees own, provider sees their confirmations
CREATE POLICY "Students can read own experience logs"
  ON public.medjobs_experience_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      AND p.id = student_profile_id
    )
  );

CREATE POLICY "Providers can read experience logs for their facility"
  ON public.medjobs_experience_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      AND p.id = provider_profile_id
    )
  );

CREATE POLICY "Students can insert own experience logs"
  ON public.medjobs_experience_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      AND p.id = student_profile_id
    )
  );

CREATE POLICY "Providers can update experience logs for their facility"
  ON public.medjobs_experience_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      AND p.id = provider_profile_id
    )
  );

-- Job posts: public read active, providers manage own
CREATE POLICY "Anyone can read active job posts"
  ON public.medjobs_job_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Providers can manage own job posts"
  ON public.medjobs_job_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.profiles p ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      AND p.id = provider_profile_id
    )
  );

-- Student profiles: public read (same as org/caregiver)
-- The existing policy "Anyone can read non-family profiles" already covers this
-- since student != family. No new policy needed.

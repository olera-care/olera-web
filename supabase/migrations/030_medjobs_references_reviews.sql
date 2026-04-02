-- ============================================================
-- MedJobs: Student References & Reviews
-- Two new tables for candidate profile enrichment.
-- All writes go through service-role API routes (no INSERT/UPDATE RLS).
-- ============================================================

-- ============================================================
-- MEDJOBS STUDENT REFERENCES
-- Token-based flow: student requests → referee writes via link.
-- ============================================================

CREATE TABLE public.medjobs_student_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  referee_name text,
  referee_title text,
  referee_organization text,
  referee_email text NOT NULL,
  relationship text NOT NULL CHECK (relationship IN ('professor', 'employer', 'supervisor', 'colleague', 'other')),
  recommendation text,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'completed')),
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medjobs_refs_student ON public.medjobs_student_references(student_profile_id);
CREATE INDEX idx_medjobs_refs_token ON public.medjobs_student_references(token);
CREATE INDEX idx_medjobs_refs_status ON public.medjobs_student_references(status);

CREATE TRIGGER medjobs_student_references_updated_at
  BEFORE UPDATE ON public.medjobs_student_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MEDJOBS STUDENT REVIEWS
-- Unauthenticated submissions, admin-moderated.
-- ============================================================

CREATE TABLE public.medjobs_student_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (char_length(comment) >= 50),
  relationship text NOT NULL CHECK (relationship IN ('client', 'employer', 'supervisor', 'coworker')),
  status text NOT NULL DEFAULT 'under_review' CHECK (status IN ('published', 'under_review', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medjobs_reviews_student ON public.medjobs_student_reviews(student_profile_id);
CREATE INDEX idx_medjobs_reviews_status ON public.medjobs_student_reviews(status);

-- One review per email per student (excluding removed)
CREATE UNIQUE INDEX idx_medjobs_reviews_unique_per_email
  ON public.medjobs_student_reviews(student_profile_id, reviewer_email)
  WHERE status != 'removed' AND reviewer_email IS NOT NULL;

CREATE TRIGGER medjobs_student_reviews_updated_at
  BEFORE UPDATE ON public.medjobs_student_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW-LEVEL SECURITY (SELECT only — all writes via service-role)
-- ============================================================

ALTER TABLE public.medjobs_student_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medjobs_student_reviews ENABLE ROW LEVEL SECURITY;

-- References: public can read completed references
CREATE POLICY "Anyone can read completed references"
  ON public.medjobs_student_references FOR SELECT
  USING (status = 'completed');

-- Reviews: public can read published reviews
CREATE POLICY "Anyone can read published student reviews"
  ON public.medjobs_student_reviews FOR SELECT
  USING (status = 'published');

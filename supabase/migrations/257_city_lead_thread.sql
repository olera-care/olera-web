-- Messages written inside Olera between a provider and a family from her own
-- ad (lib/city-ads/thread.server.ts).
--
-- Only the words typed on our pages live here. Everything else in the shared
-- timeline is already recorded elsewhere and is merged at read time: our texts
-- and emails (city_lead_messages), the family's texts to our number
-- (sms_inbound), our calls (family_touches), check-ins and outcomes
-- (city_leads).
--
-- The family is never sent the words by text. Our carrier registration covers
-- "a provider sent you a message, read and reply here", so the text carries a
-- link and the words stay on the page.
CREATE TABLE IF NOT EXISTS public.city_lead_thread (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.city_leads(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('provider', 'family')),
  author_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS city_lead_thread_lead_idx ON public.city_lead_thread(lead_id, created_at);
ALTER TABLE public.city_lead_thread ENABLE ROW LEVEL SECURITY;
-- No policies: read and written only by the service role, behind routes that
-- check the provider owns the lead or the family holds a signed link.

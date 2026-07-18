-- Phase D: the host-intern placement (the offer -> accept -> confirm
-- relationship created after a good interview). See
-- docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md.
--
-- Payments are STUBBED for now (Stripe wiring deferred). The fee + hours
-- threshold are recorded for the guarantee; *_paid_at stay null until Stripe
-- manual-capture (authorize-at-offer / capture-at-confirm) is wired.
--
-- interview_id is a loose uuid (no FK) to avoid coupling to the interviews
-- table name during this build; wire the FK when Stripe + the UI land.

create table if not exists public.medjobs_placements (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  student_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  interview_id uuid,
  status text not null default 'offered'
    check (status in ('offered','accepted','confirmed','declined','cancelled','completed')),
  internship_agreement_signed_at timestamptz,
  -- Stubbed payment fields (Stripe deferred).
  provider_fee_usd integer not null default 100,
  student_fee_usd integer not null default 100,
  hours_threshold integer not null default 120,
  provider_paid_at timestamptz,
  student_paid_at timestamptz,
  offered_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medjobs_placements_provider on public.medjobs_placements(provider_profile_id);
create index if not exists idx_medjobs_placements_student on public.medjobs_placements(student_profile_id);
create index if not exists idx_medjobs_placements_interview on public.medjobs_placements(interview_id);

-- RLS on; access is mediated by the service-role placements API for now.
alter table public.medjobs_placements enable row level security;

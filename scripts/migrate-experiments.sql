-- CTA Experimentation Infrastructure
-- Run this in the Supabase SQL editor to create experiment tables.
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  name text not null,
  config jsonb not null default '{}',
  weight int not null default 50 check (weight >= 0 and weight <= 100),
  created_at timestamptz not null default now(),
  unique(experiment_id, name)
);

create table if not exists public.cta_impressions (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.experiment_variants(id) on delete cascade,
  date date not null default current_date,
  count int not null default 0,
  unique(variant_id, date)
);

-- Attribution column on connections
alter table public.connections
  add column if not exists experiment_variant_id uuid references public.experiment_variants(id);

-- ============================================================
-- RLS
-- ============================================================

alter table public.experiments enable row level security;
alter table public.experiment_variants enable row level security;
alter table public.cta_impressions enable row level security;

-- Experiments: public read, service role write
do $$ begin
  create policy "Public can read experiments"
    on public.experiments for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages experiments"
    on public.experiments for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

-- Variants: public read, service role write
do $$ begin
  create policy "Public can read variants"
    on public.experiment_variants for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages variants"
    on public.experiment_variants for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

-- Impressions: public insert/update/read (fire-and-forget from client)
do $$ begin
  create policy "Public can insert impressions"
    on public.cta_impressions for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can read impressions"
    on public.cta_impressions for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can update impressions"
    on public.cta_impressions for update using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Service role manages impressions"
    on public.cta_impressions for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

-- Updated_at trigger
do $$ begin
  create trigger experiments_updated_at
    before update on public.experiments
    for each row execute function public.update_updated_at();
exception when duplicate_object then null;
end $$;

-- ============================================================
-- SEED: First experiment with 2 variants
-- ============================================================

insert into public.experiments (name, status)
values ('cta-v1', 'draft')
on conflict (name) do nothing;

-- Variant A (Control): Old "Get in Touch" baseline
insert into public.experiment_variants (experiment_id, name, config, weight)
select e.id, 'contact', jsonb_build_object(
  'headline', 'Get in Touch',
  'buttonText', 'Connect with us',
  'trustLine', 'We''ll connect you directly with this provider.',
  'fields', '["name", "email", "phone", "message"]'::jsonb,
  'postSubmitFlow', 'basic'
), 33
from public.experiments e where e.name = 'cta-v1'
on conflict (experiment_id, name) do nothing;

-- Variant B: Current "Get Pricing" redesign (fine-dijkstra)
insert into public.experiment_variants (experiment_id, name, config, weight)
select e.id, 'pricing', jsonb_build_object(
  'headline', 'What does this cost?',
  'buttonText', 'Check cost & availability',
  'trustLine', 'No spam. No sales calls.',
  'fields', '["email"]'::jsonb,
  'postSubmitFlow', 'pricing'
), 33
from public.experiments e where e.name = 'cta-v1'
on conflict (experiment_id, name) do nothing;

-- Variant C: "Check Eligibility" (Logan's idea)
insert into public.experiment_variants (experiment_id, name, config, weight)
select e.id, 'eligibility', jsonb_build_object(
  'headline', 'See if you qualify',
  'buttonText', 'Check eligibility',
  'trustLine', 'Free assessment. No obligation.',
  'fields', '["email"]'::jsonb,
  'postSubmitFlow', 'eligibility'
), 34
from public.experiments e where e.name = 'cta-v1'
on conflict (experiment_id, name) do nothing;

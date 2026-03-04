-- Migration: Stripe webhook idempotency and payment method tracking
-- This ensures webhooks are processed exactly once and tracks payment methods for trial extensions

-- ============================================================
-- STRIPE WEBHOOK EVENTS (Idempotency)
-- Stores processed event IDs to prevent duplicate processing
-- ============================================================

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  -- Auto-cleanup old events after 7 days
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- Index for cleanup job
create index stripe_webhook_events_expires_at_idx
  on public.stripe_webhook_events(expires_at);

-- Comment for documentation
comment on table public.stripe_webhook_events is
  'Tracks processed Stripe webhook events for idempotency. Events auto-expire after 7 days.';

-- ============================================================
-- ADD PAYMENT METHOD TRACKING TO MEMBERSHIPS
-- Tracks whether user has a payment method on file for CC-gated trial extension
-- ============================================================

alter table public.memberships
  add column if not exists has_payment_method boolean not null default false;

alter table public.memberships
  add column if not exists trial_extended boolean not null default false;

-- Comment for documentation
comment on column public.memberships.has_payment_method is
  'Whether user has a payment method (credit card) attached in Stripe';
comment on column public.memberships.trial_extended is
  'Whether the initial 14-day trial was extended by 30 days after adding CC';

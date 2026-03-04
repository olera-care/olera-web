# Stripe P0 Fixes - Handover Document

**PR #136**: https://github.com/olera-care/olera-web/pull/136
**Branch**: `fix/stripe-p0-critical`
**Status**: Open - Awaiting team review and database migration

---

## What This PR Does

This PR addresses critical gaps in the Stripe integration identified during an audit:

| Feature | Description |
|---------|-------------|
| **Webhook Idempotency** | Prevents duplicate webhook processing using `stripe_webhook_events` table |
| **`invoice.payment_succeeded`** | Recovers subscriptions from `past_due` → `active` when payment succeeds |
| **`invoice.payment_failed`** | Sets membership to `past_due` when payment fails |
| **`payment_method.attached`** | Tracks when user adds credit card, triggers 30-day trial extension |
| **`payment_method.detached`** | Tracks when user removes credit card |
| **Customer Linking API** | `/api/stripe/link-customer` endpoint for migrating existing iOS subscribers |
| **Trial Extension Toggle** | `STRIPE_TRIAL_EXTENSION_ENABLED` env var to turn feature on/off |

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/014_stripe_webhook_idempotency.sql` | New migration |
| `app/api/stripe/webhook/route.ts` | Rewritten with idempotency + new handlers |
| `app/api/stripe/link-customer/route.ts` | New endpoint |
| `lib/types.ts` | Added `has_payment_method`, `trial_extended` to Membership |
| `.env.example` | Added `STRIPE_TRIAL_EXTENSION_ENABLED` |

---

## Pre-Merge Requirements

### 1. Run Database Migration

**Must be done BEFORE merging the PR**, otherwise webhooks will fail.

Run this SQL in Supabase SQL Editor:

```sql
-- Migration: Stripe webhook idempotency and payment method tracking

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists stripe_webhook_events_expires_at_idx
  on public.stripe_webhook_events(expires_at);

comment on table public.stripe_webhook_events is
  'Tracks processed Stripe webhook events for idempotency. Events auto-expire after 7 days.';

alter table public.memberships
  add column if not exists has_payment_method boolean not null default false;

alter table public.memberships
  add column if not exists trial_extended boolean not null default false;

comment on column public.memberships.has_payment_method is
  'Whether user has a payment method (credit card) attached in Stripe';
comment on column public.memberships.trial_extended is
  'Whether the initial 14-day trial was extended by 30 days after adding CC';
```

### 2. Verify Migration

Run this to confirm:

```sql
select count(*) as webhook_events_table_exists
from information_schema.tables
where table_name = 'stripe_webhook_events';

select column_name, data_type, column_default
from information_schema.columns
where table_name = 'memberships'
and column_name in ('has_payment_method', 'trial_extended');
```

---

## Post-Merge Requirements

### 1. Add Webhook Events in Stripe Dashboard

Go to: Stripe Dashboard → Developers → Webhooks → Select your endpoint → Add events

Add these events:
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`
- [ ] `payment_method.attached`
- [ ] `payment_method.detached`

(These are in addition to existing events like `checkout.session.completed`, `customer.subscription.updated`, etc.)

### 2. Set Environment Variable

Add to Vercel environment variables:
```
STRIPE_TRIAL_EXTENSION_ENABLED=true
```

Set to `false` if you want to disable the 30-day trial extension feature.

---

## Testing Checklist

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI if not already
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger payment_method.attached
```

### Manual Testing

- [ ] Webhook signature verification still works
- [ ] Duplicate webhook detection (send same event twice, second should be skipped)
- [ ] `payment_method.attached` triggers trial extension when:
  - User is in `trialing` status
  - User hasn't already extended (`trial_extended = false`)
  - `STRIPE_TRIAL_EXTENSION_ENABLED = true`
- [ ] `invoice.payment_failed` sets status to `past_due`
- [ ] `invoice.payment_succeeded` recovers `past_due` → `active`
- [ ] `/api/stripe/link-customer` endpoint works with valid Stripe customer ID
- [ ] Link-customer returns 409 if customer already linked to different account

---

## Team Decisions Required

### 1. Trial Extension Model

**Current Implementation:**
- Initial trial: 14 days
- Extension when CC added: +30 days
- One-time extension only

**Questions:**
- [ ] Is 30 days the correct extension period?
- [ ] Should extension happen immediately when card added, or at trial end?
- [ ] Do existing iOS users who already extended get grandfathered?

### 2. Customer Migration Strategy

**Options:**
- A) Auto-link by email match during signup
- B) Manual linking via admin panel
- C) User enters their Stripe customer ID
- D) Bulk migration script before launch

**Questions:**
- [ ] Which approach for existing iOS subscribers?
- [ ] What happens if email doesn't match between iOS and web?
- [ ] Do we have a mapping of iOS user emails → Stripe customer IDs?

### 3. Subscription State Handling

**Questions:**
- [ ] What happens to iOS users mid-trial when they sign up on web?
- [ ] If someone is `past_due` on iOS, should web show them as `past_due` too?
- [ ] Should web purchases create new subscriptions or use existing iOS ones?

### 4. Billing Portal

**Questions:**
- [ ] Should users access Stripe Customer Portal, or build custom UI?
- [ ] What self-service actions should users have?
  - [ ] Update payment method
  - [ ] View invoices/receipts
  - [ ] Cancel subscription
  - [ ] Switch plans (monthly ↔ annual)

---

## Remaining Work (P1 - Post This PR)

| Item | Description | Priority |
|------|-------------|----------|
| Stripe Customer Portal | Let users manage billing self-service | High |
| Self-service cancellation | UI for users to cancel subscription | High |
| Reconciliation tool | Script to sync Stripe ↔ DB state | Medium |
| Legacy price handling | Handle old iOS price IDs | Medium |
| Upgrade/downgrade flow | Switch between monthly ↔ annual | Medium |

---

## Contacts

- **PR Author**: Effy (via Claude Code)
- **Audit Date**: March 4, 2026

---

## Quick Reference

**PR URL**: https://github.com/olera-care/olera-web/pull/136

**Key Files to Review**:
- `app/api/stripe/webhook/route.ts` - Main webhook handler
- `app/api/stripe/link-customer/route.ts` - Migration endpoint
- `supabase/migrations/014_stripe_webhook_idempotency.sql` - Database changes

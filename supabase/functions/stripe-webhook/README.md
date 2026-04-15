# Stripe Webhook — Supabase Edge Function

Receives Stripe webhook events and updates `business_profiles.metadata` to
activate/deactivate MedJobs Pro subscriptions.

## Why this exists (not on Vercel)

The Vercel-hosted webhook at `app/api/stripe/webhook/route.ts` is consistently
blocked by Vercel's edge Bot Protection layer with a 403 Forbidden. Stripe's
webhook delivery infrastructure (Google Cloud IPs) is classified as bot-like
traffic and denied before the request reaches the Next.js function. Multiple
firewall configurations — Custom Bypass rules and System Bypass rules — did
not resolve the block after extensive debugging (April 2026). Supabase Edge
Functions are not behind Vercel's edge, so Stripe's POSTs reach the handler.

The Vercel route is retained as documented backup in the repo (see
`app/api/stripe/webhook/route.ts`) but is no longer registered in Stripe.

## What this function does

**Scope is narrow by design**: only the MedJobs Pro subscription flow.

| Stripe event | Action |
| --- | --- |
| `checkout.session.completed` (with `metadata.product === "medjobs"`) | Sets `business_profiles.metadata.medjobs_subscription_active = true`, stores subscription and customer IDs |
| `customer.subscription.deleted` | Finds profiles by `medjobs_stripe_customer_id`, sets `medjobs_subscription_active = false` |
| Any other event type | Acknowledged with 200 and logged; no DB changes |

Generic portal memberships (`memberships` table) are intentionally NOT handled
by this function. That paywall is not in MVP scope.

## First-time setup (once per developer machine)

1. **Install Supabase CLI** (macOS):
   ```bash
   brew install supabase/tap/supabase
   ```
   Verify: `supabase --version`

2. **Log in**:
   ```bash
   supabase login
   ```
   Opens browser — click "Authorize".

3. **Link this repo to the Supabase project**:
   ```bash
   cd /path/to/olera-web
   supabase link --project-ref <PROJECT_REF>
   ```
   Find `PROJECT_REF` in Supabase Dashboard → Project Settings → General → "Reference ID" (a short alphanumeric string).

## Configure secrets (once per project)

Supabase auto-injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into
Edge Functions — do NOT set these manually.

Set Stripe secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

- `STRIPE_SECRET_KEY`: from Stripe Dashboard → Developers → API keys (live mode)
- `STRIPE_WEBHOOK_SECRET`: from the webhook endpoint page (set after Stripe registration below)

Verify the secrets are set:
```bash
supabase secrets list
```

## Deploy the function

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

`--no-verify-jwt` is REQUIRED — Stripe sends requests without a Supabase JWT.

The CLI prints the function URL, for example:
```
https://xxxxxxxxxxxx.supabase.co/functions/v1/stripe-webhook
```
Copy this URL.

## Register in Stripe

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: paste the Supabase function URL from the deploy step
3. Events to send (click "Select events"):
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - (Optional extra coverage — ignored currently but harmless if subscribed: `customer.subscription.updated`, `invoice.payment_failed`)
4. Click **Add endpoint**.
5. On the endpoint detail page, reveal the **Signing secret** (`whsec_...`).
6. Set it in Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
7. Re-deploy so the function picks up the new secret:
   ```bash
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

## Verify it works (the checkpoint sequence)

Each step has a clear pass/fail signal. Stop and diagnose if any step fails.

### Checkpoint 1: Function is reachable

```bash
curl -i -X POST <FUNCTION_URL> -d '{}'
```

Expected: `HTTP 400` with body `{"error":"Missing signature or webhook secret"}`.
If you get 404 — wrong URL. If 500 — check Supabase Dashboard → Edge Functions → stripe-webhook → Logs.

### Checkpoint 2: Stripe test webhook

Stripe Dashboard → your webhook endpoint → **Send test webhook** →
select `checkout.session.completed` → Send.

Expected: the test event row shows **200 OK**.

Also check Supabase Dashboard → Edge Functions → stripe-webhook → Logs.
You should see:
```
[stripe-webhook] Received event evt_... type=checkout.session.completed
[stripe-webhook] Ignoring non-medjobs checkout session cs_test_...
```
("Ignoring" is correct — Stripe's stock test events don't have `metadata.product = "medjobs"`.)

### Checkpoint 3: Real $1 medjobs payment

Go through your normal provider upgrade flow in live mode, pay with a real card ($1), observe redirect back to your site.

Query Supabase:
```sql
select
  id,
  metadata->>'medjobs_subscription_active' as active,
  metadata->>'medjobs_subscription_id'     as sub_id,
  metadata->>'medjobs_stripe_customer_id'  as cus_id
from business_profiles
where id = '<the profile_id you paid for>';
```

Expected: `active = "true"`, sub_id and cus_id populated.

Also in Supabase Logs:
```
[stripe-webhook] Activated medjobs subscription for profile <id> (sub=sub_...)
```

### Checkpoint 4: Cancellation test (optional)

Stripe Dashboard → Customers → cancel the subscription from Checkpoint 3.
Supabase Logs should show:
```
[stripe-webhook] Deactivated medjobs subscription for profile <id>
```
And `active` in DB flips back to `"false"`.

## Cutover from the old Vercel endpoint

Only do this AFTER Checkpoint 3 passes.

1. Stripe Dashboard → Webhooks → old endpoint `https://olera.care/api/stripe/webhook` → **Disable** (don't delete — keep as audit trail).
2. Watch Supabase logs for ~5 min to confirm real events flow through.
3. For each historical 403'd delivery in Stripe (on the old endpoint page):
   - Click the delivery → **Resend** — Stripe will deliver it to the NEW endpoint, retroactively activating any stuck paid customers.

## Rollback plan

If the Supabase function misbehaves after cutover:

1. Stripe Dashboard → Webhooks → old `olera.care` endpoint → **Enable**.
2. Stripe Dashboard → new Supabase endpoint → **Disable**.
3. You're back to the pre-cutover state (and the Vercel endpoint's 403 problem). Debug from there.

No code revert needed — the Vercel route is still in the repo.

## Updating the function

```bash
# Edit supabase/functions/stripe-webhook/index.ts
supabase functions deploy stripe-webhook --no-verify-jwt
```

Changes go live within seconds. There is no build step.

**Important**: whenever the Vercel route at `app/api/stripe/webhook/route.ts`
is edited, mirror the change here (and vice versa) until one is deleted.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Stripe test webhook returns 400 "Invalid signature" | `STRIPE_WEBHOOK_SECRET` in Supabase doesn't match the endpoint's signing secret | Copy secret from Stripe endpoint page, re-run `supabase secrets set STRIPE_WEBHOOK_SECRET=...`, re-deploy |
| Stripe returns 404 | Wrong function URL registered in Stripe | Copy URL from `supabase functions list` or the deploy output |
| Logs show "merge_profile_metadata RPC failed" then "Fallback direct update succeeded" | RPC has a permissions issue but fallback worked | Non-critical, but check the RPC's SECURITY DEFINER / EXECUTE grants |
| Logs show neither success nor RPC error | Function may not be receiving events | Check Stripe Dashboard → endpoint → Deliveries to confirm Stripe is attempting delivery |
| Signature verification fails intermittently | `whsec_` mismatch between modes — live vs test | Confirm you're in live mode everywhere, and the signing secret matches |

Logs are in Supabase Dashboard → Edge Functions → stripe-webhook → **Logs** tab.
Realtime, retained for ~7 days on most plans.

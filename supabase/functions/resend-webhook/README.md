# Resend Webhook — Supabase Edge Function

Receives Resend email lifecycle events (sent / delivered / opened / clicked / bounced / complained / etc.) and persists them into `email_events` + denormalized snapshot columns on `email_log`.

## Why this exists (not on Vercel)

The Vercel-hosted route at `app/api/resend/webhook/route.ts` is consistently blocked by Vercel's edge Bot Protection layer with **403 Forbidden**. Resend's webhook delivery infrastructure (Svix on Google Cloud IPs) is classified as bot-like traffic and denied before the request reaches the Next.js function. Same pattern as Stripe — see `app/api/stripe/webhook/route.ts` deprecation notice. Supabase Edge Functions are not behind Vercel's edge, so Resend's POSTs reach the handler.

The Vercel route is retained as documented backup but is no longer registered in Resend.

## What this function does

Mirrors `lib/resend-events.ts` exactly:

1. Verifies the Svix signature with `RESEND_WEBHOOK_SECRET` (returns 400 on failure)
2. Inserts a row into `email_events` with `ON CONFLICT (svix_id) DO NOTHING` (idempotent — Resend re-deliveries are no-ops at the DB level)
3. Looks up the matching `email_log` row by `resend_id`; if found, conditionally UPDATEs the denormalized snapshot columns (`first_*` timestamps only set when null, `last_event_*` only advances when `occurred_at` is newer)
4. Always returns 200 on internal failures so Resend doesn't retry forever

## First-time setup

1. **Install Supabase CLI** (macOS):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Log in** (if not already):
   ```bash
   supabase login
   ```

3. **Link this repo to the Supabase project** (if not already linked for stripe-webhook):
   ```bash
   cd /path/to/olera-web
   supabase link --project-ref <PROJECT_REF>
   ```
   Find `PROJECT_REF` in Supabase Dashboard → Project Settings → General → "Reference ID".

## Configure secrets

Supabase auto-injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions — do NOT set these manually.

Set the Resend webhook secret:

```bash
supabase secrets set RESEND_WEBHOOK_SECRET=whsec_...
```

Use the same `whsec_...` value that was set in Vercel — it's the signing secret from the Resend webhook page.

Verify:
```bash
supabase secrets list
```

## Deploy the function

```bash
supabase functions deploy resend-webhook --no-verify-jwt
```

`--no-verify-jwt` is REQUIRED — Resend sends requests without a Supabase JWT.

The CLI prints the function URL, e.g.:
```
https://xxxxxxxxxxxx.supabase.co/functions/v1/resend-webhook
```
Copy this URL.

## Update Resend dashboard

1. Resend Dashboard → Webhooks → click the existing webhook
2. **Edit the endpoint URL** to the Supabase function URL from the deploy step
3. Save

The signing secret stays the same — no need to regenerate or update `RESEND_WEBHOOK_SECRET`.

Resend will automatically retry any pending events (the ones that 403'd against Vercel) within minutes against the new URL. They should land successfully and populate `email_events`.

## Verify it works

### Checkpoint 1: function is reachable

```bash
curl -i -X POST <FUNCTION_URL> -d '{}'
```

Expected: `HTTP 400` with body `{"error":"Missing svix headers"}`.
If 404 — wrong URL. If 500 — check Supabase Dashboard → Edge Functions → resend-webhook → Logs.

### Checkpoint 2: send a real email through the app

Submit a question on a staging provider page (or trigger any Resend send). Within ~60 seconds, query:

```sql
SELECT event_type, occurred_at, email_log_id
FROM email_events
WHERE resend_id = '<the resend_id from email_log>'
ORDER BY occurred_at DESC;
```

Expected: rows for `sent`, `delivered`, and (when the recipient client loads the tracking pixel) `opened`.

### Checkpoint 3: confirm denormalized snapshot

```sql
SELECT delivered_at, first_opened_at, last_event_type, last_event_at
FROM email_log
WHERE resend_id = '<...>';
```

Expected: timestamps populated as the corresponding events arrive; `last_event_type` = `opened` (or whichever event arrived last).

## Local development

To run locally for testing:

```bash
supabase functions serve resend-webhook --env-file .env.local --no-verify-jwt
```

Then point a tunnel (ngrok, cloudflared) at `http://localhost:54321/functions/v1/resend-webhook` and configure a Resend test webhook against the tunnel URL.

## Logs

Supabase Dashboard → Edge Functions → resend-webhook → Logs. Tail with:

```bash
supabase functions logs resend-webhook --tail
```

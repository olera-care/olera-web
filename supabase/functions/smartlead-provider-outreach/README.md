# SmartLead Provider Outreach Webhook

Supabase Edge Function that receives SmartLead webhook events for Provider Outreach cold campaigns and updates the `provider_outreach_tracking` table accordingly.

## Event Handling

| SmartLead Event   | Action                                              |
|-------------------|-----------------------------------------------------|
| EMAIL_REPLY       | Move to `needs_call` stage (if in_sequence)         |
| EMAIL_UNSUBSCRIBE | Move to `archived` stage with reason                |
| EMAIL_CLICK       | Track click count, detect claim link clicks         |
| EMAIL_OPEN        | Track open count (lightweight, no stage change)     |

> **Note:** SmartLead's API does not support `EMAIL_BOUNCE` as a webhook event type (confirmed live — see `lib/smartlead.ts`). Bounce detection must be done via SmartLead dashboard or API polling if needed.

## Deployment

1. **Set the webhook secret:**
   ```bash
   supabase secrets set SMARTLEAD_PROVIDER_WEBHOOK_SECRET=your-secret-here
   ```

2. **Deploy the function:**
   ```bash
   supabase functions deploy smartlead-provider-outreach
   ```

3. **Configure SmartLead:**
   - Webhook URL: `https://<project-ref>.supabase.co/functions/v1/smartlead-provider-outreach?secret=your-secret-here`
   - Events: EMAIL_REPLY, EMAIL_BOUNCE, EMAIL_UNSUBSCRIBE, EMAIL_CLICK, EMAIL_OPEN

## Why Supabase Edge Function?

Vercel's Bot Protection blocks external webhook POSTs (same issue as Resend/Stripe webhooks). Supabase Edge Functions bypass this restriction.

## Resolution Logic

Events are matched to tracking rows by:
1. `smartlead_campaign_id` from the event payload
2. Lead email matched against `olera-providers.email`

## Idempotency

Events are dedup'd by `event_id` stored in `sequence_metadata.seen_events[]`. Retries are safe.

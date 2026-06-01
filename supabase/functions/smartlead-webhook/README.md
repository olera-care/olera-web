# smartlead-webhook (D2)

Supabase Edge Function that ingests Smartlead reply/bounce events into the
MedJobs CRM as touchpoints. Counterpart to the outbound Smartlead bridge
(`lib/medjobs/smartlead-bridge.ts`). See `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md`.

## What it does

- **reply** → inserts an `email_replied` touchpoint, resets `viewed_at`, and (if
  the row is still pre-engagement) sets `status=engaged` — so the row surfaces in
  the In-Basket Replies tab, exactly like a manually-logged reply.
- **bounce** → inserts an `email_bounced` touchpoint (the `bounce_fix` stage
  derives from it).

It maps each event to a CRM row via `custom_fields.outreach_id` (baked onto every
Smartlead lead by `rowToLead`), falling back to the lead email matched against
`research_data.smartlead.lead_email`.

## Why an Edge Function + the G4 note

Vercel Bot Protection 403s provider-origin webhook POSTs, so this can't be a
Vercel route. That same wall blocks an Edge→Vercel callback, so this writes via
the service role directly — a narrow, deliberate exception to G4 (single-writer
through `route.ts`), kept faithful by replicating exactly what `insertTouchpoint`
+ `handleLogReply` / `handleLogTouch` do. The one divergence: it skips
`transitionStage`'s `manual_followup` task queue (the row still surfaces via
derived state). Full rationale in the function header.

## Inert until activated (gated on Logan sign-off)

With no `SMARTLEAD_WEBHOOK_SECRET` set, every request is a logged no-op (200).
Nothing happens until BOTH the secret is set and Smartlead is pointed here.

⚠️ Before activating, **verify the Smartlead webhook payload shape** (event_type
names, lead/custom-field nesting) against current Smartlead docs — the parser is
defensive but written against the documented shape, not a live payload.

## Activate

1. `supabase secrets set SMARTLEAD_WEBHOOK_SECRET=<random-string>`
2. `supabase functions deploy smartlead-webhook`
3. In Smartlead → Settings → Webhooks, add the function URL for the
   reply + bounce events, appending `?secret=<same-string>` (or set the
   `x-smartlead-secret` header).
4. Send a Smartlead test event; confirm a touchpoint lands on the matching row.

Do not activate until the warmup window clears and Logan has signed off on the
launch flow (Operational Brief D2 gate).

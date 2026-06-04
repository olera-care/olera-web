# calendly-webhook (Phase 1 Bullet 12)

Supabase Edge Function that ingests Calendly invitee lifecycle events into
the MedJobs CRM as meeting state transitions. Counterpart to manual meeting
logging via the `LogMeetingModal` (`app/admin/student-outreach/LogMeetingModal.tsx`).

Self-booked Calendly meetings on Dr. DuBose's account flow into the
In-Basket Meetings tab automatically, so admin doesn't have to manually
mirror Calendly state in the CRM.

## Event mapping

| Calendly event | CRM effect |
|---|---|
| `invitee.created` | `meeting_scheduled` touchpoint with `payload.meeting_at = start_time`. Surfaces in Meetings tab Upcoming via the existing `meeting_state="scheduled"` derivation. Resets `viewed_at` so the row re-bolds. |
| `invitee.canceled` (alone) | `meeting_no_show` touchpoint with `payload.reason="canceled"`. Surfaces in Meetings tab No-show / Reschedule. |
| `invitee.canceled` (within 60s of a `meeting_scheduled`) | `note_added` touchpoint with `payload.reason="calendly_reschedule_pending"`. Pairs with the subsequent `invitee.created` (which sets the new time). |
| `invitee.rescheduled` (when emitted as discrete event) | Treated as `created` — the new meeting time wins. |

## Matching invitee.email → outreach row

Three-layer best-match:

1. `research_data.general_contact.email` (most reliable cold-outreach surface)
2. `research_data.decision_maker.email`
3. linked `business_profiles.email` (legacy)

Each layer is a single SQL filter. Match is case-insensitive. Multiple
matches in any layer → null (ambiguous; logged + 200 no-op). Zero
matches across all three → null (unmatched; logged + 200 no-op).

**Unmatched bookings**: deferred to a follow-up. The MVP behavior is "log
and continue" — admin sees the booking natively in Calendly's UI and can
manually create the CRM entry if needed. A dedicated unmatched tray would
require a new table (against G3 — no new migrations during feature work).

## Idempotency

Calendly may retry on transient failures. Events are deduped by
`payload->>calendly_invitee_uri` — if a touchpoint of any meeting type
already exists for the row with the same invitee URI, the handler is a
no-op.

## Signature verification

Calendly's webhook signing scheme: `Calendly-Webhook-Signature: t=<unix>,v1=<hmac>`
where `hmac = HMAC-SHA256(secret, "<timestamp>.<rawBody>")`. The handler
verifies the signature, rejects signatures older than 5 minutes (replay
protection), and constant-time-compares the digest.

Fallback for manual testing: `?secret=<CALENDLY_WEBHOOK_SECRET>` query
param accepted in lieu of a valid signature.

## INERT until activated

`CALENDLY_WEBHOOK_SECRET` not set → every request is a logged no-op (200).
Nothing happens until the secret is set AND Calendly is configured to
POST here.

## Environment

Auto-injected by Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Required, set via `supabase secrets set`:
- `CALENDLY_WEBHOOK_SECRET` — the signing key from Calendly's webhook setup.

## Calendly admin setup (post-deploy)

1. Dr. DuBose's Calendly admin → Integrations → Webhooks
2. Add subscription:
   - URL: `https://<project-ref>.supabase.co/functions/v1/calendly-webhook`
   - Events: `invitee.created`, `invitee.canceled`. (Rescheduled events
     are emitted by Calendly as a canceled + created pair within ~60s;
     the handler pairs them.)
   - Sign with: a fresh secret you generate; mirror to
     `CALENDLY_WEBHOOK_SECRET` via `supabase secrets set`.

## Deploy

```bash
supabase functions deploy calendly-webhook --project-ref <ref>
supabase secrets set CALENDLY_WEBHOOK_SECRET=<value> --project-ref <ref>
```

## Why an Edge Function + the G4 note

Same WAF wall as smartlead-webhook. Writes via service role directly,
replicating `mark_meeting_scheduled` / `flag_wants_meeting` handlers
inline. Narrow, deliberate exception to G4 (single-writer to
`student_outreach_touchpoints`); documented at the function header.

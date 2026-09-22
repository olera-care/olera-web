# Lead notification hold

**Status:** spec, not built. Agreed with TJ 2026-09-22.
**Next in the sequence:** the skip-all lead flag (separate plan, do not fold in here).

## The problem

The provider is told a family arrived before the family has been asked anything.

The lead is created and every provider-facing notification fires at the moment the
email address is submitted. The six-step qualifying flow (`EnrichmentState`) runs
*after* that, and every step is skippable.

Measured on 90 days of live data, 2026-09-22:

| | |
|---|---|
| Inquiries | 873 |
| Arrived with no free text at all | 485 (56%) |
| Entered the enrichment flow | 819 sessions |
| Reached the end of it | 342 (42%, and "reached the end" counts skip-throughs) |
| Left a phone number | 251 (29%) |

The Franchil case is the worked example. On 17 Sep a caregiver looking for a job
submitted his email at 00:27:36. `lead_received` fired the same second, the
"Your Find Families campaign brought in a new family" email reached Hilda at
00:27:39, and only then did he hit Skip five times between 00:27:45 and 00:27:58.
He never answered a question. Two of that campaign's three leads were job
applicants and the third had no name, phone or message.

So a blank lead and a rich lead are indistinguishable in a provider's inbox and
in their email, and the ad-attributed ones say "a new family" regardless.

## What ships

1. Provider notifications are held until the inquiry is either enriched or
   abandoned, instead of firing at email submit.
2. The notification says what we actually know, and says plainly when we know
   nothing, instead of asserting "a new family".

Nothing about the family's own experience changes. The connection is still
created immediately, the family still lands in `/portal/inbox`, and the provider
can still see the lead in-app the moment it exists. Only the outbound push
(email + SMS) is held.

## Timing

Release is event-driven first, timer second, so nobody who answers waits at all.

- **Release on enrichment finishing.** `PATCH /api/connections/update-intent`
  is where the answers land. Send from there.
- **Release on timeout** for people who abandon: **10 minutes**.

The 10 minutes is measured, not guessed. Across 353 sessions where a lead was
followed by an enrichment completion, the median gap was **53 seconds**, p90 was
**116 seconds**, p99 was **339 seconds**, and 352 of 353 finished inside ten
minutes. A ten-minute ceiling therefore delays no one who was going to answer.
It delays only leads that were never going to carry data.

## Where the sends are today

All of these fire inline in the request handler, at insert time:

- `app/api/connections/request/route.ts` — the main path, the mobile sticky bar.
  Two blocks, guest (~700–1030) and authenticated (~1788–2156). Each does
  `lead_received`, then `sendAdBoostLeadDeliveredEmail`, then the generic
  provider lead email, then the provider SMS, then the Slack alert.
- `app/api/connections/create-inquiry/route.ts:250` — matches-page path.
  Calls the ad-boost email with a bare `void`, so the promise is not awaited
  (see the serverless fire-and-forget rule; moving to the cron fixes this).
- `app/api/connections/compare-save/route.ts` — **sends no provider
  notification today**. Its only `sendEmail` is the magic link to the family.
  In scope for the metadata write only, so held-state is consistent.

## Design

Add to `connections.metadata`:

- `provider_notify_state`: `held` | `sent` | `skipped`
- `provider_notify_after`: ISO timestamp, insert time + 10 minutes
- `provider_notify_released_by`: `enrichment` | `timeout` | `manual`

At insert, set `held` and `provider_notify_after`, and do **not** send. Keep the
Slack alert immediate: it is internal and the latency is the point of it.

Extract the existing send block into one `sendProviderLeadNotifications(connectionId)`
in `lib/leads/provider-notifications.server.ts` that both the release trigger and
the cron call. It must be idempotent: the `email_log` dedupe on
`metadata->>connection_id` already exists in `lib/ad-boost/lead-notifications.server.ts`
and should guard the generic email and the SMS too.

Two callers:

1. `PATCH /api/connections/update-intent` — after the connection update succeeds,
   await the send. Set `released_by: enrichment`.
2. A cron, every 5 minutes, that picks up `provider_notify_state = held` and
   `provider_notify_after <= now()`. Set `released_by: timeout`.

Cron registration needs both `vercel.json` and `lib/crons/registry.ts`; changing
one without the other drifts.

## Copy

The ad-boost subject "Your Find Families campaign brought in a new family" is the
line that broke here, twice, on job applicants. Two variants:

- **Enriched:** unchanged shape, with who needs care, how soon, and the phone if
  we have one.
- **Unenriched:** say what it is. Someone asked to be contacted, here is their
  email, we do not know yet what they need. Do not call them a family and do not
  congratulate the provider.

No em dashes in shipped copy.

## Out of scope

- The skip-all flag. Next plan. `enrichment_step_skipped` is already tracked, so
  it needs no new instrumentation.
- The inbox auto quick-reply for the ~58% who skip. Third.
- Any change to the ad account or negative keywords. Negatives filter the search
  query, not the person who lands, so they cannot fix this.
- Consolidating Hilda's two provider profiles. Known, deprioritized by TJ.

## Verification

1. Submit an email on a provider page on mobile, answer the enrichment steps.
   Provider email should arrive within seconds of the last answer, carrying them.
2. Submit an email, then close the tab. No provider email for ten minutes, then
   one arrives in the unenriched shape.
3. Submit an email, skip all steps. Same as 2 but released by the enrichment
   trigger, still in the unenriched shape.
4. Confirm exactly one provider email per connection across all three.
5. Re-run the 90-day query above a fortnight after ship. The share of provider
   notifications in the unenriched shape should track the ~58% skip rate; if it
   reads near zero, the hold is not being applied.

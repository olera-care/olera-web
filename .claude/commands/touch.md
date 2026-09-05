# Log a provider touch

Input: `$ARGUMENTS` — a one-line touch, or nothing if TJ attached a screenshot of an email, iMessage thread, or call log.

## What this is

The five-second capture for the provider touch log (`provider_touches`, migration 205; read it at `/admin/relationships`). A touch is one human-level contact with a provider on any channel, plus the one next action it implies. Every hand-sent email, text, and call goes here or it is lost, which is how a 90-day promise to Sherry Pace went unbuilt for three weeks in August 2026.

This command writes rows. It does not draft messages (that is the comms work itself) and it does not run the audit.

## Parse

Accept either shape:

**One line.** `provider channel direction "what happened" [--next "..."] [--due date] [--owner name] [--at time] [--handle address]`

- `provider`: any unambiguous fragment of the display name or contact name (`pacesetter`, `sherry`, `zardy`). Resolve against `business_profiles` (`display_name`, `metadata->>claimer_name`). If two match, show both and stop.
- `channel`: `email | text | call | meeting | in_app`.
- `direction`: `out` (we reached them) or `in` (they reached us). Also accept `to`/`from`.
- The quoted string is `summary`, one line, ≤240 chars. Anything longer goes in `detail`.
- `--at`: when it happened; default now. Accept "yesterday 9am", "28 aug 6:27", ISO. Store UTC. TJ is in Thailand (UTC+7); providers are US.
- `--next`, `--due`, `--owner`: the next action. `--due` accepts "mon", "12 sep", ISO date. Owner defaults to TJ.
- `--handle`: the address or number actually used, when it is not the profile's.

**A screenshot.** Read every message in the thread. Emit one touch per message that carries information (skip "Ok" unless it closes a promise). Set `occurred_at` from the timestamps in the image; when a bubble has no timestamp, use the nearest one above it. `direction` from which side of the thread it sits on. `contact_handle` from the header (a phone number or address). Quote the message text in `detail`.

**Promise detection, both shapes.** If a message from us contains a commitment ("I'll send", "I'll give you an update", "this week", "I will set it up", "let me look into"), propose a `next_action` with a due date and ask TJ to confirm before writing it. A promise nobody wrote down is the failure mode this table exists to close.

## Write

The terminal has no admin session and the WAF blocks curl to admin routes, so write directly, the same way the audit writes the case log:

```bash
set -a; source ~/Desktop/olera-web/.env.local; set +a
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/provider_touches" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"provider_id":"<uuid>","channel":"text","direction":"in","occurred_at":"2026-09-05T11:20:00Z",
       "summary":"...","detail":"...","contact_name":"...","contact_handle":"...",
       "source":"manual","next_action":"...","next_action_due":"2026-09-12","next_action_owner":"TJ",
       "author":"claude (for TJ)"}'
```

Before inserting a row with a `next_action`, close the provider's open ones, exactly as the API does:

```bash
curl -s -X PATCH "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/provider_touches?provider_id=eq.<uuid>&next_action=not.is.null&next_action_done_at=is.null" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -d '{"next_action_done_at":"<now ISO>"}'
```

`author` is `claude (for TJ)` when TJ dictated it, `claude (backfill from <source>, <date>)` when read from a screenshot after the fact. Python's `urllib` fails SSL on this machine; use curl.

## Echo

Print what was written, compactly, so TJ can catch a wrong provider or date:

```
Logged  Miracle-Lightstar · Zardy Dweh · text · in · 5 Sep 11:20 UTC
        "Ok"
        next: 7-day read by text · due 12 Sep · TJ
```

For a screenshot, one line per row plus any promise you proposed. Then stop. Do not summarize the relationship, do not suggest replies; the log is the deliverable.

## Rules

- Never invent a timestamp. If the image has none, say so and use `--at` from TJ.
- Never log a message that was drafted but not confirmed sent. "Good to send?" is not a send.
- No PHI about families in `summary`. A family is "a family". Their details belong in the connection record, not here.
- If the provider has no `business_profiles` row, stop and say so; this table is keyed to profiles on purpose.

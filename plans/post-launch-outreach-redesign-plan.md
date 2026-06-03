# Plan: Post-Launch Outreach Redesign — Strategy v2

Created: 2026-06-03 (v1 same day)
Status: STRATEGY / NOT STARTED (no code yet)
Author: Claude (revising per Logan's feedback + the pilot agreement PDF)

## What changed from v1

Logan's feedback + the `pilotagreementhomespark.pdf` + a survey of the
existing auth/onboarding infrastructure forced six material revisions
to v1. They sit at the top so the rest of the doc reads as a
consistent whole.

| # | v1 decision | v2 decision | Why |
|---|-------------|-------------|-----|
| Δ1 | Call it "Trial Active" | Call it **"Pilot Active"** | The PDF says "Pilot Program," "free account," "either party may end with written notice." "Trial" reads SaaS-y; "pilot" reads honest. |
| Δ2 | New `trial_activated` derived stage | **No new stage.** Provider self-activation sets the existing `metadata.interview_terms_accepted_at` flag — same field `make_client` already writes. | Admin-driven conversion (post-meeting) and provider-driven conversion (self-served) collapse to ONE terminal: `active_partner` / `converted`. Two paths in, one state out. No new derivation, no new UI fork, no new touchpoint type. |
| Δ3 | New `trial_state` JSONB tracking 4 sub-events | **Drop the sub-state JSONB.** Track engagement via `note_added` touchpoints with `reason:` payload, plus the existing email/meeting/call touchpoint stream. The terminal is binary: terms accepted or not. | Sub-state was overbuild. The timeline is the audit log; we don't need a parallel state machine that re-records what's already in touchpoints. G1 + G4 satisfied. |
| Δ4 | Email CTA: "Review your students and **start your trial**" | Email CTA: **"Review the candidate board →"** (no "trial" word). Pilot framing appears only AFTER they're on the platform and have seen the students. | Logan: trial-language triggers sales-defensiveness in cold readers. The PDF agrees — Scope clause says "Provider may review student profiles and invite candidates to interview." Lead with the value, not the commercial structure. |
| Δ5 | Magic-token is a Phase-2 nice-to-have; MVP uses a public URL | Magic-token is **MVP**. Plug `/api/auth/auto-sign-in` → `/auth/magic-link` → personalized welcome page. The primitives exist; building it isn't more work than building a thoughtful public page would be. | The infrastructure survey confirmed `auto-sign-in` + `magic-link` are production-grade and reusable. Skipping them and shipping a public page that we'd then have to re-do is the patchwork Logan warned against. |
| Δ6 | Pre-create accounts so the welcome page can personalize | **Just-in-time account creation** on first magic-link click. Token carries `outreach_id`; click → resolve to email/org → `claim-instant` → session → land. | Pre-creating accounts that may never be claimed leaves zombie rows in `business_profiles` and confuses claim-state semantics. JIT keeps the database clean. |

Three new findings from the PDF + survey that didn't exist as
considerations in v1:

- **F1. The pilot tier doesn't exist yet.** The existing `/medjobs/candidates` board redacts student contact info for free-tier accounts. Pilot providers need *full* access for 3 months. This is a real backend item (add `metadata.pilot_active_through` timestamp; the `medjobs_subscription_active` predicate reads it).
- **F2. The pilot agreement is THE T&C.** No separate terms-acceptance copy required — the PDF *is* the terms. Display it on the welcome page (existing pattern: `/medjobs/staffing-pilot/page.tsx` already has a T&C modal that writes `interview_terms_accepted_at`). We reuse that pattern.
- **F3. "Free account" not "claimed listing".** The PDF defines what the provider gets as "a free account with access to the candidate board page." That sentence is the entire onboarding contract — anything more would over-commit them.

---

## Goal (restated)

Move providers from **outreach launched** to **Pilot Active** — they
clicked the email, accepted the pilot agreement, and are using the
candidate board to invite students to interview. A meeting with Dr.
DuBose is *one* path to Pilot Active, not the goal.

---

## Strategic shifts (revised from v1)

| # | Old assumption | New assumption |
|---|----------------|----------------|
| S1 | Day 0 includes a call | Day 0 = email only. First post-launch call is Day 3. |
| S2 | Primary conversion = scheduled meeting | Primary conversion = **Pilot Active** (terms accepted + account active). Meeting is one path to it. |
| S3 | CTA = "reply or book a call" | CTA = **"Review the candidate board →"**. Reply + Calendly are secondary. No "trial" language. |
| S4 | Calls re-pitch the program | Calls confirm receipt, answer questions, redirect to the link. The PDF + the platform carry the pitch. |
| S5 | Meeting = terminal-positive | Meeting = high-signal lead. Pilot Active is terminal. |
| S6 | Timeline = single stream | Timeline = **Upcoming** + **Past Activity**. |
| S7 | "Replies" tab = email replies only | "Emails" tab = single event stream, smart-filtered with Needs Reply + Bounced pinned, lower-signal collapsed by default. |
| S8 | Open/click events not surfaced | Open/click events update the existing `email_sent` touchpoint's payload — one row per email with engagement chips, not a flood of new rows. |
| S9 | Calendly = link in the email | Calendly = inbound webhook. Self-booked + admin-booked both land in Meetings tab via the same `mark_meeting_scheduled` action. |
| **S10** (new) | Onboarding is a multi-step flow | Onboarding is **the magic-link click**. `auto-sign-in` + `claim-instant` happen atomically; provider lands authenticated on the welcome page. The "form" is the PDF terms button. |
| **S11** (new) | Welcome page is a marketing landing | Welcome page is the candidate board, personalized + pilot-tier-gated. The provider's first impression IS the product. |
| **S12** (new) | Empty-state is "students recruiting" | Empty-state is a tiered fallback: real local students → sample students from peer campuses → labeled demo candidate (e.g., Logan as a clearly-marked demo) → "recruiting in progress" momentum. The page must *always* show something usable. |

If any of S1–S12 is wrong, the rest of this doc is wrong.

---

# PLAN PHASE 1 — The conceptual model

## P1.A — Post-launch call cadence

Same as v1. Day 0 email-only, Day 3 email+call, Day 5 call, Day 7 final email.
Net: 3 emails + 2 calls. Today's Day 1 call is removed (it duplicated
the Pre-Flight call's job).

## P1.B — Purpose of each post-launch call

Slight revision to v1 — the CTA the admin redirects to is now "review
the candidate board," not "start your trial":

| Day | Purpose | What admin says |
|-----|---------|-----------------|
| 3 | "Did you get our email?" | "If you didn't see it, the candidate board is at the link in our email — would you like me to resend?" → if yes, resend → if no, "anything I can help with?" |
| 5 | "Anything you'd like to ask?" | "Some folks find it helpful to walk through it with Dr. DuBose; want me to set that up? Or you can poke around the candidate board on your own — it's at the link in the email." |
| 7 | "Last touch" | "We'll check back next term if now's not the right time. Is there a better person at {org} we should reach about caregiver hiring?" |

**Calls are about removing friction, not selling.** The platform + PDF
do the selling.

## P1.C — Terminal state: Pilot Active

Definition: a row is **Pilot Active** when:

1. `business_profiles.metadata.interview_terms_accepted_at` is set
   (the existing field), AND
2. `business_profiles.metadata.pilot_active_through` is in the future
   (new field — sets to `now + 90d` at terms acceptance).

That's it. No `visited_at` + `viewed_students_at` + `interview_requested_at`
predicates. The terminal is binary; engagement signals live in the
timeline as touchpoints.

**Pilot Active maps to:**
- `outreach.status` → `active_partner` (existing)
- `stage.ts` → `converted` (existing)

No new stage, no new derived predicates. The two paths in are:
- **Admin-driven** (existing): `make_client` action runs at meeting close → sets `interview_terms_accepted_at` + transitions outreach to `active_partner`.
- **Provider-driven** (new): provider accepts PDF terms on welcome page → server-side handler sets `interview_terms_accepted_at` + `pilot_active_through` + transitions outreach to `active_partner` + emits `stage_change` touchpoint.

Both call the same underlying conversion engine. The CRM doesn't
care which path was taken — it just sees the row as converted.

**Open question:** the admin-driven path should ALSO set `pilot_active_through` so we have one consistent end-of-pilot timer. Confirm with Logan.

## P1.D — Email strategy (no "trial" language)

Primary CTA in every post-launch email, button-styled:

> **Review the candidate board →**

…linking to a magic-link URL:
`olera.care/medjobs/welcome?t=<token>` where the token is a one-shot
signed payload containing `{outreach_id, email, expires_at}` (30-day
TTL).

Secondary CTAs, smaller text below the button:
- "Or reply with any questions"
- "Want to chat first? Book a quick call with Dr. DuBose →" (Calendly)

The Day 0 / Day 3 / Day 7 emails all carry the same single primary
CTA. Body copy differs (intro → light follow-up → graceful close) but
the action is consistent.

**Body copy tone** (illustrative, not final):

> Hi {first_name},
>
> Graize here, on behalf of Dr. Logan DuBose at Olera. We've been
> recruiting and vetting pre-nursing and pre-medical students from
> Texas A&M who are looking for caregiver experience, and {org_name}
> stood out as a great fit to invite into our pilot program.
>
> You can review the candidate board here:
>
> **Review the candidate board →**
>
> Background on the program is attached. If you want to chat first,
> you can also book a quick call with Dr. DuBose — no pressure
> either way.

Notice: no "trial," no "subscription," no "start now" language. Just
an invitation to look.

## P1.E — Magic-link & welcome-page flow

**Reuse the existing primitives.** The infrastructure survey
confirmed:

- `/api/auth/auto-sign-in` takes an email, creates/finds a Supabase user with `email_confirm: true`, returns a one-shot token hash.
- `/auth/magic-link` (page) redeems the token hash, establishes a session, calls `/api/auth/ensure-account`.
- `/api/provider/claim-instant` creates `accounts` + `business_profiles` + `memberships` atomically with `verification_state: "unverified"`, redirects to `/provider`.
- `/medjobs/staffing-pilot/page.tsx` already has a T&C modal pattern that writes `interview_terms_accepted_at`.

**The flow:**

```
Email click  →  /medjobs/welcome?t=<token>
                          │
                          ▼
                ┌──────────────────────────────┐
                │  Server-side token decode    │
                │  → resolve outreach_id, email│
                │  → claim-instant if no       │
                │    business_profile exists   │
                │  → auto-sign-in              │
                │  → set session               │
                └──────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────────────┐
            │  /medjobs/welcome (authenticated)   │
            │                                      │
            │  ┌── Hero ─────────────────────┐    │
            │  │ Welcome, {org_name}.        │    │
            │  │ Texas A&M pilot program     │    │
            │  └─────────────────────────────┘    │
            │                                      │
            │  ┌── Candidate board ──────────┐    │
            │  │ Filtered to their catchment │    │
            │  │ Full data (pilot-tier gate) │    │
            │  └─────────────────────────────┘    │
            │                                      │
            │  ┌── About the pilot ──────────┐    │
            │  │ Inline PDF terms reveal     │    │
            │  │ "How students get vetted"   │    │
            │  │ "What we're learning"       │    │
            │  └─────────────────────────────┘    │
            │                                      │
            │  ┌── Sticky bottom CTA ────────┐    │
            │  │ [ Activate pilot account ]  │    │
            │  │  → opens T&C modal          │    │
            │  └─────────────────────────────┘    │
            └─────────────────────────────────────┘
```

**Token security:** one-shot redemption, 30-day TTL, scoped to one
`outreach_id`. If forwarded and someone else clicks, the page warns
"You're being signed in as {org} — continue?" because the email goes
to an org-level address (`info@`, owner direct) and a forwarder has
the same authority anyway.

**Just-in-time account creation:** if there's no `business_profiles`
row for this org yet (cold provider), `claim-instant` runs server-side
INSIDE the welcome handler — not at email-send time. This avoids
zombie accounts for providers who never click.

## P1.F — Empty-state ladder

Per Logan's feedback, the welcome page must *always* show something
usable. Tiered fallback, in priority order:

1. **Real local students** (≥3 with profiles + photos, filtered to the provider's catchment).
2. **Sample students from peer campuses** — anonymized real profiles, labeled "Sample from another campus while we recruit at {their_campus}".
3. **Demo candidate** — clearly labeled, "Demo profile · Logan DuBose, founder, also a med student. Real students will replace this view." This is the credibility move Logan suggested. Real face, real bio, clearly marked DEMO.
4. **Recruiting-in-progress** banner with concrete momentum: "47 pre-nursing students contacted at {campus} this week. You'll see profiles here as they're vetted. Activate your account to get notified."

The page picks the highest-rung fallback it can fill. The "Activate
pilot account" CTA stays available at every rung — provider can sign
the pilot agreement even with zero students visible, and they'll just
get notified when students arrive.

**This is the make-or-break UX.** Don't ship the new email CTA
without the ladder in place.

## P1.G — Calls, emails, meetings all support Pilot Active

Per Logan's framing, every post-launch surface points toward the same
terminal:

| Surface | How it supports Pilot Active |
|---------|------------------------------|
| Email | CTA is the welcome page, where pilot terms are accepted. |
| Call | Admin's job is to redirect them to the welcome page link, or offer a meeting with Dr. DuBose if they have questions. |
| Meeting | Dr. DuBose answers questions; admin can activate the pilot on the provider's behalf at close (existing `make_client` flow). |
| Bounce | Admin researches a better email → re-launches outreach. |
| Click event | Triggers a Day-5-or-sooner call ("they're warm, close the loop"). |

The system doesn't treat meetings as the only conversion path, but it
treats them as a *strong* path — admin should still offer a meeting on
every call where the provider has substantive questions.

## P1.H — Tracking / metrics

**MVP metric set** (matches Logan's stated priorities):

1. **Replies received** (existing).
2. **Bounces** (existing).
3. **Clicks on the welcome-page CTA** (new — Smartlead webhook).
4. **Pilot Active activations** (new — provider-self-signed conversions).
5. **Meetings scheduled** (existing).

**Touchpoint model — revision from v1:**

Engagement events (open, click) update the existing `email_sent`
touchpoint's payload rather than emit new touchpoint types. One row
per email with engagement chips. Concretely:

- `email_sent` touchpoint gets payload extended with `open_count`, `last_opened_at`, `click_count`, `last_clicked_at`, `clicked_ctas: ["welcome_page"]`.
- Smartlead webhook handler `UPDATE`s the touchpoint row instead of `INSERT`-ing a new one.

This is more G1-compliant than v1's "new touchpoint types" approach.
No new types, no schema change beyond the existing JSONB payload. The
Emails tab filters by payload fields (`payload->>click_count > 0`).

**Provider platform events** (visited welcome page, accepted terms,
viewed candidate board): use `note_added` touchpoints with
`reason: "platform_visited" | "terms_accepted" | "candidate_viewed"`.

## P1.I — Pilot tier gate (the F1 finding)

**New backend item.** Today, `/medjobs/candidates` redacts contact
info for free-tier accounts (`medjobs_subscription_active` flag).
Pilot providers need full access for the 3-month pilot.

Two paths to wire this:

**Option A — extend the existing `medjobs_subscription_active`
predicate** to OR-in pilot membership:

```ts
const hasMedjobsAccess =
  metadata.medjobs_subscription_active === true ||
  (metadata.pilot_active_through &&
   new Date(metadata.pilot_active_through) > new Date());
```

**Option B — separate `pilot_active` flag** read by the candidate
board page directly.

Recommend **Option A** — one access predicate, one source of truth,
cleaner code path. Pilot is just another way to be entitled.

**Pilot expiry behavior:** when `pilot_active_through` passes, the
provider's view degrades back to redacted free-tier (re-entry point to
upsell). Admin gets a Day-T-minus-7 task to reach out about
continuation. (This is post-MVP; for the first 3 months we just need
the activation path, not the expiry path.)

## P1.J — MVP vs later (revised)

**Implementation Phase 1 — MVP (3-week scope)**

1. **Cadence change** in `cadence.ts` — Day 0 email-only, Day 3 email+call, Day 5 call, Day 7 email. (1 day)
2. **Provider email template rewrite** — single "Review the candidate board →" CTA in `templates.ts`, no "trial" language. (1 day)
3. **Pilot-tier backend** — `business_profiles.metadata.pilot_active_through` field + extend `medjobs_subscription_active` predicate. (1 day)
4. **Magic-link welcome route** — `/api/medjobs/welcome/[token]` server handler that decodes the token, calls `claim-instant`, calls `auto-sign-in`, redirects to welcome page. (3 days)
5. **Welcome page** at `/medjobs/welcome` — hero + candidate board (catchment-filtered, pilot-tier-gated) + "About the pilot" reveal + Accept Pilot Terms modal that writes `interview_terms_accepted_at` + `pilot_active_through`. (5 days)
6. **Empty-state ladder** — real → sample → demo (Logan profile) → recruiting-in-progress. (3 days)
7. **Smartlead webhook expansion** — `email_open` + `email_link_click` handlers update the `email_sent` touchpoint payload. (2 days)
8. **Provider-self-signing conversion** — terms-acceptance handler transitions outreach to `active_partner` (reuses existing `make_client` engine, just a different invocation surface). (1 day)

Total: ~17 days of focused work. **No tab UI changes, no timeline
split, no Calendly webhook.** Those are Phase 2.

**Implementation Phase 2 — Surfaces (after MVP data starts flowing)**

9. Timeline split (Upcoming / Past Activity).
10. Next Step post-launch state branches.
11. Emails tab (rename + smart-filter sections).
12. Calls tab Today/Upcoming sections.
13. Meetings tab + Calendly webhook.
14. Pilot-expiry awareness (Day T-7 reach-out task, post-pilot upsell).

**Implementation Phase 3 — Polish (later)**

15. Inline Smartlead reply UI (if volume warrants).
16. Pilot continuation flow (post-3-month paid conversion).
17. Provider-self-serve admin tools (let them edit their own org info on the welcome page).

---

# PLAN PHASE 2 — The surfaces

(opens after Phase 1 ships and we have data to design against)

## P2.A — Next Step post-launch (revised)

Per-stage table — Pilot Active replaces v1's "trial_activated":

| Stage | Headline | Sub-line | Primary action |
|-------|----------|----------|----------------|
| in_outreach (cold) | "Awaiting click or reply" | "Next email: Day {X} on {date}. Next call: {date}." | Log reply (secondary) |
| in_outreach (opened) | "They opened — give them time" | "Opened {N}× since {date}. Cadence continues." | Log call (when due) |
| in_outreach (clicked) | "**They clicked — call them**" | "Visited the welcome page {date}. Haven't activated yet." | Call to close the loop |
| meeting_set | (unchanged) | | |
| converted (Pilot Active) | "Pilot Active 🎉" | "Activated {date}. Last candidate viewed: {date}." | Schedule check-in (secondary) |
| bounce_fix | (unchanged) | | |

The card answers two questions: **what just happened?** (the
engagement signal) and **what should I do next?** (the primary action).

## P2.B — Timeline split (same as v1)

```
┌─── Upcoming ────────────────────────────────────────┐
│  ⌚ Tomorrow · Day 3 email                          │
│  📞 Fri · Day 3 call                                │
│  ⌚ Mon · Day 5 call                                │
└─────────────────────────────────────────────────────┘

┌─── Past Activity ───────────────────────────────────┐
│  📧 Sent · Day 0 email (Mon)                        │
│    👁  Opened 3×  ·  🖱  Clicked welcome page (Tue) │
│  📞 Logged · Day 3 call · voicemail (Thu)           │
└─────────────────────────────────────────────────────┘
```

Engagement events update the email's row (no separate rows).
Both sections collapse on long timelines; default-show Upcoming +
last 3 past events.

## P2.C — In Basket tabs (per Logan §7)

```
Prospects · Calls · Emails · Meetings
```

Clients / Partners / Candidates move to sidebar-only (not horizontal
tabs). The horizontal tab row is just the operational arc for an
admin sitting down to work the funnel.

## P2.D — Calls tab (same as v1)

Today's Calls + Upcoming sections. Each row: name + day + phone +
purpose hint + Log outcome.

## P2.E — Emails tab (revised per Logan §8)

**Single continuous event stream**, with smart-pinning instead of
hard section divisions:

```
┌─── 📌 Needs Reply (3) ───── pinned ─────────────────┐
│  Provider replied to email; admin needs to respond.
└─────────────────────────────────────────────────────┘

┌─── 📌 Bounced (2) ───────── pinned ─────────────────┐
│  Email needs correction. Each row: "Update email + call?"
└─────────────────────────────────────────────────────┘

┌─── Activity log ──── chronological, filterable ─────┐
│  All other email events. Default filter: hide opens.│
│  Filters: [ Clicks ] [ Opens ] [ Sends ] [ All ]    │
│                                                     │
│  🖱 Comfort Keepers clicked the CTA · 2h ago         │
│  📧 Day 3 email sent to HomeSpark · 5h ago          │
│  …                                                  │
└─────────────────────────────────────────────────────┘
```

**Distinctions:**
- **Pinned sections** (Needs Reply, Bounced) require action. Always visible.
- **Activity log** is the firehose. Default filter shows Clicks + Sends (hides Opens because Opens ≠ action). Admin can flip filters to investigate.
- **No "Replied (closed)" archive section** — once admin responds, the row falls out of Needs Reply naturally.

Rationale: Logan was unsettled on v1's six-section design. The
single-stream-with-smart-pinning is simpler, scales better, and
lets the admin tune their own attention via filters.

**Reply mechanic (MVP):** clicking a Needs Reply row opens the
drawer at the email touchpoint + a "Reply via Smartlead inbox →"
button that deep-links to the master inbox. Admin replies there,
comes back to log the reply outcome.

## P2.F — Meetings tab + Calendly (revised per Logan §10)

**What we need from the Calendly setup:**

1. **A single Olera org Calendly account** that hosts Dr. DuBose's
   "MedJobs intro call" event type. (If Dr. DuBose has only a
   personal Calendly today, we move the event type to an org-owned
   account — the rest of the integration depends on it.)
2. **A webhook subscription** for `invitee.created` and `invitee.canceled` events on that event type.
3. **Admin-side Calendly access** so admins can schedule meetings on
   provider's behalf when the provider gives times by phone/email.

**Webhook → CRM matching:** Calendly invitee email is matched against
`outreach.research_data.general_contact.email` (case-insensitive).
Match → dispatch `mark_meeting_scheduled` action automatically with
the Calendly event time.

**Unmatched booking tray:** if Calendly email doesn't match any
outreach row, the booking lands in a small "Unmatched bookings"
shelf at the top of the Meetings tab — admin manually claims it to
the right row.

**Meetings tab sections:**

```
┌─── Upcoming (this week) ───────────────────────────┐
│  Today · 2pm · Comfort Keepers (post Day-3 call)   │
└────────────────────────────────────────────────────┘

┌─── Needs Follow-up ────────────────────────────────┐
│  Meetings held but not yet Pilot Active.           │
│  Each row: meeting date + notes + activation hint  │
│  ("not yet visited" / "visited, no terms" / etc.). │
└────────────────────────────────────────────────────┘

┌─── No-shows / Reschedule ──────────────────────────┐
└────────────────────────────────────────────────────┘

┌─── Unmatched Calendly bookings ────────────────────┐
│  (only visible when present)                       │
└────────────────────────────────────────────────────┘
```

`LogMeetingModal` already handles outcomes — we just add one new
option: **"Activate pilot on their behalf"** that runs the existing
`make_client` (which sets `interview_terms_accepted_at`) AND sets
`pilot_active_through = now + 90d`.

## P2.G — Backend changes (consolidated)

**New metadata fields:**
- `business_profiles.metadata.pilot_active_through` (timestamp; null means not active or admin-driven without explicit pilot timer).

**No new touchpoint types** (revised from v1). All engagement events
either:
- Update an existing `email_sent` touchpoint's payload (opens, clicks), or
- Emit a `note_added` touchpoint with `reason:` payload (platform_visited, terms_accepted, candidate_viewed).

**No new stages** (revised from v1). Existing `active_partner` /
`converted` carries both admin-driven and provider-driven
conversions.

**New routes:**
- `/api/medjobs/welcome/[token]` — server handler that decodes token, runs JIT claim-instant + auto-sign-in, redirects to welcome page.
- `/api/medjobs/pilot/activate` — terms-acceptance POST that writes `interview_terms_accepted_at` + `pilot_active_through` + transitions outreach to `active_partner` via the existing conversion engine.

**New pages:**
- `/medjobs/welcome` — the authenticated welcome page (hero + candidate board + about the pilot + activate CTA).

**Existing predicate update:**
- `medjobs_subscription_active` predicate OR-includes pilot membership (P1.I Option A).

**Smartlead webhook expansion:**
- Add `email_open` and `email_link_click` handlers. Both UPDATE the existing `email_sent` touchpoint payload.

**Calendly webhook (Phase 2):**
- New edge function `calendly-webhook/`. Matches invitee email to outreach row, dispatches `mark_meeting_scheduled`.

---

## Risks (revised)

| Risk | Mitigation |
|------|------------|
| The Day 1 call removal loses signal | Pre-Flight call already covers the "did you reach someone" signal that Day 1 was meant for. Confirm with TJ before merging. |
| Email CTA change loses Calendly bookings | Calendly stays as a secondary CTA in every email. Track booking rate before/after on a per-campus basis. |
| Welcome page empty state bounces providers | Empty-state ladder (P1.F) is **hard-required** before the new CTA goes live. The demo-candidate rung is the safety net. |
| Magic-link forwarded to wrong person | Token is one-shot, 30-day TTL, scoped to one outreach_id. The welcome page shows "You're being signed in as {org}" so the recipient understands what they're agreeing to. Forwarders at an org-level email already have authority. |
| Smartlead open/click webhook reliability | Start with click events only (lower volume, higher signal). Add opens later. Bind cost to Smartlead's existing plan. |
| Calendly can't match invitee to outreach row | Unmatched booking tray + manual claim. Fall back is graceful. |
| Pilot-tier flag drift | Single predicate `medjobs_subscription_active` (Option A) means there's only ONE function to update if pilot logic changes. |
| Just-in-time account creation race | The welcome handler is atomic in a Supabase transaction; concurrent clicks would resolve to the same business_profile via upsert-by-source_provider_id. |
| `interview_terms_accepted_at` set by two paths — which path was it? | Add `metadata.terms_accepted_via: "admin" \| "self_serve"` audit field so we can analyze conversion path mix. |

## Open questions for Logan

The five from v1 are mostly resolved by the PDF + survey. Updated set:

1. **Pilot timer on admin path** — when admin runs `make_client` at meeting close, should that ALSO set `pilot_active_through = now + 90d`? I'd recommend yes (one consistent timer). Confirm.
2. **Day 1 call** — confirmed deleted entirely under the new model. Yes?
3. **Calendly account** — is there an Olera org Calendly today, or only Dr. DuBose's personal? Webhook setup depends on the answer.
4. **Demo-candidate copy & photo** — Logan as a clearly-marked demo profile is the recommendation. Approved? Or use a different sample face?
5. **Token TTL** — 30 days feels right (allows for slow readers, doesn't leave an open door forever). Confirm.
6. **Pilot expiry behavior** — when `pilot_active_through` passes, the candidate board re-redacts (free tier). Admin gets a Day-T-minus-7 reach-out task. Defer to Phase 2 or include in MVP? (Recommend defer.)

---

## Implementation roadmap (suggested ticket order, post-approval)

### MVP — Implementation Phase 1 (~17 days focused work)

| # | Ticket | Files | Verify |
|---|--------|-------|--------|
| 1 | Cadence change | `lib/student-outreach/cadence.ts` | Unit test: provider cadence emits 3 emails + 2 calls, no Day 1. |
| 2 | Email template rewrite | `lib/student-outreach/templates.ts` | Render Day 0/3/7 emails for a fixture row; confirm "Review the candidate board" CTA + no "trial" language. |
| 3 | Pilot-tier predicate | `lib/medjobs/access.ts` (or equivalent), `app/medjobs/candidates/page.tsx` | Manual test: create a `business_profiles` row with `pilot_active_through = now + 1d`; confirm full candidate data renders. |
| 4 | Magic-link welcome route | `app/api/medjobs/welcome/[token]/route.ts`, `lib/medjobs/welcome-token.ts` | Manual test: send self a token-link, click, land authenticated on welcome page. |
| 5 | Welcome page UI | `app/medjobs/welcome/page.tsx`, reuse `<CandidateBoard>` | Visit the page authenticated; see personalized hero + candidate board + Accept terms CTA. |
| 6 | Empty-state ladder | `components/medjobs/EmptyCandidates.tsx` | Manual test against catchments with: ≥3 students, 0 students. Confirm ladder rungs render. |
| 7 | Smartlead webhook (open + click) | `supabase/functions/smartlead-webhook/` | Webhook test: simulate open + click events; confirm `email_sent` payload updates. |
| 8 | Provider-self-signing conversion | `app/api/medjobs/pilot/activate/route.ts` | E2E: click magic link → accept terms → confirm `interview_terms_accepted_at` set + outreach transitions to `active_partner` + Partner Prospects unlock. |

Each ticket is one PR. Order matters: 1+2 are independent and tiny;
3 and 7 are independent; 4 unblocks 5+6+8.

### Phase 2 — Surfaces (after MVP data starts flowing)

Tickets 9–14 from P1.J above.

### Phase 3 — Later

Tickets 15–17 from P1.J above.

---

## Next step

**Approve the strategic shifts table (S1–S12)** and the 6 open
questions. Once shifts are signed off and questions are answered, the
next session cuts the MVP Implementation Phase 1 tickets in order.

If any shift feels wrong — especially the "pilot not trial" framing
(Δ1), the no-new-stage simplification (Δ2), or the magic-link-is-MVP
call (Δ5) — push back here. Those three are the load-bearing
revisions; everything else falls out of them.

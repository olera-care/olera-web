# Plan: Post-Launch Outreach Redesign — Strategy First

Created: 2026-06-03
Status: STRATEGY / NOT STARTED (no code yet)
Author: Claude (drafting per Logan's directive)

## What this document is

A two-phase **strategy plan** for revamping the system *after* Launch
Outreach fires. Phase 1 locks the conceptual model (terminal state,
cadence, CTA, tracking). Phase 2 locks the surfaces (tabs, timeline,
Next Step, integrations). No code lands until Phase 1 is approved,
then Phase 2, then we cut implementation tickets from there.

## Goal

Convert outreach-launched providers into **active trial users** — they
click the email, land in the platform, accept terms, and begin
reviewing/interviewing students. A meeting with Dr. DuBose is an
optional accelerator on that path, not the path itself.

---

## Strategic shifts (the conceptual deltas)

Stated up front so every later decision can be checked against them.

| # | Old assumption | New assumption |
|---|----------------|----------------|
| S1 | Day 0 includes a call | Day 0 = email only. The "confirm contact / verify decision maker" call already happened in Pre-Flight. First post-launch call is Day 3. |
| S2 | Primary conversion = scheduled meeting | Primary conversion = **trial activation** (visit platform → accept terms → view students). Meeting is one path to trial. |
| S3 | CTA in emails = "reply or book a call" | CTA in emails = "click to view your students / start your trial". Reply + Calendly are secondary. |
| S4 | Calls re-pitch the program | Calls confirm receipt, answer questions, **redirect to the link**. The email + PDF carry the pitch. |
| S5 | Meeting = terminal-positive | Meeting = high-signal lead, not conversion. Trial activation is terminal. |
| S6 | Timeline = single chronological stream | Timeline = **Upcoming** (what's queued) + **Past Activity** (what happened). |
| S7 | "Replies" tab = email replies | "Emails" tab = the full email event surface (Replied / Opened / Clicked / Bounced / Needs Reply). |
| S8 | Open/click events not surfaced | Smartlead open/click events flow into the CRM and onto the Emails tab. |
| S9 | Calendly = link in the email | Calendly = two-way integration. Provider self-books OR admin books on their behalf — either path lands in the Meetings tab. |

If any of these is wrong, the whole rest of this plan should be
re-examined. **Approve the shifts table first; everything else
follows.**

---

# PLAN PHASE 1 — The conceptual model

(no UI work yet; this is the contract everything else rests on)

## P1.A — Post-launch call cadence

**Recommendation:** Provider post-launch cadence becomes:

- **Day 0** — email only (intro + program PDF + CTA to platform). No call.
- **Day 3** — email (light follow-up) + call (the "did you get our email?" check).
- **Day 5** — call (offer help, redirect to link, offer Dr. DuBose meeting).
- **Day 7** — final email (graceful out + redirect-the-contact ask) + optional call.

Net: **3 emails + 2–3 calls** over 7 days. Today is 3 emails + 3 calls
(Day 0 paired call goes away — that call moved to Pre-Flight).

**Why this shape:** Day 0 paired call duplicated the Pre-Flight call's
job under the new model. Removing it makes the post-launch sequence
about engagement (did they receive, did they understand, did they
click) rather than confirmation. Spacing calls at Day 3 / 5 gives the
provider time to actually read the email before we ask about it.

**Open question:** Logan suggested Day 3 / 5 / 7. The Day 1 call in the
current cadence is the one we're explicitly removing — confirm we
don't want any Day 1 nudge of any kind.

## P1.B — Purpose of each post-launch call

One sentence per call so the admin knows what to *say*, not just what
to *log*:

| Day | Purpose | Script angle |
|-----|---------|--------------|
| 3 | "Did you get our email?" | Confirm receipt → if no, resend → if yes, ask if anything was unclear → point at the link |
| 5 | "Anything we can help with?" | Offer help understanding the program → offer Dr. DuBose meeting if they have leadership questions → re-point at the link |
| 7 | "Last touch" | Soft close → "if not now, who else should we reach?" — the redirect ask |

**Not a re-pitch.** The PDF + email carry the program details. Calls
are about removing friction, not selling.

## P1.C — Primary conversion goal: trial/signup activation

**Recommendation:** Define a new canonical terminal state:
`trial_activated` (or reuse `active_partner` with a new derivation
predicate — see P1.M backend section).

A row transitions to this terminal when **all three** are true:
1. Provider has clicked through to the platform (Smartlead click OR
   admin-confirmed visit).
2. Provider has accepted the program terms.
3. Provider has viewed their student queue at least once (or marked
   "I'm reviewing").

The first two are necessary; the third is the proof of intent. A
meeting *alone* does not transition the row — it's a touchpoint that
strongly predicts the transition.

**Why this matters:** today, "Became a Client" is the moment Dr.
DuBose accepts them at a meeting. Under the new model, the provider
can activate themselves without ever talking to Dr. DuBose, which is
the scale unlock.

## P1.D — Email strategy after Launch Outreach

**Single primary CTA** in every post-launch email, button-styled:

> **Review your students and start your trial →**

…linking to a magic-token URL: `olera.care/provider/medjobs/welcome?token=<...>`
that authenticates the provider (no signup friction) and lands them
on a personalized welcome page (P1.E).

**Secondary CTAs**, smaller below the main button:
- "Reply with any questions"
- "Or book a call with Dr. DuBose" (Calendly link)

**Why a magic token, not "sign up here":** the cold provider already
has zero motivation to fill a form. Frictionless click-through to a
real personalized page is the entire game.

**MVP shortcut if magic tokens are too heavy:** send them to a public
`/provider/medjobs/welcome?org=<slug>` page that doesn't auth them yet
but shows the same content + a single "Start your trial" form. Either
way the email's primary CTA is the platform, not Calendly.

## P1.E — Platform landing & the empty-state problem

The biggest risk. If the email gets the click but the page shows zero
students, the provider leaves and we never get them back.

**Recommendation:** the welcome page renders the **strongest signal
available** for that campus, in priority order:

1. **Real local students** (≥3 with profiles + photos). Show student
   cards with name, year, clinical interests, availability.
2. **Sample students from peers** ("Here's what TAMU students who
   joined look like — your campus pipeline is being recruited now").
   Use anonymized real profiles from sister campuses.
3. **"Recruiting in progress" banner** + concrete momentum: "We've
   reached 47 pre-nursing students at {campus} this week. Get the
   first picks when they join — claim your spot now."
4. **Generic landing fallback** with program overview + waitlist form
   that activates a trial slot for when students do arrive.

**The trial accepts terms even without students.** That's the unlock —
we want them activated before student volume catches up. The page UX:

- Above the fold: hero ("Welcome to Olera's {campus} Student Caregiver Program") + the activation CTA ("Accept terms and start your trial — free for 30 days").
- Below the fold: students (real or sample), how the program works, the PDF inline as a "More details" reveal, Calendly fallback.

**Backend impact:** new `business_profiles.metadata.trial_activated_at`
flag, plus a `provider_trial_states` table (or a `metadata.trial_state`
JSONB) tracking activation step (visited / terms_accepted / viewed_students / first_interview_requested).

## P1.F — Tracking / metrics (post-launch funnel)

Final state model (Smartlead-driven where possible):

| Event | Source | Touchpoint type | Already exists? |
|-------|--------|-----------------|-----------------|
| `email_sent` | Smartlead webhook | `email_sent` | yes |
| `email_opened` | Smartlead webhook | `email_opened` (new) | **add** |
| `email_clicked` | Smartlead webhook | `email_clicked` (new) | **add** |
| `email_replied` | Smartlead webhook (D2) | `email_replied` | yes |
| `email_bounced` | Smartlead webhook (D2) | `email_bounced` | placeholder |
| `platform_visited` | magic-token middleware | `note_added{reason:platform_visited}` | reuse note_added (G1) |
| `terms_accepted` | platform form | `note_added{reason:terms_accepted}` | reuse note_added (G1) |
| `students_viewed` | platform analytics | `note_added{reason:students_viewed}` | reuse note_added (G1) |
| `meeting_scheduled` | Calendly webhook OR admin | `meeting_scheduled` | yes |
| `trial_activated` | derived (terms + visit + view) | `stage_change` to `trial_activated` | new stage |
| `interview_requested` | platform action | `note_added{reason:interview_requested}` | reuse note_added |

**Discipline note (G1):** prefer `note_added` with a `reason` payload
for the soft platform events. New touchpoint types (`email_opened`,
`email_clicked`) are justified because they're a distinct event
shape with dedicated UI surfaces (Emails tab); the platform events
are pure CRM context and don't need a new type.

**MVP metric set** (what surfaces on dashboards first):
- Click-through rate (clicked / sent)
- Trial-activation rate (trial_activated / sent)
- Replies received (existing)
- Meetings scheduled (existing)
- Bounces (existing)

Open / click rates are useful but lower-priority than CTR and trial
activation — the latter two are the actual business signals.

## P1.G — MVP vs later

Aggressive MVP scope to get the new model in front of providers fast:

**MVP (Phase 1 implementation)**
- Cadence change: Day 0 email-only, Day 3 email+call, Day 5 call, Day 7 email. (~30 min change in `cadence.ts` + `templates.ts`).
- Email CTA refactor: every provider template gets the single "Review your students" CTA pointing at a placeholder `/provider/medjobs/welcome?org=<slug>` page.
- The welcome page itself: hero + terms acceptance + sample students fallback + Calendly fallback. No magic token; no real student feed integration yet. ("Coming soon: your real student queue").
- Smartlead webhook adds `email_opened` and `email_clicked` touchpoint emission.
- New `trial_activated` stage derivation (3 predicates), but **no terminal-state UI changes** yet — row still shows as `active_partner` in the existing tabs. We're just collecting the data.

**Phase 2 (later)**
- Magic-token authenticated welcome page.
- Real student-queue integration on the welcome page.
- Calendly two-way integration.
- Surfaces (P2.A through P2.F below).
- Trial activation as a first-class terminal state in the CRM UI.

This sequencing means the cold sender stays warm (cadence/CTA changes
are tiny), data starts flowing immediately (open/click tracking), and
the bigger UX work (tabs, timeline) lands once we have data to design
against.

---

# PLAN PHASE 2 — The surfaces

(only opens after Phase 1 is approved & the conceptual model is locked)

## P2.A — Next Step section after launch

The thin indicator we just shipped for pre-launch needs the inverse
treatment post-launch: it becomes the **action card**.

Per stage, what Next Step shows:

| Stage | Headline | Sub-line | Primary action |
|-------|----------|----------|----------------|
| in_outreach (no engagement) | "Awaiting reply or click" | "Next email: Day {X} on {date}. Next call: {date}." | "Log reply" (secondary) |
| email_opened (no click) | "They opened — give them a nudge" | "Opened {N}× last seen {date}. No click yet." | "Schedule a call now" |
| email_clicked (no trial yet) | "They clicked — close the loop" | "Visited the welcome page {date}. Haven't accepted terms." | "Call to walk them through trial activation" |
| trial_activated | "Trial active 🎉" | "Activated {date}. Last student view: {date}." | "Schedule a check-in" (secondary) |
| meeting_set | (unchanged from today) | | |
| bounce_fix | (unchanged from today) | | |

The card should always answer two questions: **what just happened?**
(the engagement signal in the sub-line) and **what should I do next?**
(the primary action).

## P2.B — Timeline split: Upcoming vs Past Activity

Currently `OutreachTimeline.tsx` is one mixed stream. Split into:

```
┌─── Upcoming ────────────────────────────────────────┐
│  ⌚ Tomorrow · Day 3 email                         │
│  📞 Fri · Day 3 call                                │
│  ⌚ Mon · Day 5 call                                │
└─────────────────────────────────────────────────────┘

┌─── Past Activity ──────────────────────────────────┐
│  📧 Sent · Day 0 email (Mon)                       │
│  👁  Opened · 3× (Mon, Tue, Wed)                   │
│  🖱  Clicked · CTA "Review your students" (Tue)    │
│  📞 Logged · Day 3 call · voicemail (Thu)          │
└─────────────────────────────────────────────────────┘
```

Engagement events (opens, clicks) cluster under the email they belong
to, not as standalone rows — same email gets multiple opens, keep the
timeline scannable.

Both sections collapse on long timelines; default-show Upcoming + last
3 past events.

## P2.C — In Basket tabs

**Recommendation:** keep the operational arc, rename "Replies" →
"Emails", smart-hide remains the rule.

Final tab set (left to right):

```
Prospects · Calls · Emails · Meetings · Clients · Partners · Candidates
```

(Sites stays in the sidebar; secondary tabs stay in ⋯ menu.)

The first four are the **operational hot zones** for an admin sitting
down to work the funnel. The right three are warm follow-up tabs.

## P2.D — Calls tab redesign

Two sections + a load-more:

```
┌─── Today's Calls (5) ───────────────────────────────┐
│  Comfort Keepers · College Station · Day 3         │
│    📞 (979) 555-0123                                │
│    💬 "Did you get our email Monday?"               │
│    [Log outcome]                                    │
│  …                                                  │
└─────────────────────────────────────────────────────┘

┌─── Upcoming (12 this week) ─────────────────────────┐
│  Tomorrow · 3 calls                                 │
│  Fri · 4 calls                                      │
│  Next Mon · 5 calls                                 │
│  [Show all upcoming]                                │
└─────────────────────────────────────────────────────┘
```

Each Today row carries: name + day + phone (tappable `tel:`) +
purpose hint + Log outcome button. The drawer is one click away for
full context.

The script lives in the call modal (already does, via the cadence's
per-day script payload).

## P2.E — Emails tab redesign

Renamed from Replies. Sections (smart-hidden when empty):

```
┌─── Needs Reply (3) ───── [most urgent] ─────────────┐
│  Real replies from providers that need an admin response.
└─────────────────────────────────────────────────────┘

┌─── Bounced (2) ───────────────────────────────────── ┐
│  Email correction required.
└─────────────────────────────────────────────────────┘

┌─── Clicked (12) ─────── [high signal] ──────────────┐
│  Provider clicked the trial link but hasn't activated.
│  Primary candidate for the Day-5 call.
└─────────────────────────────────────────────────────┘

┌─── Opened (40) ───────── [context] ─────────────────┐
│  Email reached them, no click yet. Lower priority —
│  the cadence will keep working.
└─────────────────────────────────────────────────────┘

┌─── Replied (closed) ───── [archive] ────────────────┐
│  Already-handled replies, collapsed by default.
└─────────────────────────────────────────────────────┘
```

**Distinction:** Opened ≠ action required. Clicked = action recommended
(they showed real interest). Replied/Bounced/Needs Reply = action
required. The tab ordering signals priority.

Each row opens the drawer at the touched-email's place in the
timeline. **No inline reply UI in MVP** — open the Smartlead inbox /
Gmail master inbox in a new tab (button on the row). The admin replies
there, then comes back and logs the outcome here.

(Later: inline reply via Smartlead's reply API — defer until volume
justifies it.)

## P2.F — Meetings tab + Calendly integration

Two paths into the tab:

1. **Provider self-schedules** via Calendly link in email →
   Calendly webhook → `mark_meeting_scheduled` action runs
   automatically (matches the provider's email to an outreach row).
2. **Admin schedules on provider's behalf** via the existing
   `LogMeetingModal` → already calls `mark_meeting_scheduled`.

Both paths land in the Meetings tab the same way. The Calendly path
sets `meeting_at` from the Calendly event; the admin path requires
the admin to enter it.

Tab sections:

```
┌─── Upcoming Meetings (this week) ──────────────────┐
│  Today · 2pm · Comfort Keepers (Day 5 follow-up)   │
│    📅 Calendly invite · 📋 Notes from outreach     │
└────────────────────────────────────────────────────┘

┌─── Needs Follow-up (4) ────────────────────────────┐
│  Meetings held but no trial activation yet.        │
│  Each row carries: meeting date, outcome notes,    │
│  trial-state ("not yet visited" / "visited, no     │
│  terms" / "terms accepted, no view").              │
└────────────────────────────────────────────────────┘

┌─── No-shows / Reschedule (1) ──────────────────────┐
└────────────────────────────────────────────────────┘
```

After-meeting outcomes (already handled by `LogMeetingModal`) need
one new option: **"Sent to trial — awaiting activation"** that drops
the row into Needs Follow-up rather than Converted. Converted now
requires the trial-activation predicate (P1.C), not just the
meeting outcome.

**Calendly integration scope (MVP):** Calendly webhook only, no
calendar embedding, no native scheduling UI. The email's "Book a
call" link stays Calendly-hosted.

## P2.G — Backend / state changes summary

Pulled from the surfaces above for a single migration view:

**New touchpoint types** (justified — distinct shapes + dedicated UI):
- `email_opened` (payload: `{open_count, last_opened_at}`)
- `email_clicked` (payload: `{cta_key, click_count, last_clicked_at}`)

**Reuses `note_added` (G1-compliant):**
- `platform_visited`, `terms_accepted`, `students_viewed`, `interview_requested`

**New stage** (derived, not stored):
- `trial_activated` — derived in `stage.ts` from the three platform
  predicates. `active_partner` stays in the status enum; this is a
  new derived stage above it.

**New metadata:**
- `business_profiles.metadata.trial_activated_at` (timestamp)
- `business_profiles.metadata.trial_state` (JSONB
  `{visited_at, terms_accepted_at, students_viewed_at, interview_requested_at}`)

**Smartlead webhook expansion:**
- Add `email_open` and `email_link_click` event handlers.
- Existing handler already covers `email_reply` and `email_bounce`.

**Calendly webhook:** new edge function `calendly-webhook/` (or
re-use the smartlead-webhook pattern). Matches invitee email to an
outreach row, dispatches `mark_meeting_scheduled`.

**Magic-token route (Phase 2-implementation only):** `app/api/medjobs/welcome/[token]` mints a one-shot session for the cold provider, redirects to `/provider/medjobs/welcome` with auth. Phase-1-implementation skips this and uses public URL.

**No new actions in `route.ts`** for MVP — every event above can be
expressed via existing actions (`log_email_replied`,
`mark_meeting_scheduled`, `note_added`, `make_client`). G2 satisfied.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Removing the Day 0 call loses signal we depend on | The Pre-Flight call already captures the "did you reach someone" signal; Day 0 paired call was redundant. Confirm with TJ before merging. |
| Email CTA change loses Calendly bookings | Keep Calendly link as secondary CTA. Track booking rate before/after on a per-campus basis. |
| Welcome page shows empty state, providers bounce | Sample-students fallback (P1.E option 2) is the hard-required mitigation. Don't ship the new CTA without it. |
| Smartlead open/click webhooks unreliable / costly | Start with click events only (lower volume, higher signal). Add opens later. Cost validated against Smartlead's free tier. |
| Calendly webhook can't match invitee to outreach row | Calendly forms collect invitee email; CRM matches by `lower(email) = lower(outreach.general_contact.email)`. Fall back to manual claim if no match (admin sees an "unmatched Calendly booking" tray). |
| Trial-activation derivation is wrong (false positives) | Three predicates AND-ed reduces false-positive risk. Audit first 20 transitions manually before turning on automated transitions. |
| Magic-token security (Phase 2) | Tokens scoped to one outreach row, short-lived (7-day TTL), single redemption that creates a real session. Pattern lives in caregiver-side auth already. |

## Open questions for Logan

A short list — answer these to unblock implementation cuts:

1. **Day 1 call** — does the new cadence really skip a Day 1 nudge? (S1 assumes yes.)
2. **Trial pricing/terms** — free 30-day trial is what I'm assuming. Confirm or correct.
3. **Magic token vs public URL** for the welcome page — MVP is public; long-term wants magic-token. Confirm the staging.
4. **Calendly account** — is there one already wired (Olera org), or is each `calendly.com/.../...` link individually owned by Dr. DuBose's personal account? Affects webhook setup.
5. **"Trial activated" terminal copy** — what do we *call* this state in the UI? `Trial Active`, `Activated`, `Client (Trial)`, etc.

---

## Implementation roadmap (post-approval)

This is **not** the implementation plan — it's the suggested order of
implementation tickets we'd cut from this strategy doc.

### Implementation Phase 1 (cadence + CTA + tracking)
1. Cadence change in `cadence.ts` (Day 0 no call; Day 3 +1; etc.)
2. Provider email template rewrite — single platform CTA.
3. Public `/provider/medjobs/welcome` page (terms acceptance + sample students + Calendly fallback).
4. Smartlead webhook: add `email_open` + `email_link_click`.
5. New touchpoint types (`email_opened`, `email_clicked`) + narration.
6. `trial_activated` derived stage (predicates only, no UI surfacing yet).

### Implementation Phase 2 (surfaces)
7. Timeline split (Upcoming / Past).
8. Next Step post-launch state branches (P2.A table).
9. Emails tab (rename + section model).
10. Calls tab Today/Upcoming sections.
11. Meetings tab + Calendly webhook.
12. `trial_activated` terminal-state UI (replaces `active_partner` for trial-pathway rows).

### Implementation Phase 3 (later)
13. Magic-token welcome page.
14. Real student-queue on welcome page.
15. Inline Smartlead reply UI (if volume warrants).

---

## Next step

**Approve the strategic shifts table** (top of this doc). If S1–S9
look right, we lock Plan Phase 1 and the next session writes a
real implementation ticket for the cadence + CTA + tracking changes
(Implementation Phase 1, items 1–6).

If any shift feels wrong, push back — that's exactly the
conversation to have *before* we start moving code.

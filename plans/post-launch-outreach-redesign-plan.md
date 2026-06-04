# Plan: Post-Launch Outreach Redesign — v3 (FINAL)

Created: 2026-06-03 (v1 → v2 → v2.1 → v2.2 → v3 same day, four feedback passes from Logan)
Status: **FINAL — all decisions locked. Ready for ticket cutting.**
Author: Claude

## Decisions log (all questions resolved)

Every previously-open question has a locked answer. Implementation
Phase 1 (P1.J / "MVP — Implementation Phase 1") is the next concrete
step; tickets 1–11 are ready to cut.

| # | Question | Decision |
|---|----------|----------|
| Q1 | Admin `make_client` also sets `pilot_active_through = now + 90d`? | **YES** (Claude's recommendation, not explicitly addressed by Logan in pass 4 — locking with this default so admin and self-serve paths produce identical state. Override if wrong.) |
| Q2 | Day 1 call deleted entirely under the new cadence? | **YES** — confirmed by Logan in pass 4. |
| Q3 | Calendly account ownership? | **Dr. DuBose's personal Calendly.** Phase 2 webhook setup will need a calendly.com personal-plan webhook subscription on Dr. DuBose's account. Worth pricing the cost/feature of moving this to an Olera org plan before Phase 2 ships. |
| Q4 | Demo-candidate copy & photo? | **Logan DuBose as a clearly-labeled demo profile.** Real face, real bio (founder + medical student), prominent DEMO badge. |
| Q5 | Magic-link token TTL? | **30 days.** |
| Q6 | Pilot expiry behavior (re-redact + Day-T-7 reach-out)? | **Defer to Phase 2.** MVP just sets the `pilot_active_through` timestamp; no expiry handling. |
| Q7 | Actions that trigger T&C modal? | **Invite to interview** + **See contact info** + **Save to shortlist** (Logan indifferent on Save; included for consistency). **Browsing + clicking into expanded student profile stays FREE.** |
| Q8 | Co-tenancy edge case default? | **A — read-only co-tenancy.** Sign in, candidate board in permanent preview mode for the cold clicker, axis-3 action attempts prompt "this org is already linked to another team member — want us to email them to add you?", emit `note_added(reason: "claim_conflict")` admin task. |
| Q9 | Axis 2 split (2a account-linkage vs 2b claim-status)? | **YES — ship the split.** Magic-link click advances only 2a (`account_id` set, `claim_state` stays `"unclaimed"`). Terms acceptance advances 2b (`claim_state → "claimed"`). Avoids spurious cron triggers on cold clickers. |
| Q10 | Welcome banner on landing? | **NO banner.** The candidate board IS the welcome; preview mode is communicated by disabled-action tooltips. |
| Q11 | Public listing deletion policy while pilot active? | **Block deletion** while `pilot_active_through > now()`. Provider sends written notice (per PDF) to end pilot; deletion then unlocks. |
| Q12 | T&C agreement checkbox default? | **Unchecked.** Continue button disabled until checked. Required for e-consent enforceability (ESIGN / UETA / GDPR). |
| Q13 | T&C reassurance bullet wording? | **Approved as drafted in P1.E T7.** Four plain-language bullets addressing payment / hiring obligation / employment responsibility / public listing requirement. |

## Reconciliation pass (v3.1 — Logan's pass 6)

Logan flagged that the post-launch operational tabs (Calls, Emails,
Meetings) have not received the same depth of attention as the
magic-link journey, despite being a major part of what we discussed.
Honest reconciliation against the artifact:

| Section | Lines in current plan |
|---------|----------------------|
| P1.E (magic-link journey + state model) | 311 |
| P2.A (Next Step post-launch) | 16 |
| P2.B (Timeline split) | 20 |
| P2.C (In Basket tabs) | 10 |
| **P2.D (Calls tab redesign)** | **6** |
| P2.E (Emails tab redesign) | 39 |
| P2.F (Meetings tab + Calendly) | 49 |

The disparity isn't a planning bug — Phase 2 surfaces are deferred
work, so they get sketched at strategy depth, not specified at
ticket-cutting depth. But Logan's concern is fair: at 6 lines for the
Calls tab against 311 for the journey, the surfaces will FEEL lost
when we come back to them, and details we discussed (per-row
component spec, voicemail outcome flow, contact-row vs general-
contact dispatch) are not captured anywhere.

### Reconciliation against Logan's six questions

**1. What major items from prior planning are included in the current plan?**

Strategy and conceptual locks for every domain Logan raised across the
four feedback passes:

- Day 0 call moved to Pre-Flight (P1.A — implemented; cadence change in MVP ticket 1)
- Post-launch call cadence (Day 0 / 3 / 5 / 7, P1.A)
- Per-call purpose (P1.B — "did you get our email?" / "anything we can help with?" / graceful close)
- Pilot Active as terminal state (P1.C — collapses into existing `interview_terms_accepted_at`)
- Magic-link email CTA, "Review {campus} student caregivers →" (P1.D)
- Full T0–T10 journey + four-axis state model (P1.E, 311 lines)
- Co-tenancy edge case + read-only fallback (P1.E)
- Empty-state ladder with Logan demo profile (P1.F)
- Pilot tier predicate extending `medjobs_subscription_active` (P1.I)
- Public listing required while pilot active (P1.E.5)
- Tracking touchpoints model — engagement updates `email_sent` payload, no new types (P1.H)
- Strategic shifts S1–S16 (top of doc)
- MVP scope: 11 tickets, ~23 days (P1.J)
- **Conceptual locks for Phase 2 surfaces** (P2.A–G) — direction is set, depth is light

**2. What major items are missing or under-treated?**

These items came up in prior conversation and are EITHER missing from
the current doc OR sketched at "concept" depth when they need
"specification" depth:

**Under-treated** (concept locked, depth missing):
- **Calls tab UX** — 6 lines. Missing: per-row component spec (call-script payload integration, contact-row vs general-contact dispatch, "next call due tomorrow / Fri / next Mon" grouping, log-outcome inline vs in modal, voicemail-then-re-call edge case).
- **Emails tab event taxonomy** — 39 lines. Single-stream model locked but missing: Smartlead webhook payload → CRM touchpoint mapping table, per-event-type row UI, the "open Smartlead inbox" deep-link mechanic (master inbox vs per-mailbox, reply-thread context handoff), how the activity log paginates.
- **Meetings tab outcome state machine** — 49 lines. Calendly matching is sketched but missing: Calendly cancel/reschedule webhook handlers, post-meeting sub-state model ("needs follow-up email" / "needs follow-up call" / "asked for time to think" / "pre-pilot-active") that Logan explicitly raised, integration with `LogMeetingModal` outcome enum.
- **Next Step content per post-launch stage** — 16 lines. Today's drawer has 8 stages (prospect / in_outreach / call_due / meeting_set / follow_up / bounce_fix / converted / closed); the Next Step table only covers 5 post-launch states. Missing: engagement-driven sub-states (opened-not-clicked, clicked-not-activated, pilot-active-going-dormant) and the per-stage action prompts.
- **Engagement → call priority** — Logan said clicked rows should rise in admin attention. Mentioned in P2.A but no priority-queue logic specified.
- **Pilot-active provider returning experience** — what does a returning Pilot Active provider see on their second visit? The plan handles first visit (T9) but not the returning-provider dashboard, settings, or re-engagement.

**Truly missing** (not in the plan at all):
- **Smartlead-inbox deep-link mechanic** — implied by P2.E but never specified. Needed for ticket cutting on the Emails tab.
- **Calendly cancel / reschedule webhook events** — only `invitee.created` is in P2.F. `invitee.canceled` + reschedule are not covered.
- **Email-engagement → outreach-row priority queue** — clicked rows should jump priority in the Calls tab; the trigger logic isn't defined.
- **Pilot-active dormancy re-engagement** — provider activates pilot, doesn't invite anyone for a week — what happens? Not addressed.
- **Provider feedback collection surface** — the pilot agreement says Olera "may request feedback" (optional). No surface for this exists in the plan.
- **Brand consistency at click time** — cold email from `@findmedjobs.co` → landing on `olera.care`. Mentioned as a follow-up item but never specified as an email-body insertion.
- **Admin pilot metrics dashboard** — tracking from P1.H (CTR, activation rate, etc.) needs a surface; not designed.

**3. What items are intentionally deferred?**

- Inline Smartlead reply UI (Phase 3) — volume-dependent
- Magic-token verification (Phase 3) — existing verification flow is independent and stays as-is
- Pilot continuation flow (Phase 3) — post-3-month paid conversion
- Provider self-serve admin tools (Phase 3) — edit org info from welcome page
- Self-serve End-Pilot surface (Phase 2) — MVP relies on "contact us" per PDF
- Pilot expiry behavior (Phase 2 per Q6 decision)
- Multi-org-per-user team support (long-term) — co-tenancy edge case punts on this

**4. What items should be added before implementation?**

Two tiers of "added back":

**Tier 1 — Add before any code moves** (load-bearing for MVP):
- A brief amendment to **MVP ticket 2** (email template rewrite) noting the brand-consistency one-liner ("...you'll land on olera.care, our main platform.") so we don't re-do email copy later.

**Tier 2 — Deepen before Phase 2 tickets are cut** (load-bearing for Phase 2, not MVP):
- P2.D Calls tab → 6 lines → ~50 lines (per-row spec + grouping logic + edge cases)
- P2.E Emails tab → 39 lines → ~80 lines (event mapping table + Smartlead deep-link + row UI + activity-log pagination)
- P2.F Meetings tab → 49 lines → ~90 lines (Calendly cancel/reschedule + post-meeting sub-states + LogMeetingModal updates)
- P2.A Next Step → 16 lines → ~50 lines (all post-launch states + engagement-driven sub-states + action prompts)

The work to deepen these is ~3 days of strategy work, not weeks of
code. It would happen during MVP development (parallel) or right
after MVP ships and before Phase 2 begins.

**5. Are Calls, Emails, and Meetings being treated as a major workflow redesign or as minor follow-up work?**

Honest answer: **conceptually treated as major workflow redesign;
operationally treated as deferred Phase 2 work**. The strategic shifts
(S6–S9) and the P2.A–G sections reflect that they're a major rethink,
but the implementation depth isn't there yet — and won't be until we
deepen them per Tier 2 above.

The PHASING is correct: ship MVP (conversion path) first, deepen
surfaces (admin UX) second. But the DEPTH of treatment for the
Phase 2 surfaces in the current doc is lighter than it should be
given how much we discussed. They're at "strategy + scaffolding"
depth, not at "ticket-cuttable specification" depth.

**6. Are there any other important topics we discussed that have fallen out of scope?**

Mostly the items in question 2 (the "truly missing" bucket). One
additional concern surfaced by writing this reconciliation:

- The **student-side flow** when a provider invites them to interview is entirely outside the plan. The plan ends at "provider clicks Invite to interview" and assumes the student side just works. If the student-side experience isn't already designed, that's a parallel scope item that should be tracked separately.

### Recommendation (what to do next)

**Do NOT promote anything from Phase 2 to MVP.** The MVP scope
(tickets 1–11, ~23 days) is the right shape — it ships the
conversion path that the strategic shifts are about. Promoting
surfaces would expand MVP into a multi-month project before
providers see any change.

**DO add a small amendment to MVP ticket 2** for the brand-
consistency one-liner. ~30 minutes of work; locks the email copy
before we write it.

**DO write a "Phase 2 surface depth" pass** as a separate planning
deliverable BEFORE Phase 2 tickets are cut. Suggested order:

- Pass A: Deepen P2.D + P2.E (Calls + Emails) — these ship together because Emails-tab clicks drive Call priority. Half-day of strategy work each.
- Pass B: Deepen P2.F (Meetings + Calendly) — full-day because of the webhook + outcome state machine.
- Pass C: Deepen P2.A (Next Step per stage) — half-day to enumerate all post-launch sub-states.

These can happen during MVP development (parallel) so Phase 2 tickets
are ready to cut the moment MVP ships.

**DO NOT do Pass A/B/C right now.** They depend on MVP data flowing
to validate UX assumptions (e.g., do admins actually rank clicked
rows higher? we don't know until we see open/click data). Doing them
now risks designing surfaces against assumptions instead of
observations.

**Concrete next move**: Cut MVP tickets 1–11 (P1.J) as planned. Add
the brand-consistency one-liner to ticket 2's scope. When MVP ships
to staging, write Phase 2 deepening passes A/B/C using real data
from the first wave of providers.

If you'd rather do Phase 2 depth-passes NOW (before MVP), I can — but
the trade-off is ~2 days of strategy work that will get partially
re-done after we see real engagement data. The wiser path is to ship
MVP first.

---

## Version history (collapsed)

- **v1** (initial pass) — first draft from Logan's "what about post-launch" prompt. Strategic shifts S1–S9. MVP centered on trial activation.
- **v2** (PDF + infra survey) — six material revisions after reading the pilot agreement PDF + surveying existing magic-link / claim infrastructure. "Pilot" not "trial"; existing `interview_terms_accepted_at` instead of new derived stage; magic-link promoted to MVP. Strategic shifts grew to S1–S12.
- **v2.1** (Logan's pass 3) — rigorous four-axis state model + T0–T10 journey table after Logan pushed back on v2's hand-waving. Split axis 2 into 2a (account-linkage) and 2b (claim-status). Strategic shifts S1–S14.
- **v2.2** (Logan's pass 4) — T&C modal UX redesigned with 4 reassurance bullets + unchecked checkbox; public listing required while pilot active; welcome banner cut. State-distinction reference table added. Strategic shifts S1–S16.
- **v3 (FINAL)** — all 13 open questions resolved. Plan is decision-locked and implementation-ready.

The four "what changed from previous version" sections below preserve
the audit trail.

---

Logan's third feedback pass focused on the actual T&C modal UX, the
relationship between pilot membership and the public provider listing
(can a participating provider delete their listing?), and a cut: the
welcome banner I'd proposed in v2.1 is probably clutter and should go.

Material v2.1 → v2.2 revisions:

| # | What changed | Why |
|---|--------------|-----|
| Δ7 | **Three actions trigger T&C, not one.** Invite to interview, Save to shortlist, See contact info — all "meaningful student engagement" actions gate on terms acceptance. Browse + filter remain free. | Anchoring T&C to just one action (invite) misses providers who want to shortlist or look up contact first. The unifying rule is "any action that touches a specific student's identity or your relationship with them." |
| Δ8 | **T&C modal redesigned** with plain-language reassurance bullets answering the four predictable provider concerns (payment, hiring obligation, employment responsibility, public listing). Full agreement linked + PDF download. **Unchecked checkbox by default** (legal best practice). Continue button verb-matched to the action they were trying to take. | A "scary legal wall" loses providers at the conversion moment. The reassurance bullets resolve the four objections most providers will have before reading any legalese. Unchecked-by-default is required for meaningful e-consent enforceability (US/EU norm). |
| Δ9 | **Public provider listing is required while pilot is active.** New backend guard: delete-profile flow blocks deletion when `pilot_active_through > now()`. Provider can edit freely; can end the pilot via written notice (per PDF) to unlock deletion. T&C modal includes this acknowledgment as one of the reassurance bullets. | First-principles: students invited to interview need to research the agency; families clicking through Olera need to find them. A pilot-active row without a public listing creates a broken ecosystem state. |
| Δ10 | **Welcome banner removed from T5.** The candidate board IS the welcome. Preview mode is communicated by the disabled action buttons + their tooltip, not a separate banner. | Logan's directive: "less is more." A welcome banner doesn't add value the disabled buttons aren't already conveying. Removing it tightens the first impression. |
| Δ11 | **State-distinction reference table** added to P1.E for quick lookup. Four mutually distinct states (public listing exists / portal access / pilot active / claimed and verified) with a one-row "what this means publicly and operationally" table. | Logan's §6 ask: "Do not conflate these unless that is truly the best architecture." Surfacing the distinctions at-a-glance makes future drift less likely. |

## v2.1 update — what changed from v2

Logan pushed back on v2's hand-wavy treatment of "magic-link is MVP"
(Δ5) and "just-in-time account creation" (Δ6). He's right — those two
lines glossed over what is actually the *most consequential* design
decision in the whole plan: how a cold provider's identity, claim
status, pilot membership, and verification state interact across the
email → click → browse → activate journey.

v2.1 keeps every other v2 decision intact but **replaces section P1.E
in full** with a rigorous state model and step-by-step journey. The
key conceptual revision: these are **four orthogonal state axes**,
not one stacked progression.

| Axis | Field(s) | Question it answers |
|------|----------|---------------------|
| 1. Authentication | `auth.users`, `accounts` | Are you signed in? |
| 2. Profile ownership | `business_profiles.account_id`, `claim_state` | Are you operating this org's CRM profile? |
| 3. Pilot membership | `metadata.interview_terms_accepted_at`, `metadata.pilot_active_through` | Are you participating in the 3-month pilot? |
| 4. Public verification | `verification_state` | Have we publicly verified your claim (drives the "Claimed" badge)? |

A provider can be in any combination of these. Magic-link click
advances axes 1 and 2. Terms acceptance advances axis 3. Formal
verification (existing flow) advances axis 4. Each is its own
transition with its own trigger.

The journey, the CTA copy, the T&C placement, and the edge cases all
fall out of this state model. Detailed in revised P1.E below.

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
| Δ5 | Magic-token is a Phase-2 nice-to-have; MVP uses a public URL | Magic-token is **MVP**. Plug `/api/auth/auto-sign-in` → `claim-instant` logic → land directly on the candidate board (no separate welcome page). Token carries `{outreach_id, email, jti, expires_at}`; one-shot, 30-day TTL. | The infrastructure survey confirmed `auto-sign-in` + `magic-link` are production-grade and reusable. Public URL would force re-onboarding work later. v2.1 also clarifies: this advances axes 1 + 2 only; pilot membership and public verification stay at their pre-click values. |
| Δ6 | Pre-create accounts so the welcome page can personalize | **Just-in-time account creation** on first magic-link click. Click → server handler resolves token → silent `auto-sign-in` + (only if no business_profile exists) `claim-instant` → session → redirect to candidate board. | Pre-creating accounts that may never be claimed leaves zombie rows in `business_profiles` and false claim signals in the directory. JIT keeps state honest. v2.1 also defines the edge case for orgs already claimed by a different account (read-only co-tenancy + admin reconcile task). |

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
| S3 | CTA = "reply or book a call" | CTA = **"Review {campus} student caregivers →"** (campus-personalized). Reply + Calendly are secondary. No "trial" language. |
| S4 | Calls re-pitch the program | Calls confirm receipt, answer questions, redirect to the link. The PDF + the platform carry the pitch. |
| S5 | Meeting = terminal-positive | Meeting = high-signal lead. Pilot Active is terminal. |
| S6 | Timeline = single stream | Timeline = **Upcoming** + **Past Activity**. |
| S7 | "Replies" tab = email replies only | "Emails" tab = single event stream, smart-filtered with Needs Reply + Bounced pinned, lower-signal collapsed by default. |
| S8 | Open/click events not surfaced | Open/click events update the existing `email_sent` touchpoint's payload — one row per email with engagement chips, not a flood of new rows. |
| S9 | Calendly = link in the email | Calendly = inbound webhook. Self-booked + admin-booked both land in Meetings tab via the same `mark_meeting_scheduled` action. |
| **S10** (new) | Onboarding is a multi-step flow | Onboarding is **the magic-link click**. `auto-sign-in` + `claim-instant` happen silently in one server handler; provider lands authenticated. The "form" is the PDF terms button — and it only appears at the first action that requires it. |
| **S11** (new) | Welcome page is a marketing landing | There is no separate landing page. The provider's first impression IS the candidate board (with a thin welcome banner). Browse first, T&C later. |
| **S12** (new) | Empty-state is "students recruiting" | Empty-state is a tiered fallback: real local students → sample students from peer campuses → labeled demo candidate (Logan as a clearly-marked demo) → "recruiting in progress" momentum. The page must *always* show something usable. |
| **S13** (v2.1 new) | Magic-link click ≈ full activation | Magic-link click advances **two of four+ state axes** (auth identity + CRM-internal account-linkage), not all of them. Pilot membership requires terms acceptance. Public verification badge requires the existing verification flow. See P1.E for the four orthogonal axes. |
| **S14** (v2.1, revised v2.2) | T&C appears on landing | T&C appears at the first **meaningful student engagement** action — any of *Invite to interview*, *Save to shortlist*, *See contact info*. Browse + filter remain free. The modal CTA carries the verb of the original action ("Agree and invite this student"). |
| **S15** (v2.2 new) | T&C is a single-line legal acknowledgment | T&C modal is a **plain-language reassurance card** with four bullets addressing the predictable provider concerns (payment, hiring obligation, employment responsibility, public listing requirement), plus full-agreement link, PDF download, **unchecked agreement checkbox** (legal best practice for e-consent enforceability), and an action-verb-matched continue button. |
| **S16** (v2.2 new) | Provider can delete their public listing at any time | While `pilot_active_through > now()`, deletion of the public listing is **blocked** by the backend. Provider can edit freely. To delete: end the pilot via written notice (per PDF) → `pilot_active_through = now()` → deletion unlocks. T&C explicitly notes this so it isn't a surprise. |

If any of S1–S16 is wrong, the rest of this doc is wrong.

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

Primary CTA in every post-launch email, campus-personalized,
button-styled:

> **Review {campus_name} student caregivers →**

…linking to a magic-link URL: `olera.care/medjobs/m/<token>`. Token is a server-signed one-shot blob containing `{outreach_id, email, jti, expires_at}` with 30-day TTL. Full journey in P1.E.

Secondary CTAs, smaller text below the button:
- "Or reply with any questions"
- "Want to chat first? Book a quick call with Dr. DuBose →" (Calendly)

The Day 0 / Day 3 / Day 7 emails all carry the same single primary
CTA. Body copy differs (intro → light follow-up → graceful close) but
the action is consistent.

**Body copy tone** (illustrative, not final):

> Hi Mr. French,
>
> Graize here, on behalf of Dr. Logan DuBose at Olera. We've been
> recruiting pre-nursing and pre-medical students from Texas A&M who
> are looking for caregiver shifts — and HomeSpark Care stood out as
> a great fit to invite into our pilot.
>
> Take a look at the students near you:
>
> **[ Review Texas A&M student caregivers → ]**
>
> A short background on the pilot is attached. If you'd rather chat
> first, you can [book a quick call with Dr. DuBose] — no pressure
> either way.

Notice: no "trial," no "subscription," no "start now" language. "Pilot" appears once as honest framing for why we're inviting them; the CTA is about reviewing students, not about activating anything.

## P1.E (revised in v2.1) — Provider journey & state model

### The state model (four orthogonal axes)

A provider's state across our system isn't a single linear progression
— it's four independent axes. Magic-link click advances axes 1 + 2.
Terms acceptance advances axis 3. Formal verification (existing flow,
unchanged) advances axis 4.

**Axis 1 — Authentication identity.** Are they signed in?
- Backed by `auth.users` (Supabase) + `accounts` (our row).
- Values: `unauthenticated` | `authenticated`.
- Magic-link click sets this. Persists via cookie session afterward.

**Axis 2 — Profile ownership.** Split into two sub-axes because the existing codebase treats them as related-but-distinct signals:

- **Axis 2a — Account linkage.** Has someone been granted platform-level access to operate this org's profile? Backed by `business_profiles.account_id`. Values: `null` (no account linked) | `<uuid>` (linked).
- **Axis 2b — Claim status.** How formally has that account identified themselves? Backed by `business_profiles.claim_state`. Values: `unclaimed | pending | claimed | rejected | archived`.

**Why split:** today the existing claim flows (`claim-instant`, `claim-listing`) advance 2a and 2b together at the same moment, because both require explicit user identification. The magic-link flow is weaker — clicking a link is not the same as identifying yourself as the org's operator. Splitting lets the magic-link click advance 2a (we now have a platform link to act through) without falsely advancing 2b (the formal "I'm the operator" representation).

- **Magic-link click advances 2a only.** Sets `account_id` if it was NULL; leaves `claim_state` unchanged (typically still `"unclaimed"`).
- **Terms acceptance advances 2b.** Sets `claim_state = "claimed"` because signing the pilot agreement is a formal representation that the signer can bind the org.

**Why this matters for the rest of the system:** Several existing cron paths gate on `claim_state = "claimed"` (`medjobs-digest`, `google-reviews`, others). Under v2.0's wording (claim at click), every cold-clicker would have triggered those crons immediately — Google Places billing for reviews refresh would fire on cold providers, the digest would email people who hadn't actually opted in. Under v2.1's split (click → 2a only; terms → 2b), the cron triggers stay aligned to actual provider commitment.

**Public listing impact (axis 4):** the public "Claimed" badge requires BOTH `claim_state = "claimed"` AND `verification_state = "verified"` (per `app/provider/[slug]/page.tsx:610`). Magic-link click affects neither, so the public listing is fully unchanged. Terms acceptance advances 2b but not axis 4, so the badge still doesn't appear until the provider goes through formal verification at their own pace.

**Axis 3 — Pilot membership.** Are they participating in the 3-month pilot?
- Backed by `business_profiles.metadata.interview_terms_accepted_at` (timestamp, existing field) + `business_profiles.metadata.pilot_active_through` (timestamp, new field).
- Values: `not_active` | `active` (terms accepted and pilot window unexpired) | `expired` (terms accepted but pilot window passed).
- Terms acceptance sets both fields. Drives access to candidate board's full data (P1.I) and the right to invite students to interview.

**Axis 4 — Public verification.** Have we publicly verified the claim?
- Backed by `verification_state`.
- Values: `unverified | pending | verified | rejected | not_required`.
- Independent of magic-link flow. Provider goes through existing verification routes (`/api/provider/verify/...`) at their own pace. Drives the public "Claimed" badge.

**Why orthogonal matters:** A provider can be Authenticated + Account-Linked-only (2a) + Pilot-Active (3) + Publicly-Unverified (4) + Not-Formally-Claimed (2b stays `"unclaimed"` because they only signed the pilot, not the formal verification). That's the most common state under the new flow, and it's perfectly valid. The codebase's two key gates remain coherent:
- Public listing "Claimed" badge: still requires (2b: claimed AND 4: verified). Magic-link + pilot terms do NOT trigger this; formal verification does.
- Pilot board full mode: gated on axis 3 only. Pilot terms acceptance is sufficient.

Each axis advances when its trigger fires. No silent overreach.

### Answering Logan's 10 questions explicitly

| # | Question | Answer |
|---|----------|--------|
| 1 | When provider receives the magic link, what account/auth record exists? | **None.** No `auth.users`, no `accounts`, no `business_profiles` mutation. The token in the URL is the entire record — it carries `{outreach_id, email, jti, expires_at}` signed server-side. The directory listing (`olera-providers`) row exists but that's not an account; it's a scraped record. |
| 2 | Does clicking the magic link mean they've "claimed" the profile? | **No, not formally.** It advances axis 2a only (account-linkage — sets `business_profiles.account_id` if previously NULL). `claim_state` stays `"unclaimed"`. The formal "claim" semantic — and the cron triggers that depend on it — fire at terms acceptance (T8), not at click. This is wiser than v2.0's reading because clicking an email is not the same as identifying yourself as the org's operator. |
| 3 | Or does it only authenticate them into a limited portal? | Authentication (axis 1) advances, account-linkage (axis 2a) advances, claim-status (axis 2b) does NOT advance, pilot membership (axis 3) does NOT advance, public verification (axis 4) does NOT advance. They get a session and a CRM-internal account-link, but no formal claim, no pilot privileges, no public badge. The "limited portal" is the candidate board in preview mode. |
| 4 | How does this relate to the existing claim/verification system? | The magic-link path REUSES the `claim-instant` insertion logic for creating `business_profiles` rows that don't exist yet — but writes `claim_state = "unclaimed"` instead of `"claimed"`. (This is a new pattern: `account_id NOT NULL` + `claim_state = "unclaimed"`. Distinct from anything the existing flows produce.) The existing claim/verification system remains the ONLY path to formal claim + verified states for providers who want them. Magic-link is a softer parallel track for pilot-only access. |
| 5 | If provider already has an account, what happens? | We resolve to their existing `auth.users` + `accounts` row via the `auto-sign-in` primitive. Session established. If they've ALREADY claimed THIS specific business_profile, no claim mutation runs — axis 2 is already at `claimed` for this profile. They go straight to the candidate board with whatever pilot/verification state they had. |
| 6 | If provider does not have an account, what happens? | `auto-sign-in` creates `auth.users` with `email_confirm: true` (silent — no separate confirmation email), creates `accounts`, and creates `business_profiles` via `claim-instant`-style insertion BUT writes `claim_state = "unclaimed"` (not `"claimed"` — see Q2). Session established. Land on candidate board in preview mode. Pilot membership (axis 3) NOT yet activated. |
| 7 | What identity do we use to authenticate them? | The email we sent the cold outreach to — typically the General Contact email from `outreach.research_data.general_contact.email`. NOT the Decision Maker email (they may or may not have one, and it's a softer signal). NOT a separate "provider organization email" — there isn't one. The General Contact is the most reliable email per row. |
| 8 | What permissions do they have immediately after magic-link click? | (a) Browse the candidate board, filtered to their catchment. (b) View preview cards (name, year, brief bio, photo). (c) Click a student card to see expanded bio. (d) See "Edit your profile" surface if/when we expose it. **They CANNOT** (yet): invite students to interview, save students to a shortlist, see student contact info, see Verified badge publicly. Those unlock at axis 3 (terms acceptance). |
| 9 | When do they become Pilot Active? | The moment they accept the pilot terms via the T&C modal. The trigger is the first action click that requires axis 3 — typically "Invite to interview" on a specific student. Modal interrupts that action; on accept, the action proceeds and Pilot Active is set. |
| 10 | When and where do they accept terms? | At first axis-3 action attempt. NOT as a sign-up wall. NOT on landing. T&C lives inside a modal triggered by "Invite to interview" / "Save student" / "See contact info" — whichever they reach first. The modal explains the pilot (3-month free, either party can end with written notice) and shows the PDF inline. Single CTA: "Accept and continue." |

### The exact 10-step journey

**T0 — Email send time** (no account state mutation yet):
- Outreach row exists in `student_outreach` table with `general_contact.email = "info@homesparkcare.com"`.
- Smartlead sends the email; CTA button links to `https://olera.care/medjobs/m/<token>`.
- `<token>` is a server-signed JWT containing `{outreach_id, email, jti, expires_at: now + 30d}`. JTI is a UUID stored in a revocation set for one-shot redemption.

**T1 — Click time / Step A: Token redemption** (`/medjobs/m/[token]/route.ts`):
- Server decodes token, verifies signature, checks expiry, checks JTI not previously redeemed.
- Resolves to `{outreach_id, email}`, loads the outreach row to get `provider_id` and `organization_name`.
- Bad token → redirect to a "this link expired" page with "Request a new one" form.

**T2 — Click time / Step B: Account resolution** (axis 1):
- Look up `auth.users` by email:
  - **Exists:** call `auto-sign-in` → get magic-link token hash → server-side `verifyOtp({ token_hash, type: "magiclink" })` to establish session.
  - **Doesn't exist:** `admin.createUser({ email, email_confirm: true })` (no confirmation email sent), then `auto-sign-in` flow as above.
- Call `/api/auth/ensure-account` to ensure `accounts` row exists.
- Now: axis 1 = `authenticated`.

**T3 — Click time / Step C: Profile resolution** (axis 2a only):
- Look up `business_profiles` where `source_provider_id = outreach.provider_id`:
  - **Doesn't exist:** server-side INSERT with `account_id = <this user>`, `claim_state = "unclaimed"` (NOT "claimed"), `verification_state = "unverified"`, `source_provider_id` linked. Reuses the `claim-instant` route's insertion logic but with the softer claim_state. Now axis 2a = linked, axis 2b = unclaimed.
  - **Exists, `account_id IS NULL` (truly unclaimed):** UPDATE to set `account_id = <this user>` only; leave `claim_state` at `"unclaimed"`. Now axis 2a = linked, axis 2b stays as-is.
  - **Exists, `account_id = <this user>` (already linked):** no-op.
  - **Exists, `account_id != <this user>` (linked to someone else):** EDGE CASE — see below.
- Audit: emit `note_added` touchpoint on the outreach row with `reason: "platform_visited"` and payload `{token_jti, user_id, business_profile_id}`.

**Why this is safe:** the resulting state (`account_id NOT NULL` + `claim_state = "unclaimed"`) is a new pattern in the codebase, but no existing code path treats `account_id` alone as the claim signal — every gate reads `claim_state`. Crons that fire on `claim_state = "claimed"` (digest, reviews refresh) are untouched. Public listing rendering is untouched.

**T4 — Click time / Step D: Redirect to candidate board:**
- Redirect to `/medjobs/candidates?campus=<their_campus>` (or whatever the catchment query param is).
- Session cookies persist for subsequent visits.

**T5 — Land on candidate board** (axis 3 still not active):
- No welcome banner (revised in v2.2 — see rationale above).
- Student cards render in **preview mode**: name, year, brief bio, photo, no contact info. Action buttons (Invite to interview, Save to shortlist, See contact info) visible but disabled-with-tooltip: "Accept the pilot agreement to {verb}".
- Filters work fully (catchment, availability, languages, certifications — existing on the page).
- Empty-state ladder applies (P1.F): real → sample → demo → recruiting-momentum.

**T6 — Browse experience** (no T&C wall):
- Browse, filter, click student cards to see expanded profiles. All free.
- No T&C friction. The browsing experience is meant to deliver value first.

**T7 — First meaningful engagement attempt** (triggers axes 2b + 3 transition):

Three actions are gated on pilot acceptance — collectively the
"meaningful student engagement" set:

| Action | Why it's gated |
|--------|----------------|
| **Invite to interview** | Touches the student's relationship with the provider; creates expectations on both sides. |
| **Save to shortlist** | Implicit commitment signal; pulls the student into a private workflow. |
| **See contact info** | Hands over a student's personal contact details — should not happen without agreement to the program terms. |

The first click on any of these opens the T&C modal. Browse + filter
remain free.

**T&C modal — content & UX** (v2.2 spec):

Title bar (varies by action — verb-matched):
- "Before you invite this student"
- "Before you save this student"
- "Before you view contact information"

Intro line:
> "One quick agreement so we can get {org_name} set up. Here's what you're saying yes to:"

Reassurance bullets (4, in plain language, addressing the predictable provider concerns from Logan's feedback):
- ✓ **Free for 3 months** — no payment information needed.
- ✓ **No obligation to hire anyone** you review or interview.
- ✓ **Your agency makes all hiring decisions** — we just connect you with students.
- ✓ **Your public Olera profile stays visible** while you're in the pilot — students and families need to find you. ([Learn why →])

Reference links (below the bullets, smaller):
- [Read the full pilot agreement →] (opens modal-within-modal or a side panel)
- [Download as PDF →] (link to the original `pilotagreementhomespark.pdf` template, org-personalized)

Agreement checkbox (**UNCHECKED by default** — see "Why unchecked" below):
- ☐ I have read and agree to the pilot agreement.

Primary CTA (verb-matched to original action, disabled until checkbox checked):
- "Agree and invite this student" / "Agree and save this student" / "Agree and view contact info"

Secondary action:
- "Cancel" (closes modal, no state change)

**Why unchecked-by-default is wisest** (pressure-tested per Logan's ask):
- US e-sign norms (ESIGN Act + UETA) require **clear, affirmative consent** for electronic agreements to be enforceable. A pre-checked box is widely viewed as not satisfying "affirmative" — it requires the user to take action to un-consent rather than to consent.
- EU/GDPR similarly requires "unambiguous indication" via "a clear affirmative act."
- Industry/UX research (Nielsen, Baymard) treats pre-checked checkboxes as a dark pattern.
- Practical: the friction of checking a single box is essentially zero, while the legal certainty of an unchecked-by-default flow is significant.
- **Recommendation: unchecked, must be actively checked to enable the CTA.**

**Visual tone:** matches the existing `LogModalShell` pattern from
`components/admin/medjobs/LogModalShell.tsx` — clean, professional,
not legalese-heavy. Card-style modal, ample whitespace, no scary
border colors.

**Implementation note:** the modal mounts whichever action the
provider was trying to take in component-local state, so on accept the
modal's continue handler runs (a) the pilot-activate API call, then
(b) the original action handler with the now-unlocked permissions. No
re-click required. Single-flow UX.

**T8 — Accept T&C** (axes 2b + 3 transition together):
- POST `/api/medjobs/pilot/activate` with `{business_profile_id, source: "self_serve", original_action: "invite_to_interview", student_id?}`.
- Server-side, in a single transaction:
  - SET `business_profiles.claim_state = "claimed"` (axis 2b advances — the pilot signature IS the formal "I represent this org" identification).
  - SET `business_profiles.metadata.interview_terms_accepted_at = now()` (axis 3).
  - SET `business_profiles.metadata.pilot_active_through = now() + interval '90 days'` (axis 3).
  - SET `business_profiles.metadata.terms_accepted_via = "self_serve"` (audit; differentiates from `make_client` admin path).
  - Transition outreach row → `active_partner` via the EXISTING conversion engine (reuses `make_client` internals so the CRM-side state is identical to the admin path).
  - Emit `stage_change` touchpoint.
- Modal closes. The original action (e.g., invite to interview) proceeds with the now-unlocked permissions.
- Now: axis 2b = `claimed`, axis 3 = `active`. Public listing now would show "Claimed" badge IF the provider also went through verification — but they don't have to. They can stay pilot-active forever without verifying. Verification just unlocks the public badge separately.

**T9 — Subsequent visits** (session persistence):
- Provider opens `olera.care/medjobs/candidates` directly. No magic link needed; session cookie carries auth.
- Candidate board now renders in full mode (axis 3 = active). Contact info visible. Invite buttons enabled. No preview banner.

**T10 — CRM reflection** (no separate work, falls out of T8):
- Row drops out of active In Basket tabs (Prospects / Calls / Emails) because status is now `active_partner`.
- Surfaces in Clients tab (existing).
- Timeline shows: email_sent → email_opened → email_clicked → platform_visited → stage_change.
- Partner Prospects unlock for the catchment (existing `make_client` behavior).

### Edge case: org already claimed by another account

When magic-link click resolves a `business_profiles` row whose
`account_id` belongs to a different user (e.g., owner claimed it last
year; we cold-emailed `info@`, a different person, who clicked).

**MVP behavior — read-only co-tenancy:**
- Sign the cold-email recipient in (axis 1 = `authenticated`).
- Do NOT mutate `business_profiles.account_id` or `claim_state` (axis 2 stays at whatever the original claimer set).
- Redirect to candidate board in **read-only preview mode** (same as pre-T&C state).
- Any action that would require axis 3 transition prompts:
  > "This organization is already linked to another team member's account ({redacted_email}). Want us to email them to add you?"
- That prompt emits an admin task ("two-person claim conflict on {outreach_id} — reconcile") rather than auto-resolving. Manual reconciliation in admin.

**Why not auto-merge:** Multi-user team support isn't built (one
business_profile = one account_id today). Auto-mutating an existing
claim would silently overwrite the other user's ownership. Read-only
co-tenancy is safe and flags the conflict for human resolution.

**Audit:** still emit the `note_added(reason: "platform_visited")`
touchpoint so the CRM sees the click, plus a `note_added(reason: "claim_conflict")` so it's visible in admin.

### Email CTA copy (final recommendation)

Logan offered four options. Wisest:

> **Review {campus_name} student caregivers →**

(Campus-personalized in the email body, e.g., "Review Texas A&M
student caregivers →".)

**Why this beats the others:**
- "See a demo student" — implies it IS a demo, undersells when real students exist.
- "View student profile" — singular; implies one profile; thin.
- "Review students near you" — solid, but less concrete than naming the campus.
- "See student caregivers" — too neutral, no specificity.

**Email body** (illustrative, not final copy):

> Hi Mr. French,
>
> Graize here, on behalf of Dr. Logan DuBose at Olera. We've been
> recruiting pre-nursing and pre-medical students from Texas A&M who
> are looking for caregiver shifts — and HomeSpark Care stood out as
> a great fit to invite into our pilot.
>
> Take a look at the students near you:
>
> **[ Review Texas A&M student caregivers → ]**
>
> A short background on the pilot is attached. If you'd rather chat
> first, you can [book a quick call with Dr. DuBose] — no pressure
> either way.

The body mentions "pilot" once (honest framing, not sales-y) but
leads with the value (vetted students near them). Calendly stays as
a smaller secondary CTA. PDF stays attached.

### Token security & forwarding

- **One-shot redemption** — JTI is added to a revocation set on
  first use. A second click on the same token shows "This link was
  already used. Sign in at olera.care/login" with the email
  pre-filled.
- **30-day TTL** — long enough for slow readers; not perpetually
  open.
- **Email match check** — the welcome handler re-verifies the token's
  `email` field matches the recipient before mutating any state. (Protects against tampered tokens; the signature already prevents this but defense in depth.)
- **Forwarding behavior** — if someone forwards the email and a
  different person clicks, the magic-link still works (same email
  inbox = same authority). But because cold outreach goes to
  org-level addresses (`info@`, `partnerships@`, owner direct),
  forwarders inside the org have legitimate access already. The
  welcome page header reads "Signed in as {org_name}" so the
  recipient understands what they're operating.

### No welcome banner (revised in v2.2)

v2.1 proposed a welcome banner at the top of the candidate board.
Logan pushed back — and he's right. The board itself IS the welcome;
a banner would just dilute the first impression with onboarding
language. The preview mode (no contact info, action buttons disabled
with a clear tooltip) communicates what the provider needs to know.

If we later find provider confusion about *why* contact info is hidden,
the right fix is a one-line cue in the disabled tooltip ("Accept the
pilot agreement to see contact info") — not a page-level banner.

### State distinctions (v2.2 reference)

Quick at-a-glance table so future authors don't conflate the states.
The four distinct states a provider can be in (combinations allowed):

| State | Public listing visible? | Portal access? | Can engage students? | Public "Claimed" badge? |
|-------|-------------------------|----------------|----------------------|-------------------------|
| **Directory-only** (default) | Yes (we scraped them) | No | No | No |
| **Portal-access** (post magic-link click) | Yes | Yes — browse only, preview cards | No | No |
| **Pilot-active** (post T&C accept) | Yes — **required**; deletion blocked while pilot active | Yes — full board | Yes — invite, save, see contact | No (until they verify separately) |
| **Verified-claimed** (existing flow) | Yes — with "Claimed" badge | Yes (if also has portal access) | Yes (if also pilot-active) | Yes |

A provider can be Verified-claimed without ever joining the pilot,
or Pilot-active without ever going through formal verification.
The two tracks are independent. The CRM cares about Pilot-active;
the public site cares about Verified-claimed.

### P1.E.5 — Provider listing & deletion policy (v2.2 new)

**Principle:** if a provider is in the active pilot, their public
listing must remain visible. Students invited to interview need to
research the agency; families clicking through Olera need to find
them; the pilot ecosystem assumes the listing is part of the
provider's public face.

**Policy:**
- **While `pilot_active_through > now()`** — public listing is **required**. Backend `DELETE /api/provider/[slug]` (or equivalent) returns 409 with a clear message: "Your public listing is required while your pilot is active. To delete, end the pilot first by contacting us — see [Contact Olera] in your settings."
- **Editing** the listing is always permitted (existing flow, unchanged).
- **Verifying** the listing for the public "Claimed" badge is always permitted (existing flow, unchanged) — this is independent of pilot membership.
- **To delete:** provider sends written notice to end the pilot (per the pilot agreement). Admin sets `pilot_active_through = now()` (or null). The deletion guard releases. Provider can then delete normally.

**T&C disclosure:** the modal's reassurance bullets include "Your public Olera profile stays visible while you're in the pilot — students and families need to find you" so this isn't a surprise post-acceptance.

**MVP scope:** the deletion guard ships in MVP (one-line check in the existing delete handler). The self-serve "End pilot" portal surface is **deferred to Phase 2** — for the first 3 months we expect zero such requests, and "contact us" via email matches the PDF's "written notice" language.

**Edge case:** if the public listing is somehow deleted while pilot is active (admin override, race condition), the candidate-side surface should gracefully degrade — student interview-invite flow checks `provider.listing_visible !== false` before showing the "Research the agency" link, falls back to "Agency profile not available."

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

## P1.J — MVP vs later (revised in v2.2)

**Implementation Phase 1 — MVP (~4-week scope)**

1. **Cadence change** in `cadence.ts` — Day 0 email-only, Day 3 email+call, Day 5 call, Day 7 email. (1 day)
2. **Provider email template rewrite** — single "Review {campus} student caregivers →" campus-personalized CTA, no "trial" language, magic-link URL embed. (1 day)
3. **Pilot-tier backend** — `business_profiles.metadata.pilot_active_through` field + extend `medjobs_subscription_active` predicate (Option A). (1 day)
4. **Magic-link infrastructure** — `lib/medjobs/welcome-token.ts` (sign / verify / one-shot JTI revocation set) + `/medjobs/m/[token]/route.ts` server handler implementing the full T1–T4 journey (token decode → axis-1 advance via auto-sign-in → axis-2a advance via claim-instant-style insertion with `claim_state="unclaimed"` OR co-tenancy edge case → audit → redirect). (4 days)
5. **Candidate board preview-mode rendering** — extend `/medjobs/candidates/page.tsx` to honor axis-3 state: pre-pilot accounts see preview cards (no contact, action buttons disabled with action-verb tooltips); pilot-active accounts see full mode. **No welcome banner** (v2.2 cut). (3 days)
6. **T&C action-trigger modal + pilot activation** — modal opens on first "meaningful engagement" action (Invite to interview / Save to shortlist / See contact info). Renders the v2.2 spec: action-verb-matched title, 4 reassurance bullets, full-agreement link, PDF link, unchecked agreement checkbox, action-verb-matched continue button. On accept, POST `/api/medjobs/pilot/activate` → axes 2b + 3 advance + outreach transition to `active_partner` + original action proceeds in the same flow. (3 days)
7. **Empty-state ladder** — `components/medjobs/EmptyCandidates.tsx`: real local students → sample students from peer campuses → labeled demo candidate (Logan profile) → recruiting-in-progress momentum. (3 days)
8. **Co-tenancy edge case** — when business_profile is claimed by a different account, sign in but stay in read-only mode + emit `note_added(reason: "claim_conflict")` admin task. (2 days)
9. **Smartlead webhook expansion** — `email_open` + `email_link_click` handlers update the `email_sent` touchpoint payload. (2 days)
10. **CRM stage signals** — `note_added(reason: "platform_visited")` from welcome handler; `stage_change` from `/api/medjobs/pilot/activate`. Outreach drawer renders the new payload reasons in its narration. (2 days)
11. **Pilot-required listing deletion guard** (v2.2) — server-side guard in the existing provider-delete handler that returns 409 when `pilot_active_through > now()`. (1 day)

Total: ~23 days of focused work (~4.5 weeks at 1 dev). The journey
(T1–T8) is the load-bearing piece — items 4, 5, 6, 8 are tightly
coupled and should land as one coherent PR sequence rather than
shipping individually. **No tab UI changes, no timeline split, no
Calendly webhook, no self-serve End-Pilot surface.** Those are
Phase 2.

**Implementation Phase 2 — Surfaces (after MVP data starts flowing)**

12. Timeline split (Upcoming / Past Activity).
13. Next Step post-launch state branches.
14. Emails tab (rename + smart-filter sections).
15. Calls tab Today/Upcoming sections.
16. Meetings tab + Calendly webhook.
17. Pilot-expiry awareness (Day T-7 reach-out task, post-pilot upsell).
18. **Self-serve "End Pilot" surface** (v2.2 deferred) — provider portal page where pilot-active providers can voluntarily end the pilot (sends admin notification, sets `pilot_active_through = now()`, unlocks listing deletion). MVP relies on "contact us via email" matching the PDF's written-notice clause.

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
| **v2.1: `account_id NOT NULL + claim_state = "unclaimed"` is a new state pattern** | No existing code path treats `account_id` alone as the claim signal — every gate I surveyed reads `claim_state`. Crons stay safe. But: anyone WRITING new code should know this pattern exists and not assume `account_id != null` ⇒ `claim_state = "claimed"`. Document in `lib/supabase/schema.sql` comment + add a test fixture. |
| **v2.1: Co-tenancy conflict (org already claimed)** | Read-only co-tenancy + admin reconcile task (P1.E edge case). The provider gets a session and can browse but can't trigger axis 3. Admin sees a `claim_conflict` task to manually link the second user (when team support lands) or block it. |
| **v2.1: First-action T&C creates friction at the most valuable moment** | The modal interrupts an action the provider WANTS to take. Modal language carries the verb ("Accept and invite this student") so it feels less like a wall and more like a confirmation. Single primary CTA, no scrolling required, PDF inline (collapsible). |

## Open questions for Logan — ALL RESOLVED

See **Decisions log** at the top of this document. Every question
listed during the planning passes (Q1–Q13) has a locked answer.
Implementation Phase 1 can begin.

---

## Implementation roadmap (final ticket order)

### MVP — Implementation Phase 1 (~22 days focused work, ~4 weeks)

| # | Ticket | Files | Verify |
|---|--------|-------|--------|
| 1 | Cadence change | `lib/student-outreach/cadence.ts` | Unit test: provider cadence emits 3 emails + 2 calls, no Day 1. |
| 2 | Email template rewrite | `lib/student-outreach/templates.ts` | Render Day 0/3/7 emails for a fixture row; confirm campus-personalized CTA + magic-link URL + no "trial" language. |
| 3 | Pilot-tier predicate | `lib/medjobs/access.ts` (or equivalent), `app/medjobs/candidates/page.tsx` | Manual test: create a `business_profiles` row with `pilot_active_through = now + 1d`; confirm full candidate data renders. |
| 4 | Magic-link infrastructure | `lib/medjobs/welcome-token.ts` (sign / verify / JTI), `app/medjobs/m/[token]/route.ts` | Unit: sign + verify round-trip; one-shot JTI revocation. Manual: click a valid token → authenticated; click an expired/used token → "this link expired" page. |
| 5 | Candidate board preview-mode rendering | `app/medjobs/candidates/page.tsx`, `components/medjobs/CandidateCard.tsx` | Manual test: (a) unauthenticated visitor sees public mode; (b) pre-pilot signed-in visitor sees preview cards + welcome banner; (c) pilot-active signed-in visitor sees full mode. |
| 6 | T&C action-trigger modal + pilot activation | `components/medjobs/PilotTermsModal.tsx`, `app/api/medjobs/pilot/activate/route.ts` | E2E: signed-in pre-pilot user clicks "Invite to interview" → modal opens with PDF + "Accept and invite this student" CTA → on accept, action proceeds + axis-3 advance + outreach transitions to `active_partner` + Partner Prospects unlock. |
| 7 | Empty-state ladder | `components/medjobs/EmptyCandidates.tsx` | Manual test against catchments with: ≥3 students, 1 student, 0 students. Confirm ladder rungs render correctly and Logan demo profile is clearly labeled. |
| 8 | Co-tenancy edge case | `app/medjobs/m/[token]/route.ts`, `app/medjobs/candidates/page.tsx` | Manual test: pre-claim a business_profile with account A, click a magic-link token addressed to account B's email; confirm read-only mode + admin task emitted (`reason: "claim_conflict"`). |
| 9 | Smartlead webhook (open + click) | `supabase/functions/smartlead-webhook/` | Webhook test: simulate open + click events; confirm `email_sent` payload updates with `open_count` / `click_count`. |
| 10 | CRM stage signals | outreach drawer narration, `lib/student-outreach/narration.ts` | E2E: walk a full row (email click → platform_visited → terms_accepted → stage_change) and confirm timeline narration reads correctly. |
| 11 | Pilot-required listing deletion guard (v2.2) | existing `DELETE /api/provider/...` handler, or equivalent | Manual test: try to delete a profile with `pilot_active_through > now()` → expect 409 + clear error. Try with expired `pilot_active_through` → expect success. |

Each ticket is one PR. **Order matters:**
- 1 + 2 + 3 + 11 are independent and tiny.
- 4 is the foundation — unblocks 5, 6, 8.
- 5 + 6 are the journey heart; ship them as a tight pair.
- 7 + 8 can run in parallel with 5/6.
- 9 + 10 are tangential and can land anytime.

Total: ~23 days (v2.1 was 22; +1 for ticket 11).

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

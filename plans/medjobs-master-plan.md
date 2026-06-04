# MedJobs Master Plan — Student Caregiver Pilot, Full System

Created: 2026-06-04
Status: **Master catalog — not an implementation spec.** Source of truth for what we've discussed, agreed, shipped, locked, sketched, or noted as missing across all sessions.
Author: Claude

## 0. How to read this document

This is a **catalog**, not a re-specification. The goal is completeness:
nothing important should be missing from this one page. Each section is
a brief summary + a pointer to the canonical detailed doc. Where the
canonical detail does not yet exist (a gap), the section says so.

For each item the doc carries a status tag:
- **SHIPPED** — code is live or merged
- **STAGING** — merged to a feature branch awaiting promotion to staging
- **LOCKED** — strategy decided, no code yet
- **SKETCHED** — concept locked, specification depth missing
- **GAP** — discussed but not in any plan; needs strategy
- **DEFERRED** — out of current scope by explicit decision
- **OUT-OF-SCOPE** — adjacent system, not part of MedJobs

Section ordering: north-star → architecture → what exists → what's
locked → what's sketched → what's missing → adjacent context →
references → decisions → open items → phasing discussion.

---

## 1. North star + funnel architecture

### 1.1 Goal

Convert cold home-care providers near partnered campuses into
**Pilot Active** partners — meaning they have signed the 3-month
free pilot agreement and are actively reviewing / inviting Olera's
vetted pre-nursing & pre-medical students for caregiver shifts.

Secondary goal: do the same for student-side stakeholders (universities,
professors, advisors, dept heads, student orgs) so we have a steady
inbound of vetted student profiles to populate the candidate board.

### 1.2 Funnel arc (canonical)

```
Site (campus partner)
  → Catchment (geo radius around campus)
    → Provider Prospect (materialized from olera-providers directory)
      → Pre-Flight (research + verify contacts + call to confirm)
        → Outreach Launched (cadence: email + call sequence)
          → Engagement (opens, clicks, replies, calls, meetings)
            → Pilot Active (terms accepted; using candidate board)
              → Long-term partner (post-pilot continuation, deferred)
```

Parallel stakeholder funnel runs through the same CRM with its own
state transitions (`stakeholder_type` discriminator on outreach rows).

### 1.3 Two conversion engines

- **Provider engine** — agencies who hire student caregivers. Conversion = Pilot Active. Self-serve OR admin-driven (via Dr. DuBose meeting).
- **Stakeholder engine** — universities/professors/etc. who promote the program to students. Conversion = active_partner with `distribution_confirmed` touchpoint + queued seasonal check-ins.

Both engines emit `stage_change` touchpoints for the timeline.

→ Canonical: `docs/medjobs/OPERATIONAL_BRIEF.md` §§ 2, 4, 5, 6.

---

## 2. Architecture summary

### 2.1 The state model

Eight discrete stages derived from touchpoints + status + pending tasks:
`prospect → in_outreach → call_due → meeting_set → follow_up → bounce_fix → converted → closed`.

Status enum (`student_outreach.status`) is the storage layer. Stage
is the derived display layer. They are NOT 1:1 — multiple statuses
can map to the same stage; stage looks at touchpoints + tasks too.

→ Canonical: `lib/medjobs/stage.ts` + `lib/student-outreach/state-derivation.ts`.

### 2.2 Discipline rules (G1–G10)

Hard constraints that prevent drift across the codebase:
- **G1** — no new TouchpointType values (use `note_added{reason:}` for new event flavors)
- **G2** — no new admin action types in `route.ts` (compose from existing)
- **G3** — no new migrations during feature work (extend JSONB payloads)
- **G4** — single-writer to `student_outreach_touchpoints` (D1 = admin actions, D2 = Smartlead webhook)
- **G5** — existing enum vocabulary only
- G6–G10 cover narration, cron-safety, RLS, audit fields, deterministic tests

→ Canonical: `docs/medjobs/OPERATIONAL_BRIEF.md` § 2.6.

### 2.3 Outcomes map

The contract between modal UI ↔ backend ↔ touchpoint emission ↔ state
transition. Every outcome key in every Log modal has a row in this map.

→ Canonical: `docs/medjobs/OPERATIONAL_BRIEF.md` § 5.

### 2.4 The deferred items registry (D1–D25)

Itemized list of intentionally-deferred work, each with a rationale and
a re-evaluation trigger. Prevents stuff from being silently dropped.

→ Canonical: `docs/medjobs/OPERATIONAL_BRIEF.md` § 9.

---

## 3. What's already SHIPPED (current state)

### 3.1 Pre-Flight v9.x Research Card consolidation
**Status: STAGING** (on branch `merge/medjobs-staging-2026-06-02`,
awaiting QA before promotion to staging).

Recent four-phase work that collapsed the Pre-Flight surface so the
Research Card is the single source of truth:
- Phase 2b — Verification subsection on Research Card (mirrors the call-modal state)
- Phase 2c — Pre-Flight action footer (Visit Website / Call to Confirm / Launch Outreach)
- Phase 2d — Inline Contact Form banner under URL row (pre + post launch)
- Phase 2e — NextStepCard prospect body collapsed (-480 lines; thin stage indicator only)

Earlier v9.x work already on the branch:
- Phase 0a — Removed Google Business Profile from the workflow
- Phase 0b — Extended Fill-from-Website to Phone/Fax/Address (Perplexity fallback)
- Phase 0c — Simplified Pre-Flight call script
- Phase 1a — Per-field Find buttons with pulse-ring affordance
- Phase 1b — Header pill "Fill from Website" dispatches "all" mode
- Phase 2a — Research progress indicator (passive, X of N fields)

→ Canonical: this branch's commit history; relevant files in `components/admin/medjobs/SnapshotCard.tsx` (the heart) + `ProviderProspectDrawerBody.tsx` + `NextStepCard.tsx` + `CallForEmailModal.tsx`.

### 3.2 Pre-Flight Call ("CallForEmailModal") with 6 outcomes
**Status: SHIPPED.**

Single modal, six outcomes — Confirmed (verified=true → Pre-Flight passes), No Answer, Voicemail, Wrong Number, Not Interested (closes row), Override Pre-Flight (admin bypass when verification isn't possible). Drives the verification axis (`getVerificationState`).

→ Canonical: `lib/student-outreach/verification-state.ts` + `components/admin/medjobs/CallForEmailModal.tsx`.

### 3.3 Decision Maker single-slot
**Status: SHIPPED.**

Stored in `research_data.decision_maker` JSONB. Replaces the older
multi-contact UX for new rows. Smartlead bridge emails General
Contact + Decision Maker (max 2 leads per row). Legacy
`student_outreach_contacts` data remains read-only for existing rows.

### 3.4 "Mark not available" override flags
**Status: SHIPPED.**

Six fields can each be marked unavailable on `research_data.general_contact`: `fax_unavailable`, `contact_form_unavailable`, `website_unavailable`, `phone_unavailable`, `email_unavailable`, `address_unavailable`. Plus `decision_maker.unavailable`. Each marks the field as "researched and not findable" so the checklist passes without a value.

### 3.5 Smartlead bridge end-to-end
**Status: SHIPPED — PR #900 merged to staging; engine inert until env flag flipped.**

Provider-side EMAIL drip now flows through Smartlead instead of Resend.
CRM still owns call tasks + remains system of record.
- `lib/medjobs/smartlead-bridge.ts` — selectEligibleRows, rowToLead, buildEmailSequence, enrollRowIntoCampusCampaign, resolveMailboxPool
- `supabase/functions/smartlead-webhook/` — D2 reply/bounce → touchpoints (INERT until `SMARTLEAD_WEBHOOK_SECRET` set)
- Engine swap via `MEDJOBS_OUTREACH_ENGINE=smartlead` env flag
- All campaigns created PAUSED (no `START` literal exists in the helpers)
- TJ's mailbox `tj@findmedjobs.co` connected as demo sender (warmup off)
- Logan's role narrowed: sees copy once, okays sender identity. Pending signoff.

→ Canonical: `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md` + `lib/medjobs/smartlead-bridge.ts` + `lib/smartlead.ts`.

### 3.6 Catchment correction
**Status: SHIPPED — PR #919 merged.**

Catchment count/audit surfaces were reading the wrong table (`business_profiles`, ~tiny) while the prospect list was reading `olera-providers` (75K directory). 7–140× undercount. Fix:
- All catchment surfaces now read `olera-providers`
- Filter to non-medical home care (`Home Care (Non-medical)`)
- Paginated `fetchNonMedicalProviders()` with stable `.order("provider_id")`
- Houston 42→106, Emory 2→76, U.Florida 0→21

→ Canonical: `lib/medjobs/{catchment,prospect-counts,catchment-audit}.ts`.

### 3.7 Find Email / Find Contact Form enrichment
**Status: SHIPPED — PR #925 merged into the same merge branch.**

Two-mode enrichment with batch scripts + per-row drawer buttons:
- `lib/medjobs/outreach-enrichment.ts` — shared finder (scrape→role-rank→Perplexity, ZeroBounce-ready)
- `scripts/enrich-outreach-emails.ts` + `scripts/enrich-outreach-contact-forms.ts`
- `POST /api/admin/medjobs/enrich-contact` — read-only, returns value without writing
- "✦ Find email" / "✦ Find contact form" buttons in SnapshotCard
- Extended in Phase 0b to phones, faxes, addresses (Perplexity fallback for address parsing)

→ Canonical: `plans/provider-outreach-enrichment-plan.md` + `lib/medjobs/outreach-enrichment.ts`.

### 3.8 Connections tracker (KPI + intervention queue)
**Status: SHIPPED (MVP done).**

Provider-side connection state machine + admin queue at `/admin/connections`. Hero "successful connections" KPI + prioritized intervention queue. Temperature module (whose-turn + staleness) at `lib/connection-temperature.ts`. 6 unit tests passing. Endpoints: `/api/admin/connections/pulse` + `/api/admin/connections`.

→ Canonical: `plans/connections-tracker-plan.md` + `lib/connection-temperature.ts`.

### 3.9 Pre-existing CRM scaffold (still in use)
**Status: SHIPPED long ago.**

- In Basket tabs: `clients · candidates · prospects · partners · meetings · replies · calls · sites`
- Stage-driven `NextStepCard` (8 stage branches)
- `OutreachTimeline` (single mixed stream)
- Drawer modals: `PreFlightReviewModal`, `ProviderPreFlightModal`, `ReplyClassifierModal`, `LogMeetingModal`, `LogCallOutcomeModal`
- Conversion engines: `handleMakeClient` (provider → active_partner), `handleMarkPartner` (stakeholder → active_partner)
- Cron paths: medjobs-digest, google-reviews refresh, provider-dormant, verification-reminders

These are the substrate the v3 post-launch plan modifies.

---

## 4. What's LOCKED but not built (the v3 post-launch redesign)

All thirteen open questions from the v3 plan are resolved; ticket
cutting is unblocked. Items below are the LOCKED conceptual
decisions. The canonical detail lives in
`plans/post-launch-outreach-redesign-plan.md` (v3.1).

### 4.1 Post-launch cadence change
**Status: LOCKED.** Today's Day 0 paired-call moves into Pre-Flight (already shipped). Day 1 call is deleted. Post-launch cadence becomes:
- **Day 0** — email only (no call)
- **Day 3** — email + call (the "did you get our email?" check)
- **Day 5** — call (offer help; redirect to link or offer Dr. DuBose meeting)
- **Day 7** — final email (graceful close + redirect-the-contact ask)

Net: 3 emails + 2 calls over 7 days.

→ Canonical: `plans/post-launch-outreach-redesign-plan.md` § P1.A.

### 4.2 Per-call purpose (post-launch)
**Status: LOCKED.** Calls are about removing friction, not selling. The PDF + the welcome page do the selling.
- Day 3 — "Did you get our email Monday? Want me to resend?"
- Day 5 — "Anything you'd like to ask? Some folks find it helpful to walk through with Dr. DuBose."
- Day 7 — "We'll check back next term. Better contact at {org}?"

→ Canonical: § P1.B.

### 4.3 Terminal state: Pilot Active
**Status: LOCKED.** No new derived stage. A row is **Pilot Active** when:
1. `business_profiles.metadata.interview_terms_accepted_at` is set (existing field)
2. `business_profiles.metadata.pilot_active_through > now()` (new field, set at terms acceptance to `now + 90d`)

Maps to existing `outreach.status = "active_partner"` + `stage = "converted"`. Two paths in (admin `make_client` + provider self-serve), one terminal out. Admin path ALSO sets `pilot_active_through` (per Q1 decision).

→ Canonical: § P1.C.

### 4.4 Email CTA & body strategy
**Status: LOCKED.** Single primary CTA in every post-launch email, campus-personalized:

> **Review {campus} student caregivers →**

Linking to `olera.care/medjobs/m/<token>`. Secondary CTAs: "Reply with questions" + "Or book a quick call with Dr. DuBose →" (Calendly). No "trial" language in body. "Pilot" appears once as honest framing.

Body draft locked. **One-liner amendment pending:** brand-consistency note ("…you'll land on olera.care, our main platform.") to be added in MVP ticket 2.

→ Canonical: § P1.D.

### 4.5 Magic-link onboarding (T0–T10 journey)
**Status: LOCKED.** Reuses existing primitives (`/api/auth/auto-sign-in`, `/auth/magic-link`, `claim-instant`-style insertion). Token: server-signed JWT carrying `{outreach_id, email, jti, expires_at: now+30d}`. One-shot redemption via JTI revocation set.

Full T0–T10 journey table in § P1.E (311 lines, the heart of the plan).

→ Canonical: § P1.E.

### 4.6 Four orthogonal state axes
**Status: LOCKED.** A provider's state is not a single linear progression; it's four independent axes:

| Axis | Backed by | Advanced by |
|------|-----------|-------------|
| 1. Auth identity | `auth.users` + `accounts` | Magic-link click |
| 2a. Account linkage | `business_profiles.account_id` | Magic-link click |
| 2b. Claim status | `business_profiles.claim_state` | Terms acceptance |
| 3. Pilot membership | `metadata.interview_terms_accepted_at` + `pilot_active_through` | Terms acceptance |
| 4. Public verification | `verification_state` | Existing verification flow (unchanged) |

Provider can be in any combination. Crons that gate on `claim_state="claimed"` (digest, reviews refresh) only fire after axis 2b advances at terms acceptance, not at click.

→ Canonical: § P1.E "The state model."

### 4.7 Welcome page = candidate board with preview mode
**Status: LOCKED.** No separate marketing landing page. The "welcome" experience IS the candidate board, with two modes:
- **Preview mode** (auth ≥ axis 1, axis 3 inactive) — preview cards, no contact info, action buttons disabled with action-verb tooltip ("Accept the pilot agreement to invite").
- **Full mode** (axis 3 active) — full cards, contact info visible, all actions enabled.

No welcome banner. The disabled-action tooltips do all the explaining.

→ Canonical: § P1.E "T5 Land on candidate board" + § "No welcome banner."

### 4.8 Empty-state ladder
**Status: LOCKED.** The candidate board never reads empty. Four-rung tiered fallback:
1. Real local students (≥3, catchment-filtered)
2. Sample students from peer campuses (clearly labeled)
3. **Demo candidate = Logan DuBose** (real face, real bio, prominent DEMO badge)
4. "Recruiting in progress" momentum banner

Page picks the highest rung it can fill. Activate-pilot CTA is available at every rung — provider can sign even with zero students visible.

→ Canonical: § P1.F.

### 4.9 T&C action triggers
**Status: LOCKED.** Three "meaningful student engagement" actions gate on terms acceptance:
- **Invite to interview** (highest intent)
- **See contact info**
- **Save to shortlist**

Browse + filter + click-into-expanded-profile remain free.

→ Canonical: § P1.E T7.

### 4.10 T&C modal UX spec
**Status: LOCKED.** Modal opens on the first triggering action. Structure:

- Title (verb-matched): "Before you invite this student" / "Before you save this student" / "Before you view contact information"
- Plain-language intro line
- **Four reassurance bullets** in 5th–8th grade language:
  - ✓ Free for 3 months — no payment information needed
  - ✓ No obligation to hire anyone you review
  - ✓ Your agency makes all hiring decisions
  - ✓ Your public Olera profile stays visible while in the pilot — students and families need to find you
- "Read the full pilot agreement →" + "Download as PDF →"
- **Unchecked agreement checkbox** by default (legal best practice for e-consent enforceability under ESIGN / UETA / GDPR)
- Primary CTA (verb-matched, disabled until checkbox checked): "Agree and invite this student" / etc.
- Cancel (no state change)

Visual tone matches existing `LogModalShell`.

→ Canonical: § P1.E T7 "T&C modal — content & UX."

### 4.11 Pilot Active activation API
**Status: LOCKED.** `POST /api/medjobs/pilot/activate` runs in a single transaction:
- Set `claim_state = "claimed"` (axis 2b advances — the pilot signature IS the formal identification)
- Set `interview_terms_accepted_at = now()` (axis 3)
- Set `pilot_active_through = now() + 90d` (axis 3)
- Set `terms_accepted_via = "self_serve"` (audit; differentiates from admin `make_client` path)
- Transition outreach → `active_partner` via existing engine
- Emit `stage_change` touchpoint

→ Canonical: § P1.E T8.

### 4.12 Co-tenancy edge case
**Status: LOCKED.** When `business_profile.account_id` belongs to a different user (org already claimed by someone else):
- Sign the cold-email recipient in
- Do NOT mutate `account_id` or `claim_state`
- Candidate board stays in permanent preview mode
- Any axis-3 action attempt prompts: "this org is already linked to another team member ({redacted_email}). Want us to email them?"
- Emit `note_added(reason: "claim_conflict")` admin task for manual reconciliation

→ Canonical: § P1.E "Edge case."

### 4.13 Public listing required while pilot active
**Status: LOCKED.** Backend guard on the existing delete-profile flow: returns 409 when `pilot_active_through > now()`. Provider sends written notice (per PDF) to end pilot; deletion unlocks.

Disclosure in T&C bullet #4 so it isn't a surprise.

→ Canonical: § P1.E.5.

### 4.14 Pilot tier predicate
**Status: LOCKED.** Extend the existing `medjobs_subscription_active` predicate (Option A — one predicate, one source of truth):

```ts
medjobs_subscription_active =
  metadata.medjobs_subscription_active === true ||
  (metadata.pilot_active_through && new Date(metadata.pilot_active_through) > new Date())
```

→ Canonical: § P1.I.

### 4.15 Engagement tracking model
**Status: LOCKED.** No new touchpoint types. Engagement events (opens, clicks) UPDATE the existing `email_sent` touchpoint's payload — single row per email with engagement chips. Platform events (visited welcome page, terms accepted, candidate viewed) use `note_added{reason:}`.

MVP metric set: replies, bounces, clicks, pilot activations, meetings.

→ Canonical: § P1.H.

### 4.16 Token security
**Status: LOCKED.** One-shot JTI revocation. 30-day TTL. Email match check inside welcome handler. Forwarded clicks still work (org-level inbox = legitimate forwarder authority).

→ Canonical: § P1.E "Token security & forwarding."

### 4.17 Smartlead webhook expansion (post-launch)
**Status: LOCKED.** Add `email_open` + `email_link_click` handlers to the existing `supabase/functions/smartlead-webhook/`. Both UPDATE the existing `email_sent` touchpoint payload (not new touchpoints).

---

## 5. CRM operational surfaces (SKETCHED — Phase 2, depth missing)

The strategic shifts (S6–S9, S11) treat these as **major workflow
redesigns**. The doc depth doesn't yet match: P2.D Calls = 6 lines,
P2.E Emails = 39, P2.F Meetings = 49 (vs P1.E magic-link = 311).

Per v3.1 reconciliation: phasing is right (ship conversion path
first), but Phase 2 sections need a deepening pass before
implementation tickets are cut.

### 5.1 In Basket tabs — final set
**Status: LOCKED.**

```
Prospects · Calls · Emails · Meetings
```

(Clients / Partners / Candidates move to sidebar-only.)

→ Canonical: § P2.C.

### 5.2 Next Step post-launch per stage
**Status: SKETCHED.** Table of 5 stage rows in § P2.A. Need to enumerate all 8 post-launch sub-states + engagement-driven sub-states (opened-not-clicked, clicked-not-activated, pilot-active-going-dormant).

→ Canonical: § P2.A. Depth needed: ~50 lines (currently 16).

### 5.3 Timeline split — Upcoming vs Past Activity
**Status: SKETCHED.** ASCII sketch in § P2.B. Need: collapse/expand behavior on long timelines, engagement-chip grouping rules under each `email_sent` row, "show all" pagination.

→ Canonical: § P2.B.

### 5.4 Calls tab redesign
**Status: SKETCHED.** 6 lines in § P2.D. Concept locked (Today + Upcoming with per-day grouping). **Missing:**
- Per-row component spec (name + day + phone + purpose hint + log-outcome inline vs modal)
- Call-script payload integration (the resolved script set at PreFlight time)
- Voicemail → re-call flow
- Contact-row vs general-contact-row dispatch when there are multiple
- "Load more upcoming" pagination
- How engagement (clicked) affects ordering

→ Canonical: § P2.D. Depth needed: ~50 lines.

### 5.5 Emails tab redesign (renamed from Replies)
**Status: SKETCHED.** 39 lines in § P2.E. Single-stream model with smart-pinning locked. **Missing:**
- Per-event-type row UI (sent, opened, clicked, replied, bounced)
- Smartlead webhook payload → touchpoint mapping table
- Master inbox vs per-mailbox-inbox deep-link mechanic
- Reply-thread context handoff (what context does the admin take into Smartlead/Gmail?)
- Activity-log pagination and filter behavior
- Default filter set (hide opens, show clicks/sends?)

→ Canonical: § P2.E. Depth needed: ~80 lines.

### 5.6 Meetings tab + Calendly
**Status: SKETCHED.** 49 lines in § P2.F. Concept locked (Calendly webhook matches invitee email; unmatched-bookings tray; per-section split). **Missing:**
- Calendly cancel + reschedule webhook handlers (only `invitee.created` is in the doc)
- Post-meeting sub-state model that Logan explicitly raised ("needs follow-up email" / "needs follow-up call" / "asked for time to think" / "pre-pilot-active") — not the existing LogMeetingModal outcomes which are coarser
- "Activate pilot on their behalf" as a new LogMeetingModal outcome that runs `make_client` AND sets `pilot_active_through`
- Calendly account migration path (currently Dr. DuBose's personal; Phase 2 webhook subscription; long-term Olera org)

→ Canonical: § P2.F. Depth needed: ~90 lines.

### 5.7 Engagement → call-task priority
**Status: GAP.** Logan said clicked rows should rise in admin attention. Brief mention in § P2.A but no priority-queue logic specified. Affects Calls tab + Next Step + Emails tab.

### 5.8 Returning-provider experience
**Status: GAP.** The plan handles the first magic-link click (T5 candidate board landing). What does a returning Pilot Active provider see on visit #2 going forward? Dashboard? Direct to candidate board? Settings? Not addressed.

### 5.9 Provider self-serve admin tools
**Status: DEFERRED to Phase 3.** Letting a Pilot Active provider edit their own org info / verify their listing / end the pilot from inside the portal. MVP path is "contact us" per PDF written-notice clause.

---

## 6. Items requiring deeper specification before implementation

(Pulled from v3.1 reconciliation § "Truly missing.")

### 6.1 Smartlead-inbox deep-link mechanic
**Status: GAP.** Emails tab assumes "Reply via Smartlead inbox →" button works. Specifics not defined: master inbox URL pattern, per-mailbox sub-paths, how we pass the thread context.

### 6.2 Calendly cancel / reschedule webhooks
**Status: GAP.** § P2.F covers only `invitee.created`. The `invitee.canceled` event + reschedule semantics need handlers + CRM updates.

### 6.3 Post-meeting sub-state machine
**Status: GAP.** Logan: "meetings often lead to further follow-up, not instant conversion." LogMeetingModal currently has coarse outcomes (booked / finding_time / done_followup / done_partner / done_client / not_a_fit / no_show). Post-meeting nuance not modeled.

### 6.4 Admin pilot-metrics dashboard
**Status: GAP.** Tracking from § P1.H (CTR, activation rate, etc.) needs a surface to be viewable. Not designed.

### 6.5 Provider feedback collection
**Status: GAP.** Pilot agreement mentions optional feedback ("Olera may request feedback... feedback sessions, surveys, or other formal or informal ways"). No surface for this in the plan.

### 6.6 Pilot-active dormancy re-engagement
**Status: GAP.** Provider activates pilot, doesn't invite anyone for a week — what happens? Notification? Admin task? Not addressed.

### 6.7 Brand-consistency one-liner
**Status: LOCKED but pending ticket-2 amendment.** Email body should say "…you'll land on olera.care, our main platform" so the brand jump (findmedjobs.co → olera.care) isn't a surprise.

---

## 7. Adjacent / parallel systems (mentioned for completeness)

### 7.1 Student-side flow
**Status: OUT-OF-SCOPE for this plan.** After a Pilot Active provider clicks "Invite to interview," the student receives the invitation somehow. The student-side experience (email? in-app notification? candidate dashboard?) is its own project. Tracked separately.

### 7.2 Stakeholder funnel
**Status: SHIPPED, ongoing.** Parallel to the provider funnel — universities, professors, advisors, dept heads, student orgs. Same CRM, different cadence, different conversion engine (`mark_partner` instead of `make_client`). Active partners produce vetted student profiles that populate the candidate board.

→ Canonical: `docs/medjobs/OPERATIONAL_BRIEF.md` § 2.5.

### 7.3 Multi-team-member support
**Status: DEFERRED long-term.** Current schema: one business_profile = one account_id (no team support). Co-tenancy edge case punts on this with admin reconcile task. Long-term: needs a real memberships rework.

### 7.4 Pilot continuation (post-3-month paid)
**Status: DEFERRED Phase 3.** PDF: "After the three-month pilot, continued use of the platform may be offered on a paid basis; any future paid relationship will be covered by a separate written agreement." Conversion path + pricing + new agreement not yet designed.

### 7.5 Inline Smartlead reply UI
**Status: DEFERRED Phase 3.** MVP/Phase 2 uses "open Smartlead inbox →" button. Inline reply via Smartlead's reply API deferred until volume justifies it.

### 7.6 Magic-token verification flow
**Status: DEFERRED Phase 3.** The existing formal verification flow (`/api/provider/verify/...`) is unchanged. Magic-link path does NOT advance axis 4. Provider can complete verification at their own pace if they want the public "Claimed" badge.

### 7.7 Pilot expiry behavior (Day-T-7 reach-out)
**Status: DEFERRED Phase 2.** When `pilot_active_through` passes, the candidate board re-redacts. Admin gets a reach-out task. MVP just sets the timestamp.

### 7.8 Adjacent workstreams (NOT part of MedJobs)
For audit-trail completeness, these are explicitly noted as outside this master plan:
- **Market diagnostic** (PR #916) — separate provider-acquisition tool
- **Care-seeker / family-side flow** — completely separate
- **Senior benefits finder** — separate
- **Provider portal / public listing** — adjacent (we touch it for the deletion guard) but its own product

---

## 8. Existing canonical references

Documents whose detail this master plan points to (rather than
duplicating):

| Topic | Canonical |
|-------|-----------|
| Funnel architecture, state machine, discipline rules, outcomes map | `docs/medjobs/OPERATIONAL_BRIEF.md` |
| Smartlead bridge design | `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md` |
| Team-facing executive summary | `docs/medjobs/EXECUTIVE_SUMMARY.md` |
| **The v3 post-launch redesign** | **`plans/post-launch-outreach-redesign-plan.md`** |
| Smartlead cutover plan (historical) | `plans/cold-outreach-smartlead-cutover-plan.md` |
| Find Email / Find Contact Form enrichment | `plans/provider-outreach-enrichment-plan.md` |
| Connections tracker | `plans/connections-tracker-plan.md` |
| Pilot agreement (HomeSpark template) | `/root/.claude/uploads/.../pilotagreementhomespark.pdf` |
| State-machine source | `lib/medjobs/stage.ts` + `lib/student-outreach/state-derivation.ts` |
| Verification state | `lib/student-outreach/verification-state.ts` |
| Cadence definitions | `lib/student-outreach/cadence.ts` |
| Email templates | `lib/student-outreach/templates.ts` |

---

## 9. Decisions log (consolidated across all passes)

### 9.1 Pre-Flight redesign decisions (already shipped)
- Drop Google Business Profile from the workflow
- Pre-Flight call has 6 outcomes including Override
- Decision Maker as single-slot (not multi-contact)
- "Mark not available" per field
- Verification state derived from touchpoints + override flag
- Research Card as single source of truth (NextStepCard collapses to thin indicator pre-launch)
- Find buttons reach for Email, Contact Form, Phone, Fax, Address
- "Fill from Website" header pill dispatches "all" mode

### 9.2 Post-launch redesign decisions (locked, not built — v3 plan)
| # | Locked answer |
|---|---------------|
| Q1 | Admin `make_client` also sets `pilot_active_through = now + 90d` (Claude default; overridable) |
| Q2 | Day 1 call deleted |
| Q3 | Dr. DuBose's personal Calendly (Phase 2 webhook subscription) |
| Q4 | Logan as labeled demo candidate |
| Q5 | 30-day magic-link TTL |
| Q6 | Pilot expiry behavior deferred to Phase 2 |
| Q7 | T&C triggers = Invite + See contact + Save; expanded profile click stays free |
| Q8 | Read-only co-tenancy on org-already-claimed |
| Q9 | Axis 2a/2b split shipped |
| Q10 | No welcome banner |
| Q11 | Block listing deletion while pilot active |
| Q12 | Unchecked T&C checkbox |
| Q13 | T&C reassurance bullet wording approved |

### 9.3 Decisions made by infrastructure constraints
- One business_profile = one account_id (no team support)
- Public "Claimed" badge requires BOTH `claim_state="claimed"` AND `verification_state="verified"` — discovered during v2.1 survey
- `claim_state` is the cron-gating signal (digest, reviews refresh) — not `account_id`
- `interview_terms_accepted_at` already exists; we extend its use, no new field

---

## 10. Open items / unresolved (consolidated)

These are real gaps that need decisions or strategy work before
implementation. None block the MVP (P1.J tickets 1–11), but all
must be resolved before Phase 2 + later phases.

### 10.1 Strategy gaps
- **§5.7** Engagement → call-task priority — define the priority-bump logic
- **§5.8** Returning Pilot Active provider experience (visit #2+) — design the dashboard / direct-to-board flow
- **§6.1** Smartlead-inbox deep-link mechanic — master vs per-mailbox, thread context
- **§6.2** Calendly cancel / reschedule webhook handlers
- **§6.3** Post-meeting sub-state machine — match Logan's "asked for time to think" / "needs follow-up email" / etc.
- **§6.4** Admin pilot-metrics dashboard — design the surface
- **§6.5** Provider feedback collection surface — design or formally defer
- **§6.6** Pilot-active dormancy re-engagement — design or formally defer

### 10.2 Specification depth (Phase 2)
- §5.2 Next Step post-launch: 16 → ~50 lines
- §5.4 Calls tab: 6 → ~50 lines
- §5.5 Emails tab: 39 → ~80 lines
- §5.6 Meetings tab: 49 → ~90 lines

### 10.3 Ticket-cutting amendments (MVP)
- Add brand-consistency one-liner to MVP ticket 2 (email-template rewrite). 30 minutes.

### 10.4 Pending Logan signoff (from prior work)
- Smartlead sender identity + footer/unsubscribe (from PR #900 demo)
- Outreach copy walkthrough before flipping `MEDJOBS_OUTREACH_ENGINE=smartlead` in prod

---

## 11. Risks (consolidated across all plans)

Pulled from the v3 risks table + earlier session risks:

| Risk | Mitigation |
|------|------------|
| Removing Day 1 call loses signal | Pre-Flight call covers it; confirmed with TJ |
| Email CTA change loses Calendly bookings | Calendly stays as secondary CTA; track booking rate per-campus |
| Welcome page empty state bounces providers | Empty-state ladder (§4.8) is hard-required before new CTA goes live |
| Magic-link forwarded to wrong person | One-shot JTI, 30d TTL, welcome page header shows "Signed in as {org}"; forwarders at org-level email have authority anyway |
| Smartlead open/click webhook reliability | Start with clicks only (lower volume, higher signal); add opens later |
| Calendly can't match invitee to outreach | Unmatched booking tray + manual claim |
| Pilot tier flag drift | Single predicate `medjobs_subscription_active` (Option A) — one function to update |
| JIT account creation race | Atomic in Supabase transaction; concurrent clicks resolve to same business_profile via upsert |
| Two paths to terms acceptance | `terms_accepted_via` audit field differentiates `"admin"` vs `"self_serve"` |
| `account_id NOT NULL + claim_state="unclaimed"` is a new state pattern | No existing code path reads `account_id` alone as claim signal; document in schema comment |
| Co-tenancy conflict | Read-only mode + admin reconcile task; manual until team support lands |
| First-action T&C creates friction at high-value moment | Verb-matched modal CTA + 4 reassurance bullets soften the moment |
| Listing deletion while pilot is active | Backend guard returns 409 with clear "end pilot first" message |
| Smartlead warmup blocks outbound | tj@findmedjobs.co is warm and bypassable for test sends; production cold senders still warming |

---

## 12. Development phases

**Principle:** every item from §§ 3–7 lands in exactly one phase.
Each phase has a single goal, an explicit scope (with §-references
back to this catalog so nothing is orphaned), dependencies on prior
phases, a time estimate, and a definition-of-done.

**Phase ordering rationale:**
- Phase 0 ships the work we've already finished (stabilization, no new code)
- Phase 1 ships the conversion path that the v3 plan locked
- Phase 2 is a SHORT strategy depth-pass (no code) to unblock Phase 3
- Phase 3 ships the operational surfaces (admin UX)
- Phase 4 ships engagement-driven workflows (depends on Phase 1+3 data)
- Phase 5 ships pilot lifecycle (depends on real Pilot Active providers)
- Phase 6 is ongoing polish + long-tail extensions

**Suggested running total: ~10 weeks** from Phase 0 start through
Phase 5 complete, assuming one dev. Phase 6 is open-ended.

---

### Phase 0 — Stabilize what's shipped (~2 days, mostly waiting)

**Goal:** Get already-completed work into staging and prepare for
Phase 1 to launch live emails.

**Scope:**
- QA the `merge/medjobs-staging-2026-06-02` branch on Vercel preview (§ 3.1) — walk prospect / call_due / meeting_set / in_outreach / converted / closed drawer stages; confirm Phase 2b–2e renders correctly; test launch flow + override path
- Merge `merge/medjobs-staging-2026-06-02` → `staging` once QA passes
- Logan signoff on Smartlead sender identity + footer/unsubscribe copy (§ 10.4)
- Logan signoff on outreach email-body copy walkthrough (§ 10.4)
- Set `SMARTLEAD_SENDER_EMAILS` env in prod
- Verify Smartlead webhook payload shape against their docs; set `SMARTLEAD_WEBHOOK_SECRET`; register webhook URL in Smartlead admin (D2 activation prep)

**Dependencies:** None. All code already written.

**Time estimate:** ~2 days, mostly review + signoff cycles, not engineering.

**Definition of done:**
- `merge/medjobs-staging-2026-06-02` is in `staging`
- Staging Vercel preview demonstrates the Research Card consolidation end-to-end
- Smartlead environment variables are set in prod
- Logan has signed off on sender identity, copy, and footer
- Webhook is registered (still PAUSED-only; will activate D2 in Phase 1)

---

### Phase 1 — Conversion path MVP (~23 days / ~4.5 weeks at 1 dev)

**Goal:** Ship the magic-link → candidate board → T&C → Pilot Active
conversion path. Cold providers can self-serve onto the platform
without admin intervention.

**Scope** — 11 tickets from v3 plan § P1.J, plus one amendment.
Each ticket = one PR. Order matters (see "Ticket order" below).

**Tickets:**

1. **Cadence change** (§ 4.1) — `lib/student-outreach/cadence.ts`. Day 0 email-only, Day 3 email+call, Day 5 call, Day 7 email. **1 day.**

2. **Email template rewrite + brand-consistency amendment** (§ 4.4 + § 6.7) — `lib/student-outreach/templates.ts`. Campus-personalized CTA "Review {campus} student caregivers →"; magic-link URL embed; "…you'll land on olera.care, our main platform." one-liner. No "trial" language. **1 day.**

3. **Pilot-tier predicate** (§ 4.14) — extend `medjobs_subscription_active` predicate (Option A); add `business_profiles.metadata.pilot_active_through` field. **1 day.**

4. **Magic-link infrastructure** (§ 4.5 + § 4.16) — `lib/medjobs/welcome-token.ts` (sign/verify/JTI revocation) + `app/medjobs/m/[token]/route.ts` server handler implementing T1–T4 journey. **4 days.**

5. **Candidate board preview-mode rendering** (§ 4.7) — extend `app/medjobs/candidates/page.tsx` to honor axis-3 state: pre-pilot accounts see preview cards (no contact, disabled action buttons with action-verb tooltips); pilot-active accounts see full mode. No welcome banner. **3 days.**

6. **T&C action-trigger modal + pilot activation API** (§ 4.9 + § 4.10 + § 4.11) — modal opens on Invite / Save / See contact (the three locked triggers). Renders v2.2 spec (action-verb-matched title, 4 reassurance bullets, full-agreement link, PDF link, unchecked checkbox, action-verb-matched continue button). On accept, `POST /api/medjobs/pilot/activate` advances axes 2b + 3 + transitions outreach to `active_partner` + original action proceeds. **3 days.**

7. **Empty-state ladder with Logan demo profile** (§ 4.8) — `components/medjobs/EmptyCandidates.tsx`: real → sample → demo (Logan profile clearly labeled) → recruiting-in-progress. **3 days.**

8. **Co-tenancy edge case** (§ 4.12) — when `business_profile.account_id` belongs to another user, sign in but stay in permanent preview mode; emit `note_added(reason: "claim_conflict")` admin task. **2 days.**

9. **Smartlead webhook expansion (open + click)** (§ 4.17) — extend `supabase/functions/smartlead-webhook/` with `email_open` + `email_link_click` handlers that UPDATE the existing `email_sent` touchpoint payload (no new touchpoint types). **2 days.**

10. **CRM stage signals** (§ 4.15) — `note_added(reason: "platform_visited")` from welcome handler; `stage_change` from `/api/medjobs/pilot/activate`. Outreach drawer's `lib/student-outreach/narration.ts` renders the new payload reasons. **2 days.**

11. **Pilot-required listing deletion guard** (§ 4.13) — backend guard in the existing provider-delete handler returns 409 when `pilot_active_through > now()`. **1 day.**

**Ticket order** (the load-bearing detail):
- **Week 1**: Tickets 1, 2, 3 (independent, tiny) + start 4 (magic-link infra)
- **Week 2**: Finish 4; start 5 + 6 as a tightly coupled pair (the journey heart)
- **Week 3**: Finish 5 + 6; parallel 7 (empty-state) + 8 (co-tenancy)
- **Week 4**: Finish 7 + 8; ship 9 (webhook) + 10 (narration) + 11 (deletion guard)

Tickets 5 + 6 are the highest-risk pair — they touch the candidate board AND introduce the activation API. Pair them as one PR sequence so the UX/state transitions match.

**Dependencies:**
- Phase 0 complete (Smartlead env vars set, sender warmed, copy approved)
- No new schema migrations needed (everything goes in JSONB or existing columns)

**Definition of done:**
- A real cold provider can: receive a Day-0 email, click the magic link, land authenticated on the candidate board in preview mode, click "Invite to interview," accept the T&C modal, become Pilot Active, and have the invite proceed
- All 11 tickets merged to `staging`
- E2E test: walk a fixture row from email send → magic-link click → preview browse → T&C accept → `interview_terms_accepted_at` set + `pilot_active_through` set + outreach status = `active_partner` + Partner Prospects unlock
- Smartlead open/click events flow into `email_sent` touchpoint payloads visible in the timeline
- Deletion guard verified: cannot delete a `business_profile` while `pilot_active_through > now()`

---

### Phase 2 — Strategy depth pass for operational surfaces (~3 days, strategy only)

**Goal:** Deepen the Phase 2 surface specs from "concept locked" to
"ticket-cuttable" so Phase 3 can begin without re-litigation. NO
CODE in this phase.

**Scope** — three sub-passes, parallelizable:

- **Pass A — Calls tab + Emails tab depth** (§ 5.4 + § 5.5 + § 6.1)
   - Calls tab: per-row component spec, call-script payload integration, voicemail flow, contact-row vs general-contact dispatch, "Load more upcoming" pagination
   - Emails tab: Smartlead webhook payload → touchpoint mapping table, per-event row UI, master-inbox vs per-mailbox-inbox deep-link mechanic, reply-thread context handoff, activity-log pagination + filter behavior
   - These ship together because Email-clicked events drive Call priority bumping
   - **~1 day strategy work**

- **Pass B — Meetings tab + Calendly depth** (§ 5.6 + § 6.2 + § 6.3)
   - Calendly cancel + reschedule webhook handlers
   - Post-meeting sub-state model: "asked for time to think" / "needs follow-up email" / "needs follow-up call" / "pre-pilot-active" / etc. (the nuance Logan raised; LogMeetingModal's current outcomes are coarser)
   - New LogMeetingModal outcome: "Activate pilot on their behalf" that runs `make_client` AND sets `pilot_active_through = now + 90d`
   - Unmatched-bookings tray ergonomics
   - **~1 day strategy work**

- **Pass C — Next Step + Timeline depth** (§ 5.2 + § 5.3)
   - Next Step content for ALL 8 post-launch stages + engagement-driven sub-states (opened-not-clicked, clicked-not-activated, pilot-active-going-dormant)
   - Timeline split (Upcoming / Past Activity): collapse/expand behavior on long timelines; engagement-chip grouping rules under each `email_sent` row; "show all" pagination
   - **~1 day strategy work**

**Dependencies:**
- Phase 1 implementation in flight (can run in parallel; Phase 2 strategy work doesn't block Phase 1 code)
- Phase 1 doesn't need to be complete for Phase 2 strategy to start, but the writer (Claude) should have seen at least the first few real engagement events before locking Pass A specs

**Time estimate:** ~3 days strategy work, parallelizable with Phase 1 dev.

**Definition of done:**
- Pass A, B, C each have a section in the v3 post-launch plan (or a new spec doc) at the same depth as P1.E (300+ lines for the journey, similar for each surface)
- Each Phase 3 ticket has a one-paragraph scope, file paths, and verify steps
- Logan signed off on the deepened specs

---

### Phase 3 — Operational surface implementation (~3–4 weeks)

**Goal:** Ship the admin-facing CRM workflow redesigns that Phase 2
strategy locked. After Phase 3, admins work the funnel through the
new tabs / timeline / Next Step.

**Scope** — 7 tickets, ordered:

1. **In Basket tabs final set** (§ 5.1) — rename `Replies` → `Emails`; smart-hide `Clients / Partners / Candidates` from horizontal tab row (move to sidebar-only); confirm Prospects · Calls · Emails · Meetings is the only horizontal set. **1 day.**

2. **Timeline split — Upcoming vs Past Activity** (§ 5.3) — `components/admin/medjobs/OutreachTimeline.tsx`. Two sections; engagement-chip grouping under email_sent rows. **3 days.**

3. **Next Step post-launch branches** (§ 5.2) — `components/admin/medjobs/NextStepCard.tsx`. Add stage bodies for engagement-driven sub-states (opened-not-clicked, clicked-not-activated, etc.). Per-stage primary action + action prompts. **3 days.**

4. **Emails tab redesign** (§ 5.5 + § 6.1) — single continuous event stream with pinned Needs Reply + Bounced; activity log with default filter (hide opens, show clicks/sends); Smartlead-inbox deep-link button on each Needs Reply row. **5 days.**

5. **Calls tab redesign** (§ 5.4) — Today + Upcoming sections; per-row spec with phone tap + purpose hint + log-outcome inline. **4 days.**

6. **Meetings tab base** (§ 5.6 minus webhook) — Upcoming + Needs Follow-up + No-show sections; new LogMeetingModal outcome "Activate pilot on their behalf" (post-meeting sub-state model). **3 days.**

7. **Calendly webhook + matching** (§ 5.6 + § 6.2) — `supabase/functions/calendly-webhook/` edge function; `invitee.created` + `invitee.canceled` + reschedule handlers; case-insensitive email match to outreach row; dispatch `mark_meeting_scheduled`; unmatched-bookings tray. **5 days.**

**Ticket order:**
- **Week 1**: Tickets 1 + 2 (tab rename + timeline split)
- **Week 2**: Ticket 3 (Next Step branches) + start 4 (Emails tab)
- **Week 3**: Finish 4; start 5 (Calls tab)
- **Week 4**: Finish 5; ship 6 (Meetings base) + 7 (Calendly webhook)

**Dependencies:**
- Phase 1 complete and producing engagement data
- Phase 2 strategy depth-pass complete
- Phase 0 Calendly admin access confirmed (Dr. DuBose's personal account, per Q3)

**Time estimate:** ~3–4 weeks at 1 dev (~18–20 days).

**Definition of done:**
- Admin uses the new tabs to work the funnel daily
- Engagement events surface in the right tabs at the right priority
- Provider self-booked Calendly meetings land in Meetings tab automatically
- Admin can activate the pilot on a provider's behalf from LogMeetingModal
- E2E: simulate provider clicks email → opens timeline shows engagement → admin gets called via Day-3 row in Calls tab → admin logs outcome → flow continues

---

### Phase 4 — Engagement-driven workflows (~2 weeks)

**Goal:** Wire the engagement signals (opens/clicks/replies) into
admin attention so the system surfaces the right rows at the right
time, not just passive data.

**Scope** — 4 tickets:

1. **Engagement → call-task priority bumping** (§ 5.7) — clicked rows rise to the top of the Day-5 calls queue; opened-but-not-clicked rows stay neutral; bounced rows generate a dedicated "fix email" task. Touches Calls tab ordering + a small priority field in `pending_tasks`. **3 days.**

2. **Pilot-active dormancy re-engagement** (§ 6.6) — provider activates but doesn't invite a student in 7 days → admin gets a "check in with {org}" task; provider doesn't visit in 14 days → admin reach-out task. **3 days.**

3. **Admin pilot-metrics dashboard** (§ 6.4) — surface at `/admin/medjobs/metrics` showing CTR (clicks/sent), activation rate (pilot_active/sent), reply rate, meeting rate, by campus and by week. Reuses the connections-tracker pattern. **4 days.**

4. **Returning Pilot Active provider experience** (§ 5.8) — when a Pilot Active provider visits olera.care/medjobs/candidates directly (no magic link), they land on the full board with a thin "Welcome back, {org_name} · {N} days left in your pilot" header. Settings + Verify-your-listing affordances surfaced. **2 days.**

**Dependencies:**
- Phase 1 complete (engagement data flowing)
- Phase 3 surfaces complete (places to render the priority bumps)
- Some real Pilot Active providers exist (at least a handful for testing)

**Time estimate:** ~2 weeks at 1 dev (~12 days).

**Definition of done:**
- Clicked rows visibly rise in Calls tab
- Dormant pilot-active providers generate admin tasks at the 7d and 14d marks
- Admin dashboard shows real funnel numbers
- Returning providers land on the full board with their session

---

### Phase 5 — Pilot lifecycle (~2 weeks)

**Goal:** Handle the pilot's end-of-life — expiry, end-pilot
self-serve, post-pilot continuation conversation.

**Scope** — 4 tickets:

1. **Pilot expiry behavior** (§ 7.7) — Day-T-7 admin reach-out task automatically generated; on `pilot_active_through < now()`, candidate board re-redacts (free tier predicate stops returning true); outreach drawer surfaces "pilot expired" status. **3 days.**

2. **Self-serve End-Pilot surface** (§ 7 + § 4.13) — provider portal page where Pilot Active providers can voluntarily end the pilot. Sets `pilot_active_through = now()` + emits admin notification + unlocks listing deletion. **3 days.**

3. **Provider feedback collection** (§ 6.5) — surface for the optional feedback the pilot agreement mentions ("Olera may request feedback... feedback sessions, surveys, or other formal or informal ways"). MVP: simple "How's the pilot going?" prompt + free-text + optional follow-up call request. Triggered at Day-30 + Day-60 of pilot. **3 days.**

4. **Pilot continuation flow** (§ 7.4) — post-3-month conversion to paid. New agreement template (separate from pilot agreement per PDF). Admin task at Day-T-14 to start conversation. Pricing + tier model TBD with TJ. **5 days + product-decision time.**

**Dependencies:**
- Phase 1 complete + at least one provider is approaching the 90-day mark
- TJ has decided post-pilot pricing model (NEW input needed)

**Time estimate:** ~2 weeks at 1 dev (~14 days), plus product decision cycles for ticket 4.

**Definition of done:**
- First Pilot Active provider reaching Day 83 generates the reach-out task
- Provider can end the pilot from settings; admin gets notified
- Feedback surface collects responses
- Continuation flow handles at least one real provider's conversion

---

### Phase 6 — Long-tail polish + extensions (open-ended, ongoing)

**Goal:** Capture low-priority items so they're tracked, not lost.

**Scope** — pulled from §§ 7 + 10 + DEFERRED items:

- **Inline Smartlead reply UI** (§ 7.5) — replace the "open Smartlead inbox →" deep-link with inline composition via Smartlead's reply API. Volume-dependent; ship when admins want it.
- **Magic-token verification flow** (§ 7.6) — collapse the existing formal verification flow into the magic-link path so Pilot Active providers get the "Verified" badge in one click. Big UX win but big code lift.
- **Provider self-serve admin tools** (§ 5.9) — let Pilot Active providers edit their public org info / verify their listing / configure notifications from the welcome page. Phase 3 in v3 deferred items.
- **Calendly account migration** (§ 7 + Q3 follow-up) — move from Dr. DuBose's personal Calendly to an Olera org account when ≥2 team members host events.
- **Multi-team-member support** (§ 7.3) — proper team-per-org schema rework. Unblocks the co-tenancy edge case. Long-term.

**Dependencies:**
- Phases 1–5 done
- Real demand signals (volume / team-size / admin feedback)

**Time estimate:** open-ended; each item is its own 1–2 week project.

**Definition of done:** N/A — items ship as demand surfaces.

---

### Out of scope for the MedJobs master plan

(For audit trail — explicitly out of this plan, tracked separately.)

- **Student-side flow** (§ 7.1) — what happens to the student after "Invite to interview" fires. Adjacent project; needs its own master plan. **Critical path:** before Phase 1 ships invites at volume, confirm student-side has at minimum a notification path.
- **Adjacent workstreams** (§ 7.8) — market diagnostic, family-side, benefits finder, general platform. Each has its own planning artifact.

---

### Phase task → master-plan-section traceability matrix

Every master-plan item maps to exactly one phase:

| Master plan section | Phase | Note |
|---------------------|-------|------|
| § 3.1 Pre-Flight v9.x | Phase 0 | QA + merge |
| § 3.2 Pre-Flight call modal | SHIPPED | — |
| § 3.3 Decision Maker single-slot | SHIPPED | — |
| § 3.4 "Mark not available" flags | SHIPPED | — |
| § 3.5 Smartlead bridge | Phase 0 | Env vars + Logan signoff |
| § 3.6 Catchment correction | SHIPPED | — |
| § 3.7 Find Email / Contact Form | SHIPPED | — |
| § 3.8 Connections tracker | SHIPPED | — |
| § 3.9 Pre-existing CRM scaffold | SHIPPED | — |
| § 4.1 Cadence change | Phase 1 ticket 1 | — |
| § 4.2 Per-call purpose | Phase 1 ticket 2 (in template copy) | — |
| § 4.3 Pilot Active terminal | Phase 1 ticket 6 (in activation API) | — |
| § 4.4 Email CTA + body | Phase 1 ticket 2 | — |
| § 4.5 Magic-link journey | Phase 1 ticket 4 | — |
| § 4.6 Four orthogonal axes | Phase 1 tickets 4 + 6 | Embedded in handlers |
| § 4.7 Welcome page = board | Phase 1 ticket 5 | — |
| § 4.8 Empty-state ladder | Phase 1 ticket 7 | — |
| § 4.9 T&C action triggers | Phase 1 ticket 6 | — |
| § 4.10 T&C modal UX | Phase 1 ticket 6 | — |
| § 4.11 Pilot activation API | Phase 1 ticket 6 | — |
| § 4.12 Co-tenancy edge case | Phase 1 ticket 8 | — |
| § 4.13 Listing deletion policy | Phase 1 ticket 11 | — |
| § 4.14 Pilot tier predicate | Phase 1 ticket 3 | — |
| § 4.15 Engagement tracking model | Phase 1 ticket 10 | Embedded in narration |
| § 4.16 Token security | Phase 1 ticket 4 | — |
| § 4.17 Smartlead webhook expansion | Phase 1 ticket 9 | — |
| § 5.1 In Basket tabs | Phase 3 ticket 1 | — |
| § 5.2 Next Step post-launch | Phase 2 Pass C strategy + Phase 3 ticket 3 | — |
| § 5.3 Timeline split | Phase 2 Pass C strategy + Phase 3 ticket 2 | — |
| § 5.4 Calls tab redesign | Phase 2 Pass A strategy + Phase 3 ticket 5 | — |
| § 5.5 Emails tab redesign | Phase 2 Pass A strategy + Phase 3 ticket 4 | — |
| § 5.6 Meetings tab + Calendly | Phase 2 Pass B strategy + Phase 3 tickets 6 + 7 | — |
| § 5.7 Engagement → call priority | Phase 4 ticket 1 | — |
| § 5.8 Returning provider experience | Phase 4 ticket 4 | — |
| § 5.9 Provider self-serve admin | Phase 6 | DEFERRED in v3 |
| § 6.1 Smartlead-inbox deep-link | Phase 2 Pass A strategy + Phase 3 ticket 4 | — |
| § 6.2 Calendly cancel/reschedule | Phase 2 Pass B strategy + Phase 3 ticket 7 | — |
| § 6.3 Post-meeting sub-state | Phase 2 Pass B strategy + Phase 3 ticket 6 | — |
| § 6.4 Pilot-metrics dashboard | Phase 4 ticket 3 | — |
| § 6.5 Provider feedback collection | Phase 5 ticket 3 | — |
| § 6.6 Pilot-active dormancy | Phase 4 ticket 2 | — |
| § 6.7 Brand-consistency one-liner | Phase 1 ticket 2 amendment | — |
| § 7.1 Student-side flow | OUT-OF-SCOPE | Separate plan |
| § 7.2 Stakeholder funnel | SHIPPED | Ongoing |
| § 7.3 Multi-team-member | Phase 6 | Long-term |
| § 7.4 Pilot continuation | Phase 5 ticket 4 | — |
| § 7.5 Inline Smartlead reply | Phase 6 | Volume-dependent |
| § 7.6 Magic-token verification | Phase 6 | DEFERRED in v3 |
| § 7.7 Pilot expiry behavior | Phase 5 ticket 1 | — |
| § 7.8 Adjacent workstreams | OUT-OF-SCOPE | — |
| § 10.4 Smartlead signoff pending | Phase 0 | — |

**Coverage check:** every § 3–§ 7 + § 10.4 item is in a phase or
explicitly OUT-OF-SCOPE. Nothing orphaned.

---

## 13. Glossary

| Term | Meaning |
|------|---------|
| Pilot Active | The provider terminal state. `interview_terms_accepted_at` set + `pilot_active_through > now()`. Maps to existing `active_partner` status + `converted` stage. |
| Pilot Preview | Informal name for the post-magic-link, pre-T&C state. Provider has axes 1 + 2a but not 2b or 3. |
| Magic link | Server-signed one-shot token in the email CTA. Carries `{outreach_id, email, jti, expires_at}`. Decodes to a signed-in session + JIT account creation. |
| Candidate board | The student-facing page at `/medjobs/candidates`. Public for unauthenticated viewers; auth-gated full-mode for paid + pilot tiers; preview-mode for pre-T&C signed-in viewers. |
| The four axes | 1 = auth identity, 2a = account linkage, 2b = claim status, 3 = pilot membership, 4 = public verification. Orthogonal; each advances on its own trigger. |
| Co-tenancy | When the business_profile is already claimed by a different account than the cold-email recipient. Resolved via read-only mode + admin reconcile task. |
| Engagement events | Email opens + clicks. Stored as payload updates on existing `email_sent` touchpoints (not new touchpoints). |
| Demo profile | Logan DuBose, clearly marked, used as the bottom rung of the empty-state ladder when no real or sample students fill the catchment. |
| `terms_accepted_via` | Audit field on `business_profiles.metadata`. Values: `"admin"` (from `make_client`) or `"self_serve"` (from `/api/medjobs/pilot/activate`). |
| `pilot_active_through` | Timestamp on `business_profiles.metadata`. Set to `now + 90d` at terms acceptance. Drives the pilot-tier predicate. |
| Stakeholder funnel | Parallel funnel for universities / professors / advisors / dept heads / student orgs. Same CRM, different conversion engine (`mark_partner`). |

---

## 14. Master plan status

**This document is a draft master plan.** It is comprehensive by
intent and traceable to the canonical detailed plans. It does not
re-specify; it catalogs.

**Awaiting Logan's review.** Once reviewed:
1. Confirm nothing major is missing
2. Discuss phasing (§ 12 lays out a provisional structure)
3. Decide whether to proceed with Phase 1 implementation as planned, or to do the Phase 2 strategy-depth-pass first

After phasing is agreed, this document becomes the durable source of
truth that all phase plans reference. Subsequent updates land here
when major decisions change.

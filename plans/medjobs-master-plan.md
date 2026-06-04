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
Each phase has its own detailed plan file (the source of truth for that
phase). This master plan's §12 is the **index** — point to the per-phase
plans for detail.

### Phase plans (filesystem)

| Phase | Plan file | Status | Coupling |
|-------|-----------|--------|----------|
| **Phase 1 — Admin operational backbone** | [`medjobs-phase-1-operational-backbone.md`](medjobs-phase-1-operational-backbone.md) | **DETAILED** (~6 weeks; 12 bullets) | Ships standalone |
| **Phase 2+3 — Magic link + Provider landing** | [`medjobs-phase-2-3-magic-link-and-landing.md`](medjobs-phase-2-3-magic-link-and-landing.md) | SKELETON (detail pass before build) | **Ships to prod together** |
| **Phase 4+5 — Conversion gate + Activation** | [`medjobs-phase-4-5-conversion.md`](medjobs-phase-4-5-conversion.md) | SKELETON (detail pass before build) | **Ships to prod together** |
| **Phase 6 — Post-launch ops** | [`medjobs-phase-6-postlaunch-ops.md`](medjobs-phase-6-postlaunch-ops.md) | SKELETON (deferred until real pilot providers exist) | Standalone |
| **Phase 7 — Polish + extensions** | [`medjobs-phase-7-polish.md`](medjobs-phase-7-polish.md) | SKELETON (demand-driven) | Per-bullet |
| Known issues / mid-build drain | [`medjobs-known-issues.md`](medjobs-known-issues.md) | Empty drain log | — |

### Workflow protocols

The full protocols live in the SCRATCHPAD + each phase plan. Summary:

- **Plans live in the filesystem**, not the conversation. Ideas captured to disk immediately.
- **One feature branch per phase pair.** Phase 1 alone. Then II+III on a branch. Then IV+V. Then VI. Then VII.
- **Phase complete = acceptance criteria met on Vercel preview** → Logan QAs → TJ merges to staging.
- **Inter-phase bug fixes** either patch staging directly (small) or roll into next phase's first commit.
- **Each phase plan has a Build log section** updated daily; an Open Issues section for cross-reference to `medjobs-known-issues.md`.
- **Logan approves at scope level** (the bullets). No per-commit gating during build.

### Phase ordering + estimated time

| Phase | Time | Starts after |
|-------|------|--------------|
| Phase 1 | ~6 weeks | Phase 0 (Smartlead env + Logan signoffs) clears |
| Phase 2+3 | ~3 weeks combined | Phase 1 ships to staging |
| Phase 4+5 | ~2 weeks combined | Phase 2+3 ships to staging |
| Phase 6 | ~2 weeks | Phase 5 ships + real Pilot Active providers exist |
| Phase 7 | Open-ended | Demand-driven; per-bullet |

**Total to Phase 5 (full conversion path live): ~11 weeks at 1 dev.**
Phase 6 + 7 are post-MVP polish.

### Phase 0 stabilization (no separate plan)

Phase 0 was reframed (2026-06-04) to drop the elaborate Pre-Flight QA expansion — that work just needs TJ to merge `merge/medjobs-staging-2026-06-02` → `staging` as a normal promotion. The remaining Phase 0 prep is small enough to live as inline pre-Phase-1 checklist:

- [ ] TJ merges `merge/medjobs-staging-2026-06-02` → `staging`
- [ ] Smartlead env vars set on Vercel prod + preview (`SMARTLEAD_API_KEY`, `SMARTLEAD_SENDER_EMAILS`, `SMARTLEAD_WEBHOOK_SECRET`) — `MEDJOBS_OUTREACH_ENGINE` stays UNSET until Phase 1+2+3+4+5 ship
- [ ] Smartlead webhook URL registered in Smartlead admin with `email_reply` + `email_bounce` events (open/click events added during Phase 1 Bullet 3)
- [ ] Logan signs off on sender identity (`logan@findmedjobs.co` + `partnerships@findmedjobs.co` proposed default), footer + unsubscribe copy, and outreach body copy walkthrough
- [ ] All approved senders confirmed warm + ready for cold sends

When this checklist closes, Phase 1 ticket cutting begins.

### Phase task → master-plan-section traceability matrix

Every master-plan item maps to exactly one phase (or explicit OUT-OF-SCOPE / SHIPPED):

| Master plan section | Phase | Note |
|---------------------|-------|------|
| § 3.1 Pre-Flight v9.x | Phase 0 | TJ merges branch to staging |
| § 3.2-3.4, 3.6-3.9 Pre-Flight + Decision Maker + Mark-not-available + Catchment + Find Email/Form + Connections tracker + CRM scaffold | SHIPPED | — |
| § 3.5 Smartlead bridge | Phase 0 | Env vars + Logan signoff |
| § 4.1 Cadence change | **Phase 1** bullet 2 | — |
| § 4.2 Per-call purpose copy | **Phase 2+3** bullet 6 (template rewrite) | — |
| § 4.3 Pilot Active terminal state | **Phase 4+5** bullet 5/1 (activation API) | — |
| § 4.4 Email CTA + body | **Phase 2+3** bullet 6 | — |
| § 4.5 Magic-link journey | **Phase 2+3** bullets 1-3 | — |
| § 4.6 Four orthogonal axes | **Phase 2+3** bullet 3 (axis 1+2a) + **Phase 4+5** bullet 1 (axis 2b+3) | — |
| § 4.7 Welcome page = board | **Phase 2+3** bullets 3-4 | — |
| § 4.8 Empty-state ladder | **Phase 2+3** bullet 6 | — |
| § 4.9-4.11 T&C triggers + modal + activation API | **Phase 4+5** Phase 4 bullets 1-6 + Phase 5 bullet 1 | — |
| § 4.12 Co-tenancy edge case | **Phase 2+3** bullet 4 | — |
| § 4.13 Listing deletion policy | **Phase 4+5** Phase 5 bullet 3 | — |
| § 4.14 Pilot tier predicate | **Phase 2+3** Phase 3 bullet 2 | — |
| § 4.15 Engagement tracking model | **Phase 1** bullet 3 (Smartlead webhook expansion) | — |
| § 4.16 Token security | **Phase 2+3** bullet 5 | — |
| § 4.17 Smartlead webhook expansion | **Phase 1** bullet 3 | — |
| § 5.1 In Basket tabs | **Phase 1** bullet 4 | — |
| § 5.2 Next Step post-launch | **Phase 1** bullets 1 (strategy) + 6 | — |
| § 5.3 Timeline split | **Phase 1** bullets 1 (strategy) + 5 | — |
| § 5.4 Calls tab redesign | **Phase 1** bullets 1 (strategy) + 7 | — |
| § 5.5 Emails tab redesign | **Phase 1** bullets 1 (strategy) + 8 | — |
| § 5.6 Meetings tab + Calendly | **Phase 1** bullets 1 (strategy) + 10 + 12 | — |
| § 5.7 Engagement → call priority | **Phase 1** bullet 7 (folded into Calls tab redesign) | — |
| § 5.8 Returning provider experience | **Phase 4+5** Phase 5 bullet 4 | — |
| § 5.9 Provider self-serve admin | **Phase 7** | — |
| § 6.1 Smartlead-inbox deep-link | **Phase 1** bullet 9 | — |
| § 6.2 Calendly cancel/reschedule | **Phase 1** bullet 12 (in webhook handlers) | — |
| § 6.3 Post-meeting sub-state machine | **Phase 1** bullets 1 (strategy) + 10 | — |
| § 6.4 Pilot-metrics dashboard | **Phase 6** | — |
| § 6.5 Provider feedback collection | **Phase 6** | — |
| § 6.6 Pilot-active dormancy | **Phase 6** | — |
| § 6.7 Brand-consistency one-liner | **Phase 2+3** bullet 7 | — |
| § 7.1 Student-side flow | OUT-OF-SCOPE | Separate plan; critical-path note in Phase 2+3 plan |
| § 7.2 Stakeholder funnel | SHIPPED | Ongoing |
| § 7.3 Multi-team-member | **Phase 7** | Long-term |
| § 7.4 Pilot continuation | **Phase 7** | Needs TJ pricing |
| § 7.5 Inline Smartlead reply | **Phase 7** | Volume-dependent |
| § 7.6 Magic-token verification | **Phase 7** | — |
| § 7.7 Pilot expiry behavior | **Phase 6** | — |
| § 7.8 Adjacent workstreams | OUT-OF-SCOPE | — |
| § 10.4 Smartlead signoff pending | Phase 0 | — |

**Coverage check:** every § 3–§ 7 + § 10.4 item is in a phase, SHIPPED, or explicitly OUT-OF-SCOPE. Nothing orphaned. New Logan I-V framing preserves all decisions from prior planning passes.

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

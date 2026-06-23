# MedJobs — Operational Brief (Engineering Reference)

> **This document is the canonical engineering reference for the MedJobs CRM system.** It is the source of truth for the system's architecture, vocabulary, state machine, discipline rules, and operational philosophy.
>
> **For future engineering work on MedJobs, start here.** New Claude sessions should be primed with: *"Read `docs/medjobs/OPERATIONAL_BRIEF.md` before we start."*
>
> **Companion document:** `docs/medjobs/EXECUTIVE_SUMMARY.md` — the human-readable executive summary distributed to the team. Both documents share vocabulary, philosophy, and the canonical tables; they differ in abstraction level and audience.
>
> **Production state at last update:** `main` at `5702be6` (May 14, 2026).

---

## How to Use This Document

This doc is reference-grade. Different sections serve different needs:

- **Sections 1–4** (orientation, philosophy, vocabulary, funnel) — read in full on first encounter; orient future Claude sessions
- **Section 5** (outcomes map) — the contract between Log modules and backend; reference when modifying any Log surface
- **Section 6** (state machine) — reference when changing state derivation, status transitions, or queue routing
- **Section 7** (architecture) — reference when working on queues, drawers, or NextStepCard
- **Sections 8–9** (UI/UX, outreach philosophy) — reference when shipping new admin-facing UX or new email/call templates
- **Section 10** (current state) — re-check before assuming what's built
- **Section 11** (team handoffs) — operational priorities for ongoing work
- **Appendices A–F** — discipline rules, deferred items, critical files, open architectural questions, hotfix log, vocabulary glossary

If you change the system in ways that affect any section's content, update this document.

---

## 1. Strategic Orientation

The MedJobs system exists to **put hundreds of thousands of university students into senior caregiver roles at scale, with a team small enough to fit in a single Zoom call.**

Everything else — Sites, catchments, Log modules, the Pre-Flight Checklist, the conversion engine, toast feedback — is in service of that single throughput goal.

Why no existing CRM fits:
- Salesforce / HubSpot are generic and expensive
- The workflow specificity is unique (university stakeholders → student channels → provider hiring → eventually family hiring)
- Success requires aggressive multi-channel outreach + meticulous operational follow-through
- Scale demands software-guided human behavior

The product is not a CRM. It is an **operationalized distribution engine for labor supply in elder care.** The three moats:
1. The tailored CRM itself
2. Email hygiene at scale (multi-domain rotation, warmup, reputation monitoring)
3. Database enrichment quality (catchment correctness + provider data completeness)

---

## 2. Core Operational Philosophy

Six principles. Every shipped commit upholds them. Every future change should.

### 2.1. Operational realism over process purity

Real outreach is non-linear. Pre-flight calls produce engagement before campaigns launch. Replies redirect us to different contacts. Providers commit without ever opening an email. Meetings end in no-show. The system supports these realities explicitly — pre-flight engagement bypass, "Redirected to another contact" Reply outcome, "No-show / rescheduling" Meeting outcome, conversion-from-any-modal. If the workflow is rigid, admins work around the system. That's how CRMs die.

### 2.2. Logging is meaningful, visible progression

Logging is not data entry. When an admin selects an outcome:
- A touchpoint is emitted (`lib/student-outreach/types.ts:TouchpointType`)
- The action dispatcher fires (`app/api/admin/student-outreach/[id]/route.ts`)
- Side-effects cascade: status transitions, task supersession, downstream queue updates
- A toast names the consequence (`components/admin/Toast.tsx` + `lib/student-outreach/log-success-messages.ts`)
- The destination queue briefly highlights the row (`components/admin/RecentMoves.tsx`)
- The timeline narrates the change in sentence form (`lib/student-outreach/narration.ts`)

If a Log outcome doesn't move the world visibly, it's either misnamed or shouldn't exist.

### 2.3. State derives from touchpoints; never stored separately

The canonical Stage of any row is **derived** from touchpoints + pending tasks + metadata. This is the architecture's hardest-won invariant.

- `Status` (stored): `lib/student-outreach/types.ts:Status` — durable row state
- `Stage` (derived): `lib/medjobs/stage.ts:deriveStage` — UI-level interpretation
- `RepliesState` (derived): `lib/student-outreach/state-derivation.ts:deriveRepliesState`
- `meeting_state` (derived): same file, single-pass DESC scan

Every Log outcome emits one or more touchpoints; the row's display state is computed on read. Single source of truth.

### 2.4. Aggression is the moat; CRM sustains it

If $20M were paid to reach a single provider, a human would use every channel — call, voicemail, email, LinkedIn, Facebook, fax, snail mail, conference, contact form. The CRM exists to make that aggression repeatable across 2,500+ providers with a five-person team. Current channels: email (Resend) + phone (queued tasks with Day-N scripts) + contact form (manual submission, banner + outcome action wired). Deferred channels: fax, snail mail, LinkedIn, IG DM, Facebook (TouchpointType supports them; UI doesn't yet exist).

### 2.5. Two prospect types, two conversion engines

> **⚠️ UPDATED (provider data & account reconciliation, 2026-06):** Provider
> conversion is now **SELF-SERVE ONLY**. The admin-on-behalf path
> (`make_client` / `handleMakeClient` / `convert_to_client` / `became_client`
> / the "Make client" button) was **removed**. A provider becomes a Client
> only by authenticating and accepting the pilot terms themselves via
> `POST /api/medjobs/pilot/activate`. There is no claimed-but-unowned state.
> `claim_state="claimed"` now means "owns the listing" (set on first
> authentication, including the magic link) and is **decoupled** from Client
> status (`interview_terms_accepted_at`). Stakeholder conversion via
> `mark_partner` is unchanged. The text below is retained for the
> stakeholder path and historical context.

The conversion routing is the single most important architectural invariant. **Provider rows convert via `make_client`. Stakeholder rows convert via `mark_partner`.** The wrong path on the wrong row half-converts.

- `make_client` (`handleMakeClient` in `route.ts`) — **REMOVED.** Provider conversion is self-serve (`/api/medjobs/pilot/activate`), which writes `business_profiles.metadata.interview_terms_accepted_at`, transitions status to `active_partner`, derives Stage to `converted`, and unlocks catchment Partner Prospects via `partner-prospect-gate.ts` (driven by the `active_partner` status).
- `mark_partner` (`handleMarkPartner`) — writes distribution evidence on the outreach row, transitions to `active_partner`, queues first seasonal email

Log-module gating after the change:
- **Call modal:** `convert_to_partner` (stakeholder only); the provider `convert_to_client` outcome was removed
- **Pre-flight modal:** engagement options offered are provider-appropriate
- **Reply modal:** `committed` (stakeholder only); the provider `became_client` classification was removed
- **Meeting modal:** `done_partner` (stakeholder); providers self-activate (no admin `done_client` conversion)

The conversion routing map is documented as an inline comment block in `route.ts` near the top of the action dispatcher.

### 2.6. Discipline preserves coherence (the G1–G10 rules)

Ten hard constraints on what kinds of changes can ship without explicit user review. See **Appendix A**. Spirit: no new backend enum values, no new actions in `route.ts`, no schema changes, no parallel state stores, no semantic drift. The recent two-week pass shipped zero new backend enum values, zero new actions, zero schema changes, while delivering substantial UX progress. The discipline is what makes incremental progress possible.

---

## 3. Engineering Vocabulary

Comprehensive reference. The executive summary's vocabulary table is a subset of this.

### Funnel primitives

| Term | Definition | Code reference |
|--|--|--|
| **Site** | University-anchored outreach unit | `student_outreach_campuses` table; `app/admin/medjobs/sites/` |
| **Catchment** | Cities → providers mapping per Site | `getProvidersInCatchment()` |
| **Provider Prospect (virtual)** | Catchment provider not yet in `student_outreach` | `/api/admin/medjobs/provider-prospects` |
| **Provider Prospect (materialized)** | Created `student_outreach` row, `kind='provider'` | `/api/admin/medjobs/provider-prospects/materialize` |
| **Partner Prospect** | Stakeholder candidate per Site | `kind ∈ {student_org, advisor, dept_head, professor}` |
| **Stakeholder** | A Partner Prospect (synonym) | — |
| **Client** | Terminal-positive for Provider funnel | `business_profiles.metadata.interview_terms_accepted_at` set; `isClientMeta()` in `partner-prospect-gate.ts` |
| **Partner** | Terminal-positive for Stakeholder funnel | Status `active_partner` + `distribution_evidence` |

### Contacts

| Term | Definition | Code reference |
|--|--|--|
| **General Contact** | Org-level contact info (info@, front desk) — per-outreach overrides + business_profile fallback | `research_data.general_contact` |
| **Specific Contact** | Named decision-maker individual | `student_outreach_contacts` table |

### Pre-flight & Outreach

| Term | Definition | Code reference |
|--|--|--|
| **Pre-Flight Checklist** | Required/recommended/optional gate to launch | `NextStepCard.tsx:ProspectBody` |
| **Pre-flight engagement bypass** | Live call short-circuits the campaign | `CallForEmailModal.tsx` engagement panel |
| **Outreach Launch** | Queues cadence tasks | `schedule_sequence` action; `planSequence()` |
| **Cadence** | Day-N sequence per recipient | `lib/student-outreach/cadence.ts` |
| **Sequencer** | Queues per-recipient per-day tasks | `lib/student-outreach/sequencer.ts` |
| **Cadence supersession** | Auto-cancellation of pending email/call tasks when conversation moves on | `supersedePendingOutreachEmails`, `supersedePendingFollowupCalls` |

### State system

| Term | Definition | Code reference |
|--|--|--|
| **Touchpoint** | Immutable audit log row; basis for state derivation | `student_outreach_touchpoints` table; `TouchpointType` |
| **Status** | Stored row state | `lib/student-outreach/types.ts:Status` |
| **Stage** | Derived row state for UI | `lib/medjobs/stage.ts:deriveStage` |
| **RepliesState** | Derived sub-state for Replies tab | `state-derivation.ts:deriveRepliesState` |
| **MeetingStatus** | UI-level choice key in LogMeetingModal | `LogMeetingModal.tsx:33` |
| **ReplyClassification** | UI-level choice key in ReplyClassifierModal | `ReplyClassifierModal.tsx:33` |
| **meeting_state** | Derived: `none` / `in_flight` / `scheduled` | `state-derivation.ts` |
| **viewed_at** | Tracks read/unread per row | Resets on every new touchpoint |

### Log modules

| Term | Definition | Code reference |
|--|--|--|
| **CallForEmailModal** | Pre-flight call Log modal | `components/admin/medjobs/CallForEmailModal.tsx` |
| **LogCallOutcomeModal** | Queued-call Log modal | `app/admin/student-outreach/LogCallOutcomeModal.tsx` |
| **ReplyClassifierModal** | Reply Log modal | `app/admin/student-outreach/ReplyClassifierModal.tsx` |
| **LogMeetingModal** | Meeting Log modal | `app/admin/student-outreach/LogMeetingModal.tsx` |
| **LogModalShell** | Shared modal chrome | `components/admin/medjobs/LogModalShell.tsx` |
| **StatusCard / ChoiceCard** | Radio-row outcome selector pattern | Inline in each Log modal |

### Conversion engine

| Term | Definition | Code reference |
|--|--|--|
| **Conversion engine** | The shipped routing that flips Status correctly per row kind | `route.ts` action dispatcher |
| **make_client** | Provider conversion action — writes metadata flag, unlocks catchment | `handleMakeClient()` |
| **mark_partner** | Stakeholder conversion action — writes evidence, queues seasonal | `handleMarkPartner()` |
| **distribution evidence** | Captured Partner commitment (verbal / class visit / flyer / email forward) | `PartnerEvidencePanel.tsx` |

### Queue & UI

| Term | Definition | Code reference |
|--|--|--|
| **In Basket** | Primary work surface — Prospects / Calls / Replies / Meetings tabs | `/admin/medjobs/in-basket` |
| **Drawer** | Per-row workspace — NextStepCard + Timeline + DangerZone | `Drawer.tsx`, `NextStepCard.tsx` |
| **NextStepCard** | Stage-driven primary action surface | `components/admin/medjobs/NextStepCard.tsx` |
| **Smart-hide** | Tabs auto-hide when count is zero | `MedJobsTabPage.tsx` |
| **Auto-revive** | Closed rows auto-flip to engaged on inbound reply | `handleLogReply` |
| **Recently-Moved** | Brief emerald tint in destination queue post-Log | `components/admin/RecentMoves.tsx` |
| **Toast** | Bottom-right progression message on Log dispatch | `components/admin/Toast.tsx` |
| **Stale badge** | Visual cue on Reply rows >4 days no reply | `STALE_DAYS = 4` |
| **Read/unread** | `viewed_at = null` until drawer opens | `viewed_at` field; resets on new touchpoint |

### Discipline & deferred concepts

| Term | Definition | Reference |
|--|--|--|
| **Discipline rules (G1–G10)** | Hard constraints on what kinds of changes can ship without surfacing | Appendix A |
| **Deferred items (D1–D25)** | Intentionally not-yet-built items tracked across sessions | Appendix B |
| **DangerZone** | Terminal admin overrides (DNC, Archive, Wrong contact, Redirect) from row overflow | `DangerZone.tsx` |

---

## 4. The Funnel — Architecture and Implementation

### Phase 1 — Prospecting

**Site primitive** (`student_outreach_campuses` table):
- Adding a Site creates a campus row
- Catchment cities are computed automatically based on geographic proximity to the university
- All non-medical home care providers in catchment cities are surfaced as **virtual** Provider Prospects (computed on read from `business_profiles`, never stored as outreach rows)
- University stakeholders are surfaced as Partner Prospects per Site

**Materialization** (`/api/admin/medjobs/provider-prospects/materialize`):
- Admin clicks to start outreach on a virtual prospect
- An active `student_outreach` row is created with `kind='provider'`, status starting at `prospect` or `researched`
- This avoids inserting thousands of rows on Site add

**Pre-Flight Checklist** (`NextStepCard.tsx:ProspectBody`):
- Tracks per-outreach overrides (`research_data.general_contact`) distinctly from directory fallback (`business_profile`)
- Three tiers:
  - **Required** (blocks launch): General Contact email, phone, full address, contact form resolution (when URL exists)
  - **Recommended** (encouraged, doesn't block): Website, Contact form URL, Fax
  - **Optional**: Research notes
- Explicit `null` (admin cleared) is honored distinct from `undefined` (never set) — fixes the silent-fallback bug from Item 1 of the Graize 05.13 audit

**Pre-flight engagement bypass** (`CallForEmailModal.tsx`):
- Admin clicks "Call to obtain information" → modal opens
- Selecting "Reached someone" reveals the engagement panel
- Engagement options (Just got info / Promised callback / Interested / Became a Client / Not interested) dispatch via `log_call_outcome` instead of `log_research_call`
- Engagement-bypass outcomes trigger the full conversion engine — campaign launch becomes unnecessary

### Phase 2 — Outreach + Logging

**Outreach launch** (`schedule_sequence` action → `planSequence()` in `sequencer.ts`):
- Day-0 email fires inline (Resend)
- Per-recipient per-day tasks queue forward (Day 3, Day 5, Day 7, etc., per cadence config in `lib/student-outreach/cadence.ts`)
- `outreach_email_send` tasks for outbound emails; `outreach_followup_call` tasks for scheduled calls

**Queue surfaces** (`/api/admin/student-outreach/queue/route.ts`):
- **Calls tab**: pending `outreach_followup_call` tasks with `due_at ≤ now`
- **Replies tab**: rows where outbound activity exists and we're awaiting reply (mid_cadence / engaged / awaiting_callback / wants_meeting / booked / needs_followup / stale)
- **Meetings tab**: rows with `meeting_state ∈ {in_flight, scheduled}`

**Queue ordering** is stable — by `due_at` (Calls) or last inbound timestamp (Replies) or `meeting_at` (Meetings), all ascending. No reshuffling on state change. Badges (`stale`) signal urgency without resorting.

**The drawer is the workspace**:
- `NextStepCard` surfaces a stage-appropriate primary action
- For Calls stage: primary "Log call outcome →" + **secondary "Log reply"** (added in the recent pass to handle the cross-context case where a row appears in both Calls and Replies queues simultaneously)
- For Reply stage: "Log reply"
- For Meeting stage: "Log meeting"
- Full touchpoint timeline below the NextStepCard
- DangerZone (terminal admin overrides) at the bottom

**Every Log outcome:**
1. Emits one or more touchpoints (immutable audit log)
2. Routes through `route.ts` to a registered action handler
3. Triggers downstream side-effects (state transitions, task supersession, conversion engine fires, etc.)
4. Fires a toast naming the consequence (via `logActionSuccessMessage`)
5. Marks the row as recently moved (`useRecentMoves().markMoved()`)

**Cadence supersession** is centralized: `supersedePendingOutreachEmails` and `supersedePendingFollowupCalls` are called from every action that means "the conversation has moved on" — `connected_engaged`, `wants_meeting`, `already_booked`, `email_replied`, etc. The system maintains coherence without admin intervention.

**Auto-revive**: if a `no_response_closed` row receives an inbound `email_replied` touchpoint, `handleLogReply` flips it back to `engaged`. The only terminal status that auto-revives — `not_interested`, `do_not_contact`, `wrong_contact`, `redirected` all require manual `reopen` action.

### Phase 3 — Conversion

**Provider → Client** (`handleMakeClient`):
- Writes `business_profiles.metadata.interview_terms_accepted_at = now()`
- Transitions outreach row to `active_partner` status
- `transitionStage` cancels pending tasks via `tasksToCancelOnExit`
- Stage derives to `converted`
- `partner-prospect-gate.ts:isClientMeta()` now returns true → unlocks catchment-area Partner Prospects on next read

**Stakeholder → Partner** (`handleMarkPartner`):
- Writes `distribution_evidence` payload on the outreach row
- Emits `distribution_confirmed` touchpoint
- Transitions to `active_partner`
- Queues the first seasonal check-in email task
- For student_org rows, also queues a `yearly_leadership_recheck` task

Both engines emit `stage_change` touchpoints for the timeline narration.

### Logs / History

`/admin/medjobs/logs` (`app/admin/medjobs/logs/page.tsx`):
- Filterable feed by type and source
- Uses its own `describeTouchpoint` renderer (`CompletedTaskCard`) — verb-first, scannable
- **Distinct** from `OutreachTimeline.tsx` which uses `narrateTouchpoint` (sentence-form narration with consequence cues)
- Two renderers, two intentional contexts — don't unify them

---

## 5. Outcomes Map (Full)

The contract between Log modules and the backend. Every outcome, every action dispatched, every touchpoint emitted, every state transition, every side-effect, every toast message.

### Pre-flight Call modal — `CallForEmailModal`

| Outcome key | Engagement (sub-key) | Action dispatched | Touchpoint(s) emitted | Status transition | Side-effects | Toast | Next visible state |
|--|--|--|--|--|--|--|--|
| `no_answer` | — | `log_research_call` | `call_no_answer` | — | — | "Pre-flight call logged — no answer" | Prospect (unchanged) |
| `voicemail` | — | `log_research_call` | `call_voicemail` | — | replies_state derives to `awaiting_callback` | "Pre-flight call logged — voicemail / message left" | Prospect + Replies |
| `connected` | `none` | `log_research_call` | `call_connected` | — | Optional `add_contact` | "Pre-flight call logged — reached someone" | Prospect |
| `connected` | `promised_callback` | `log_call_outcome` | `call_connected` w/ awaiting_callback | → `engaged` | — | "Callback expected — row moved to Replies" | Replies (awaiting_callback) |
| `connected` | `connected_engaged` | `log_call_outcome` | `call_connected` | → `engaged` | Supersede pending emails + calls | "Interested — cadence stopped, row moved to Replies" | Replies (engaged) |
| `connected` | `convert_to_client` | `log_call_outcome` → `handleMakeClient` | `call_connected` + `stage_change` | → `active_partner` | Writes `interview_terms_accepted_at`; Partner Prospects unlock | "Became a Client — Partner Prospects unlocked" | Converted |
| `connected` | `connected_not_interested` | `log_call_outcome` | `call_connected` | → `not_interested` | Cancel pending via `tasksToCancelOnExit` | "Closed as Not interested" | Closed |
| `wrong_number` | — | `log_research_call` | `call_wrong_number` | — | — | "Closed — wrong number" | Prospect (unchanged) |

### Call modal — `LogCallOutcomeModal`

| Outcome key | Action dispatched | Touchpoint(s) emitted | Status transition | Side-effects | Toast | Next visible state |
|--|--|--|--|--|--|--|
| `no_answer` | `log_call` | `call_no_answer` | — | Mark current call task complete | "Call logged — row reappears on the next phone day" | Calls (next phone day) |
| `voicemail` | `log_call` | `call_voicemail` w/ `awaiting_callback:true` | — | Mark current call task complete; replies_state → `awaiting_callback` | "Voicemail logged — row moved to Replies" | Replies (awaiting) |
| `wrong_number` | `log_call` | `call_wrong_number` | → `wrong_contact` | Cancel pending | "Closed — wrong contact" | Closed |
| `promised_callback` | `log_call` | `call_connected` w/ `awaiting_callback:true` | → `engaged` | Mark current call task complete; replies_state → `awaiting_callback` | "Callback expected — row moved to Replies" | Replies (awaiting) |
| `connected_engaged` | `log_call` | `call_connected` | → `engaged` | Supersede pending emails + calls | "Interested — cadence stopped, row moved to Replies" | Replies (engaged) |
| `meeting_scheduled` (P1) | `mark_meeting_scheduled` | `meeting_scheduled` | → `meeting_scheduled` | meeting_state → `scheduled`; optional `meeting_at`; supersede pending | "Meeting scheduled — row moved to Meetings" | Meetings (booked) |
| `convert_to_partner` (stakeholder) | `log_call` + `mark_partner` | `call_connected` + `distribution_confirmed` + `stage_change` | → `active_partner` | Writes evidence; queues seasonal | "Marked as Partner — row converted" | Converted |
| `convert_to_client` (provider) | `log_call` + `handleMakeClient` | `call_connected` + `stage_change` | → `active_partner` | Writes metadata flag; Partner Prospects unlock | "Became a Client — Partner Prospects unlocked" | Converted |
| `connected_not_interested` | `log_call` | `call_connected` | → `not_interested` | Cancel pending | "Closed as Not interested" | Closed |
| `mark_dnc` (R5) | `mark_dnc` | `stage_change` | → `do_not_contact` | Cancel pending; no auto-revive | "Closed — communications stopped" | Closed (DNC) |
| `mark_no_response_closed` (R5) | `mark_no_response_closed` | `stage_change` | → `no_response_closed` | Cancel pending; auto-revivable on inbound | "Archived as no response" | Closed (archivable) |

### Reply modal — `ReplyClassifierModal`

| Classification key | Action dispatched | Touchpoint(s) emitted | Status transition | Side-effects | Toast | Next visible state |
|--|--|--|--|--|--|--|
| `keep_emailing` | `classify_reply` → `log_email_replied` | `email_replied` | → `engaged` | Supersede pending emails + calls | "Reply logged — cadence stopped" | Replies (engaged) |
| `wants_meeting` | `classify_reply` → `flag_wants_meeting` | `note_added{reason:meeting_in_flight}` | → `engaged` | meeting_state → `in_flight`; supersede pending | "Row moved to Meetings — finding a time" | Meetings (in flight) |
| `already_booked` | `classify_reply` → `mark_meeting_scheduled` | `meeting_scheduled` | → `meeting_scheduled` | meeting_state → `scheduled`; optional `meeting_at`; supersede pending | "Meeting booked — row moved to Meetings" | Meetings (booked) |
| `committed` (stakeholder) | `classify_reply` + `mark_partner` | `distribution_confirmed` + `stage_change` | → `active_partner` | Writes evidence; queues seasonal | "Marked as Partner — row converted" | Converted |
| `became_client` (P3, provider) | `make_client` | `stage_change` | → `active_partner` | Writes metadata flag; Partner Prospects unlock | "Became a Client — Partner Prospects unlocked" | Converted |
| `redirected` (P4) | `add_contact` + `classify_reply(keep_emailing)` | `contact_added` + `email_replied` | → `engaged` | New contact added; original cadence stops | "Contact added" + "Reply logged — cadence stopped" (two toasts) | Replies (engaged) w/ new contact |
| `not_interested` | `classify_reply` | `stage_change` | → `not_interested` | Cancel pending | "Closed as Not interested" | Closed |

### Meeting modal — `LogMeetingModal`

| Status key | Action dispatched | Touchpoint(s) emitted | Status transition | Side-effects | Toast | Next visible state |
|--|--|--|--|--|--|--|
| `finding_time` | `flag_wants_meeting` | `note_added{reason:meeting_in_flight}` | → `engaged` (if not already) | meeting_state → `in_flight`; supersede pending | "Meeting in flight — row moved to Meetings" | Meetings (in flight) |
| `booked` | `mark_meeting_scheduled` | `meeting_scheduled` | → `meeting_scheduled` | meeting_state → `scheduled`; `meeting_at` set if provided; supersede pending | "Meeting scheduled — row moved to Meetings" | Meetings (booked) |
| `done_partner` (stakeholder) | `mark_partner` | `distribution_confirmed` + `stage_change` | → `active_partner` | Writes evidence; queues seasonal | "Marked as Partner — row converted" | Converted |
| `done_client` (P3, provider) | `make_client` | `stage_change` | → `active_partner` | Writes metadata flag; Partner Prospects unlock | "Became a Client — Partner Prospects unlocked" | Converted |
| `done_followup` | `mark_meeting_followup` | `meeting_held` + `note_added{reason:post_meeting_followup}` | unchanged | replies_state → `needs_followup`; notes required | "Sent to Replies for follow-up" | Replies (needs_followup) |
| `not_a_fit` (C3) | `mark_not_interested` | `stage_change` | → `not_interested` | Cancel pending | "Closed as Not interested" | Closed |
| `no_show` (P6) | `flag_wants_meeting` w/ `no_show:true` | `meeting_no_show` + `note_added{reason:meeting_in_flight}` | unchanged | meeting_state stays `in_flight` (DESC scan picks newer note); supersede pending | "No-show logged — row ready for rescheduling" | Meetings (in flight) |

---

## 6. State Machine Reference

### 6.1. Canonical lifecycle with bypass paths

```
                  ┌─────────────────┐
                  │   Site added    │
                  └────────┬────────┘
                           ▼
                ┌──────────────────────┐
                │  Provider Prospect   │  (virtual)
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │     Materialize      │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │ Pre-Flight Checklist │
                └──────────┬───────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   ┌────────────────┐          ┌────────────────────┐
   │ Launch         │          │ Pre-flight Call    │  ◄── ① BYPASS
   │ Outreach       │          │ (research call)    │
   └────────┬───────┘          └─────────┬──────────┘
            │                            │
            ▼                            │
   ┌────────────────┐                    │
   │  In Outreach   │ ◄──────────────────┘
   └────────┬───────┘ ◄── ⑦ AUTO-REVIVE
            │
       ┌────┴────┐
       ▼         ▼
  ┌─────────┐ ┌─────────┐
  │  Calls  │ │ Replies │
  └────┬────┘ └────┬────┘
       │           │
       └─────┬─────┘
             ▼
       ┌──────────┐
       │ Meetings │ ◄── ⑥ NO-SHOW loop
       └─────┬────┘
             ▼
       ┌──────────────┐
       │  Conversion  │ ◄── ③④⑤ BYPASS
       └──────┬───────┘
              ▼
       Client / Partner

       From any non-terminal state:
       → Not Interested  → Do Not Contact
       → Wrong Contact   → No Response Closed (⑦ auto-revivable)
```

### 6.2. Status transitions (full)

| From | Trigger (action / event) | To | Conditions | Side effects | Notes |
|--|--|--|--|--|--|
| `prospect` | `log_research_call` (any outcome) | `prospect` | — | Touchpoint logged | No status change in pre-flight default path |
| `prospect` / `researched` | `log_call_outcome` w/ `connected_engaged` (pre-flight engagement) | `engaged` | — | — | Pre-flight bypass — campaign never launches |
| `prospect` / `researched` | `log_call_outcome` w/ `convert_to_client` (pre-flight) | `active_partner` | provider row | Writes metadata flag; Partner Prospects unlock | Conversion before campaign launch |
| `prospect` | `schedule_sequence` | `outreach_sent` | Pre-flight checklist required items met | Day-0 fires inline; per-recipient tasks queue for Day N | — |
| `outreach_sent` | inbound `email_replied` touchpoint | `engaged` | — | Supersede pending emails + calls | Auto on inbound; admin still logs classification after |
| `outreach_sent` / `engaged` | `classify_reply` w/ `wants_meeting` | `engaged` (unchanged) | — | meeting_state → in_flight; supersede pending | Row moves Replies → Meetings |
| `engaged` / `outreach_sent` / `prospect` | `mark_meeting_scheduled` | `meeting_scheduled` | — | meeting_state → scheduled; `meeting_at` set; supersede pending | — |
| `meeting_scheduled` | `mark_meeting_followup` | `meeting_scheduled` (unchanged) | Notes required | meeting_held + note_added emitted; replies_state → needs_followup | Row moves Meetings → Replies |
| any (kind=provider) | `make_client` | `active_partner` | Provider row only | Writes `business_profiles.metadata.interview_terms_accepted_at`; cancel pending; queue Partner Prospect unlocks | Stage derives to `converted` |
| any (kind=stakeholder) | `mark_partner` | `active_partner` | Stakeholder row only; evidence required | `distribution_confirmed` emitted; cancel pending; queue first seasonal | Stage derives to `converted` |
| any non-terminal | `mark_not_interested` | `not_interested` | — | Cancel pending via `tasksToCancelOnExit` | — |
| any non-terminal | `mark_dnc` | `do_not_contact` | — | Cancel pending; no auto-revive | — |
| any non-terminal | `mark_wrong_contact` | `wrong_contact` | — | Cancel pending | — |
| any non-terminal | `mark_no_response_closed` | `no_response_closed` | — | Cancel pending | Auto-revivable on inbound reply |
| `no_response_closed` | inbound `email_replied` | `engaged` | Only this terminal status auto-revives | Clear `reopen_at`; supersede pending (vacuous) | The anti-fragility move |
| any closed | `reopen` action | `engaged` | Manual admin override | — | — |

### 6.3. Sub-state transitions

**`meeting_state` (derived, DESC scan of touchpoints):**

| From | Trigger touchpoint | To | Notes |
|--|--|--|--|
| `none` | `note_added{reason:meeting_in_flight}` (most recent meeting-decisive touchpoint) | `in_flight` | From `flag_wants_meeting` |
| `in_flight` | `meeting_scheduled` | `scheduled` | From `mark_meeting_scheduled`; carries `meeting_at` |
| `scheduled` / `in_flight` | `meeting_held` / `meeting_no_show` / `meeting_rescheduled` (alone) | `none` | Logged meeting concludes the cycle |
| `scheduled` / `in_flight` | `note_added{reason:post_meeting_followup}` | `none` | From `mark_meeting_followup` |
| `scheduled` | `note_added{reason:meeting_in_flight}` emitted AFTER `meeting_no_show` (P6 path) | `in_flight` | The no-show + rescheduling pattern — DESC scan picks the newer note |

**`replies_state` (derived; precedence top → bottom):**

| Condition | replies_state |
|--|--|
| `followup_at` present (post_meeting_followup note exists) | `needs_followup` |
| `meeting_state === "scheduled"` | `booked` |
| `meeting_state === "in_flight"` | `wants_meeting` |
| `awaiting_callback_at` present (voicemail or promised callback unresolved) | `awaiting_callback` |
| `last_reply_at > last_email_sent_at` (or reply but no email) | `engaged` |
| Cadence done AND >4 days since last email | `stale` |
| Default | `mid_cadence` |

### 6.4. Stage derivation (highest priority wins)

| Priority | Stage | Condition |
|--|--|--|
| 1 | `closed` | Status ∈ {not_interested, no_response_closed, do_not_contact, wrong_contact, redirected} |
| 2 | `converted` | Status ∈ {active_partner, agreed, distributed} OR provider w/ `isClientMeta()` |
| 3 | `bounce_fix` | Latest `email_bounced` newer than latest `email_sent` |
| 4 | `call_due` | Pending `outreach_followup_call` / `outreach_day_0` task with `due_at ≤ now` |
| 5 | `follow_up` | Pending `manual_followup{reason:custom}` with `due_at ≤ now` |
| 6 | `meeting_set` | meeting_state ∈ {in_flight, scheduled} OR recent `meeting_held` without post-meeting follow-up |
| 7 | `in_outreach` | Status ∈ {outreach_sent, engaged} (default post-launch) |
| 8 | `prospect` | Default pre-launch |

### 6.5. Status → Stage mapping (admin-visible)

| Stored Status | Derived Stage | Where they surface |
|--|--|--|
| `prospect` / `researched` | Prospect | Prospects tab |
| `outreach_sent` | In Outreach (or Call Due if call task overdue) | Calls or Replies tab |
| `engaged` | In Outreach / Call Due / Meeting Set / Follow Up (priority-derived) | Calls / Replies / Meetings tab |
| `meeting_scheduled` | Meeting Set | Meetings tab |
| `active_partner` (provider w/ metadata flag) | Converted | Out of active queues |
| `active_partner` (stakeholder) | Converted | Out of active queues |
| `not_interested` / `do_not_contact` / `wrong_contact` / `redirected` | Closed | Archive / overflow |
| `no_response_closed` | Closed (auto-revivable) | Archive; reappears on inbound reply |

---

## 7. CRM Architecture

### 7.1. Operational cards, queues, drawers

A single `student_outreach` row can surface in multiple queues simultaneously (e.g., mid-cadence with calls due AND awaiting reply). The card surfaces are the operational lens; the drawer is the workspace.

**Cards are stable.** Queue ordering is deterministic (by scheduled time or last inbound timestamp, ascending). Badges (`stale` at >4 calendar days) signal urgency without resorting. No smart resorting, no dynamic priority scoring. Stability beats cleverness — admins build muscle memory around card positions.

**Drawer is the workspace.** Pre-flight checklist, snapshot, NextStepCard with stage-appropriate primary action, full touchpoint timeline, DangerZone at the bottom. Intentionally information-dense — admins are doing work here, not browsing.

### 7.2. Workflow advancement

Cards advance by **resolution**, not movement. An admin logs an outcome; the card closes (or modifies state); a new card may appear elsewhere. The visible UX:
- Row jumps tabs
- Recently-Moved highlight in destination (`components/admin/RecentMoves.tsx`)
- Toast names the consequence (`components/admin/Toast.tsx`)
- Timeline narrates in sentence form (`lib/student-outreach/narration.ts`)
- Sidebar count chip pulses (`components/admin/AdminSidebar.tsx`)

The system supports non-linear movement (the bypass paths in section 6.1). Flexibility paths exist because real outreach is non-linear. The system that pretends otherwise gets bypassed.

### 7.3. The conversion engine, restated

Single most important architectural invariant. **Provider rows convert via `make_client`. Stakeholder rows convert via `mark_partner`.** The wrong path on the wrong row half-converts.

All four Log modules gate this correctly (post-R1 + post-P3). The routing map is documented inline in `route.ts` as a comment block near the dispatcher.

### 7.4. Touchpoint vocabulary

Complete list lives in `lib/student-outreach/types.ts:TouchpointType`. Notable: `meeting_no_show`, `meeting_held`, `meeting_rescheduled` exist; only `meeting_no_show` is currently emitted (via `flag_wants_meeting` with `no_show: true`, post-P6). The discipline of "no new touchpoint types" forces engineering to use what's there before inventing.

### 7.5. Read/unread, smart-hide, queue stability

- Every new touchpoint resets `viewed_at = null` (row goes unread)
- Drawer open marks read
- `mark_unread` action restores unread
- Smart-hide hides tabs with zero counts (you don't see Meetings tab if no meetings exist)
- Queue ordering never reshuffles on state change

Mature and working. Don't touch unless explicitly needed.

---

## 8. UI/UX Philosophy

### 8.1. Restrained, predictable, unified

Four Log modules share `LogModalShell` (post-C4). Outcomes use `StatusCard` / `ChoiceCard` patterns. Toast is bottom-right, emerald, auto-dismissing at ~3.5s. Recently-moved highlight is a 500ms emerald tint fading to transparent over ~5s. Sidebar count chips pulse emerald on change. Visual language is intentionally narrow.

### 8.2. Every interaction names its consequence

Toast messages aren't generic ("Saved!"). They name what happened ("Interested — cadence stopped, row moved to Replies", "Became a Client — Partner Prospects unlocked", "No-show logged — row ready for rescheduling"). Timeline narration is sentence-form ("Reached Alice — interested. Cadence stopped; row moved to Replies."). The admin should never have to infer what happened.

### 8.3. Anti-clutter discipline

"Fewer but smarter actions" is the operating principle. Several outcomes have been intentionally NOT shipped (Stop communications in Reply, Tone tokens removal, "Interested" relabeling to "Reached decision-maker — interested") because they would have added choice friction without admin benefit. The discipline of *deferring* is as load-bearing as the discipline of shipping.

### 8.4. Contextual flexibility without ambiguity

Same operational state, different label across modules: "Interested" in Call ≠ "They replied" in Reply ≠ "Still finding a time" in Meeting. Intentional — each surface has a domain voice. What IS unified is the underlying state engine.

### 8.5. Visible state, observable progression

Stage pill, unread bold border, stale badge, recently-moved tint, toast, sidebar count pulse. Five layers of visible state. The admin should feel the system breathing.

---

## 9. Outreach Philosophy

### 9.1. Non-salesy, credibility-first messaging

Templates open with university-specific framing ("Olera's Texas A&M Student Caregiver Program"). Bold the program substance ("This program matches X with Y to fill caregiver roles, PRN shifts, and support staffing needs"). Position students as motivated by hands-on experience + mentorship + medical/PA/nursing-school recommendation letters. Not "we have caregivers, please hire them."

### 9.2. The CTA is operational, not aspirational

"We hope you'll accept this invitation. The next step is to reply directly to this email expressing interest, or schedule a quick informational call with Dr. Logan DuBose directly." Crisp. Action-oriented. No marketing-speak.

### 9.3. Multi-channel from day one

Email (Resend) + phone (queued calls with Day-N scripts) + contact form (when URL on file, generates copy-ready message). Eventually: fax + snail mail + LinkedIn DM + Facebook + IG DM. Each new channel multiplies effectiveness against the same prospect.

### 9.4. Local + university relevance

Templates reference the specific campus name. Sequencer call scripts say "Olera's {campus_name} Student Caregiver Program." This is not personalization theater — it's contextual relevance that materially changes reply rates.

### 9.5. Front desk is a real intermediary

The "Voicemail / message left with front desk" label collapses what would otherwise be two separate outcomes. Front desks are a routing layer, not a dead end. Notes capture the distinction; the dispatch is the same.

### 9.6. Aggression sustained by the system, not the human

The reason humans burn out doing outreach is the per-prospect cognitive load. The CRM removes that load by tracking state and surfacing the next action. The human's job is to make the call, read the reply, hold the meeting, log the outcome. The system holds everything else.

---

## 10. Current State

### 10.1. Built and shipped to production

- Sites add-flow with auto-cascading catchments (virtual Provider Prospects pattern)
- Provider Prospect drawer + Pre-Flight Checklist with required/recommended/optional tiers and engagement bypass support
- All four Log modules (Pre-flight, Call, Reply, Meeting) — vocabulary unified, conversion accessible from all four
- Pre-flight modal migrated to `LogModalShell` + `StatusCard` for visual consistency
- Outreach launch + cadence sequencer with per-recipient per-day task queueing
- Conversion engine — `make_client` (provider) and `mark_partner` (stakeholder) routing correctly, with downstream side-effects firing
- Auto-revive on `no_response_closed` + inbound reply
- Logs page with filterable feed; drawer timeline with sentence-form narration
- Toast layer + RecentMoves layer + sidebar count pulse
- DangerZone for terminal admin overrides; some surfaced in Log call modal (R5)
- Stable queue ordering + read/unread + smart-hide
- Two hotfixes: `log_call_outcome` action alias and CallDueBody secondary "Log reply" CTA

### 10.2. Partially built / needs admin-driven iteration

- **Database enrichment**: directory has providers but completeness varies; some catchments may be sparse; specific decision-makers often missing
- **Email hygiene infrastructure**: single-domain sending; bounce rates not actively monitored; no multi-domain rotation. Functional for low volume; fragile at 25-site scale.
- **Contact form workflow**: banner + `log_contact_form_outcome` action wired; admin must manually visit external form and return to mark Submitted
- **Per-recipient cadence**: per-contact tasks queue correctly; mid-campaign Specific Contact addition works via `enroll_contact_in_cadence`, UX is admin-driven
- **Quarterly partner check-in**: first seasonal email auto-queues; ongoing quarterly cadence not yet built

### 10.3. Not yet built (deferred — see Appendix B)

- Calendly webhook ingestion (D1)
- Inbound email parsing / auto-classification (D2)
- Fax outreach send infrastructure (D18)
- Snail mail outreach send infrastructure (D19)
- LinkedIn / IG DM / Facebook outreach UI (D20)
- Quarterly client check-in automation (D21)
- Care Shifts direct family hire flow (D23)
- Agency-uploaded caregiver pool (D24)
- Multi-domain email rotation / warmup automation (D25 — highest-priority future build)

### 10.4. Refinement opportunities

- Post-meeting `InOutreachBody` distinction (D17) — when a row drops back to `in_outreach` after `done_followup`, the drawer shows generic "Awaiting reply" copy
- Tab-bar count pulse (D22) — sidebar counts pulse; in-page tab bar counts don't
- Conversion from row overflow menus — currently only via Log modules

### 10.5. Operational risks

- **Email reputation collapse at scale** — most pressing risk; addressed by D25
- **Bad catchment data → wrong prospects** — addressed by Priority 3 audit
- **Admin behavior drift if system feels broken** — addressed by R5/E1/E2 + ongoing operational iteration
- **Late-breaking bugs only visible post-deploy** — the `log_call_outcome` 400 alias hotfix is the canonical example

### 10.6. Architectural debt watch

- `convert_to_partner` → chained `mark_partner` evidence panel is a fragile two-action flow
- `log_call` vs `log_call_outcome` action aliasing was a hotfix; long-term, FE should unify
- `MeetingStatus` / `ReplyClassification` UI-level union extensions accumulating; watch for break point at ~10 entries

---

## 11. Team Handoffs

### 11.1. For Grazy and Esther — outreach/admin operators

**Your job: operate the system as if you are interns competing for a perfect grade.**

Grade criteria:
1. How many Clients you convert
2. How many Partners you convert
3. How many distinct refinement findings you produce

Each refinement finding is worth as much as a conversion. Both move the project forward.

Operating priorities:
- Pick 3–5 universities to seed first. Validate catchments and provider data.
- Run every Provider Prospect through the full funnel: Pre-Flight → Outreach Launch → Calls → Replies → Meetings → Conversion (or terminal decline). Log every outcome honestly.
- When something feels janky, capture it (screen, click, expected, actual). Don't fix it yourself; surface it.
- Try the non-linear paths: pre-flight call that converts immediately, reply that redirects, meeting that no-shows. Verify they work in practice.

What to expect:
- The system is "operationally complete for the major scenarios" but not "every edge case polished." You will hit edges. Surface them; don't work around them silently.
- Conversion target across 3–5 sites in 2 weeks: aim for first Client, first Partner. Anything beyond is bonus.

### 11.2. For TJ — engineering

Two-week priority order:

**1. Email hygiene deep dive (#1 strategic moat).**
- Audit current sending infrastructure (Resend setup, sender domains, bounce handling)
- Design multi-domain rotation strategy for ~10,000+ emails/week at maturity
- Identify warmup, reputation monitoring, complaint-handling gaps
- Spec the implementation; if scope allows, build the foundation
- Goal: clear path to "we can send 10,000 emails/week without burning domains"

**2. Database enrichment audit.**
- Walk Site → cities → providers chain for 3–5 representative universities
- Identify cities missing or misassigned; providers missing per city; provider records missing critical pre-flight data
- Identify highest-leverage automation opportunity (LinkedIn, Apollo, Yelp, GBP API)

**3. Bug triage from Grazy/Esther's findings.**
- Pull their findings list daily. Fix what blocks operation. Defer what doesn't.

**4. Read this brief's appendix before touching code.**
- Discipline rules (G1–G10) and deferred items (D1–D25) explain what NOT to invent
- Conversion routing map prevents re-introducing the mark_partner-on-provider bug

**5. Maintain the shipping cadence.**
- Small commits, one concept per commit, typecheck before pushing
- The recent 30-commit pass was readable and revertable because of this discipline; don't break it

### 11.3. For product and design thinking

Active guardrails:
- No new backend enum values without explicit approval
- No new actions in `route.ts` without explicit approval
- UI-level union extensions to `MeetingStatus` / `ReplyClassification` are acceptable IF they dispatch to existing actions
- Every new Log outcome must produce visible progression
- Every new Log surface must use `LogModalShell` + `StatusCard` / `ChoiceCard`
- Defer over add: if an outcome doesn't produce distinct downstream behavior, it's choice friction

Anti-patterns to watch:
- New options overlapping with existing ones
- New labels diverging from canonical glossary
- Aspirational outcomes with no current downstream behavior
- Modal hops to complete a single operational moment

### 11.4. For operational management

Throughput health checks during the 2-week window:
- Sites added? Provider Prospects materialized? Outreach campaigns launched?
- Total Logs across Calls / Replies / Meetings?
- Conversions (Client, Partner)?
- Refinement findings produced by Grazy + Esther?
- Bugs fixed by TJ?

Strategic health checks:
- Is email deliverability holding?
- Are catchments correct for the seeded universities?
- Are admins operating without working around the system?
- Are conversion paths firing the right downstream effects (Partner Prospects unlocking, seasonal emails queuing)?

Decision points likely to surface:
- Whether to start fax / snail mail before email hygiene is complete (recommendation: don't)
- Whether Calendly webhook is worth pulling forward (recommendation: only if manual logging becomes a real friction point)
- Whether to expand to additional universities before catchment correctness is verified (recommendation: don't expand until the seed 3–5 are operating cleanly)

---

## Appendix A — Discipline Rules (G1–G10)

Hard constraints. If a change appears to violate any of these, stop and surface for review.

| # | Rule |
|--|--|
| **G1** | No new enum values for `Status`, `Stage`, `RepliesState`, `MeetingStatus`, `TouchpointType`, or outcome enums. UI-level extensions to `MeetingStatus` / `ReplyClassification` are tolerated when they dispatch to existing actions. |
| **G2** | No new actions in `route.ts`. Reuse `log_call_outcome`, `make_client`, `mark_partner`, `mark_not_interested`, `mark_dnc`, `mark_no_response_closed`, etc. |
| **G3** | No new tables, no migrations. |
| **G4** | Single-writer discipline: all mutations through `route.ts` action handlers. |
| **G5** | Every state-changing action emits at least one existing touchpoint. |
| **G6** | Each phase / feature = one commit, independently revertable. |
| **G7** | If a new noun, enum value, action, or table feels tempting → stop, surface, do not add silently. |
| **G8** | Verify-before-phase: read named files before edits. |
| **G9** | Drawer body (`ProviderProspectDrawerBody.tsx`) untouched in feature work; only NextStepCard subcomponents. |
| **G10** | `LogCallOutcomeModal`, `ReplyClassifierModal`, `LogMeetingModal`, `planSequence()` body unchanged except for approved scope. |

## Appendix B — Deferred Items Registry (D1–D25)

Tracked deferrals. Each has a defer reason; revisit when reason is no longer valid.

| ID | Item | Defer reason |
|--|--|--|
| D1 | Calendly webhook ingestion | Manual LogMeetingModal sufficient for MVP |
| D2 | Inbound email parsing / auto-classification | Admin classifies manually |
| D3 | Sequence templating beyond current cadence | Out of MVP |
| D4 | Smart prioritization, SLA escalation, assignment routing | Out of MVP |
| D5 | Anti-duplication enforcement (hard rules) | Preserves flexibility |
| D6 | General → Specific contact upgrade rules | Both coexist by design |
| D7 | Required notes everywhere | Optional unless downstream demands it |
| D8 | Drawer body changes for pre-flight outcome surface | Modal-only suffices |
| D9 | `task_cancelled` active suppression of pre-existing Day 0 tasks | Resolved — no tasks exist pre-launch |
| D10 | Front-desk vs voicemail UI distinction | Folded into one outcome + notes |
| D11 | Stale-driven automation | Visual badge only |
| D12 | Auto-classification of inbound reply | Manual only |
| D13 | Notification surface for auto-revive event | Future |
| D14 | Auto-revive from terminal statuses other than no_response_closed | Manual reopen only |
| D15 | Conversion via portal/Stripe webhooks | Portal/Stripe work, not CRM |
| D16 | New conversion vocabulary in CRM | Reacts to existing metadata flags |
| D17 | Post-meeting `InOutreachBody` distinction | Structural; future iteration |
| D18 | Fax outreach send infrastructure | Pre-flight collects fax; no send |
| D19 | Snail mail outreach send infrastructure | Pre-flight collects address; no send |
| D20 | LinkedIn / IG DM / Facebook outreach UI | TouchpointType supports DMs; no UI |
| D21 | Quarterly client check-in automation | Future |
| D22 | Tab-bar count pulse (matching sidebar) | Marginal value |
| D23 | Care Shifts direct-family hire flow | Separate primitive |
| D24 | Agency-uploaded caregiver pool | Future |
| D25 | Multi-domain email rotation / warmup automation | **Highest-priority future build** |

## Appendix C — Critical Files Reference

| Concern | File |
|--|--|
| Stage derivation | `lib/medjobs/stage.ts` |
| RepliesState derivation | `lib/student-outreach/state-derivation.ts` |
| Action dispatcher | `app/api/admin/student-outreach/[id]/route.ts` |
| Touchpoint narration | `lib/student-outreach/narration.ts` |
| Log success messages | `lib/student-outreach/log-success-messages.ts` |
| NextStepCard (drawer keystone) | `components/admin/medjobs/NextStepCard.tsx` |
| Pre-flight modal | `components/admin/medjobs/CallForEmailModal.tsx` |
| Call Log modal | `app/admin/student-outreach/LogCallOutcomeModal.tsx` |
| Reply Log modal | `app/admin/student-outreach/ReplyClassifierModal.tsx` |
| Meeting Log modal | `app/admin/student-outreach/LogMeetingModal.tsx` |
| Shared modal shell | `components/admin/medjobs/LogModalShell.tsx` |
| Toast layer | `components/admin/Toast.tsx` |
| RecentMoves layer | `components/admin/RecentMoves.tsx` |
| Tab page (queue surfaces) | `components/admin/medjobs/MedJobsTabPage.tsx` |
| Entity list page | `components/admin/medjobs/MedJobsEntityListPage.tsx` |
| Cadence templates | `lib/student-outreach/templates.ts` |
| Sequencer (task planning) | `lib/student-outreach/sequencer.ts` |
| Partner-Prospect gate | `lib/medjobs/partner-prospect-gate.ts` |
| Sidebar | `components/admin/AdminSidebar.tsx` |
| Logs page | `app/admin/medjobs/logs/page.tsx` |
| OutreachTimeline | `components/admin/medjobs/OutreachTimeline.tsx` |
| Sites page | `app/admin/medjobs/sites/page.tsx` |
| Add Site modal | `components/admin/medjobs/AddSiteModal.tsx` |
| Campus creation API | `app/api/admin/student-outreach/campuses/route.ts` |
| Virtual prospects API | `app/api/admin/medjobs/provider-prospects/route.ts` |
| Materialize endpoint | `app/api/admin/medjobs/provider-prospects/materialize/route.ts` |
| Queue / tab membership | `app/api/admin/student-outreach/queue/route.ts` |
| Sidebar counts | `app/api/admin/medjobs/sidebar-counts/route.ts` |

## Appendix D — Open Architectural Decisions / Unverified Assumptions

- **Touchpoint timestamp ordering for P6** — `meeting_no_show` is emitted before `note_added{reason:meeting_in_flight}`. State-derivation DESC scan should pick the latter and keep `meeting_state = in_flight`. Microsecond-precision timestamps from Postgres `now()` should guarantee ordering, but if two inserts hash to the same `created_at`, behavior is undefined. Hasn't manifested in practice.
- **Sites flow at scale** — virtual-prospect pattern works for 200-row caps. At maturity scale (20,000+ providers per Site), the on-demand computation will hit the cap and require pagination or filtering. Not yet hit; not yet needed.
- **`convert_to_partner` evidence panel flow** — admin picks partner outcome; modal expands inline with PartnerEvidencePanel; on submit, parent dispatches `log_call` THEN `mark_partner` with evidence. If the second dispatch fails, the row has the call logged but isn't converted. Idempotency / retry not built.

## Appendix E — Hotfix Log (recent pass)

| Commit | Issue | Fix |
|--|--|--|
| `f3360c2` | `log_call_outcome` 400 alias | FE dispatchers used `log_call_outcome` action name; `route.ts` only registered `log_call`. Aliased both case labels to the same handler. |
| `81ef500` | CallDueBody no Reply affordance | When a row appears in Replies tab but `deriveStage` returns `call_due` (because pending calls outrank `in_outreach` in priority), the drawer was call-only. Added secondary "Log reply" button in `CallDueBody`. |

Both shipped to main at `5702be6`.

## Appendix F — Vocabulary Glossary (Canonical Labels)

| Concept | Canonical label | Used by |
|--|--|--|
| Phone unanswered | "No answer" | Call, Pre-flight |
| Left voicemail/message | "Voicemail / message left" | Call, Pre-flight |
| Wrong number | "Wrong number" | Call, Pre-flight |
| Reached non-DM | "Reached someone" | Pre-flight only |
| Reached DM, engaged | "Interested" | Call, Pre-flight engagement |
| Promised callback | "Promised to call back" | Call, Pre-flight engagement |
| Provider committed | "Became a Client ✓" | Call, Pre-flight, Reply, Meeting |
| Stakeholder committed | "Mark as Partner ★" | Call, Reply, Meeting |
| Want meeting | "They want to meet" | Reply |
| Meeting confirmed | "On the calendar" / "Meeting is booked" | Meeting / Reply |
| Meeting in flight | "Still finding a time" | Meeting |
| Meeting held, follow-up | "Done — needs more email" | Meeting |
| Meeting held, decline | "Not a fit" | Meeting |
| No-show / reschedule | "No-show / cancelled — rescheduling" | Meeting |
| Provider redirects | "Redirected to another contact" | Reply |
| Provider declines | "Not interested" | Call, Reply, Pre-flight |
| Admin: DNC | "Stop communications" | Call |
| Admin: archive | "Archive — no response" | Call |

---

**End of document.**

For the human-readable executive summary, see `docs/medjobs/EXECUTIVE_SUMMARY.md`.
For questions during Logan's absence, surface findings via the daily bug list and continue iterating.

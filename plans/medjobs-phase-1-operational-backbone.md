# Phase 1 — Admin Operational Backbone

Status: **DETAILED PLAN — awaiting Logan scope-level approval before build**
Branch: `medjobs/phase-1-operational-backbone` (created off `staging` once Phase 0 stabilization clears + Logan approves this scope)
Owner: Claude (build) + Logan (scope approval + end-of-phase QA)
Created: 2026-06-04

## Goal

Ship the admin-facing CRM workflow redesigns + the underlying engagement-tracking + the new cadence + Calendly integration. **No provider-facing changes** in this phase. The admin team gets a cleaner, more useful daily surface; the system starts capturing Smartlead open/click events; Calendly self-bookings flow in automatically.

Phase 1 ships independently to prod — no coupling with later phases. The new email copy + magic-link CTA come in Phase 2+3.

## Coupling

- Independent of Phases 2-7 — Phase 1 ships standalone to staging then prod
- Calendly webhook in this phase wires Dr. DuBose's existing Calendly bookings into Meetings tab. No magic-link needed.
- New cadence (Day 0 email only, Day 3 email + call, etc.) runs with the EXISTING old email copy. The copy update is Phase 2.

## The 12 bullets, ordered by build sequence

The order below groups by dependency + risk:

| # | Bullet | Days | Depends on |
|---|--------|------|------------|
| 1 | Strategy depth pass for tabs (no code) | 3 | nothing |
| 2 | New post-launch cadence | 1 | nothing |
| 3 | Smartlead webhook expansion (open + click) | 2 | nothing |
| 4 | In Basket tab rename + smart-hide | 1 | nothing |
| 5 | Timeline split (Upcoming + Past Activity) | 3 | 3 (engagement events to render) |
| 6 | Next Step branches per post-launch stage | 3 | 3 (engagement-driven sub-states) |
| 7 | Calls tab redesign | 4 | 1, 6 |
| 8 | Emails tab redesign | 4 | 1, 3 |
| 9 | Smartlead-inbox deep-link | 1 | 8 |
| 10 | Meetings tab redesign | 3 | 1 |
| 11 | New LogMeetingModal outcome | 1 | 10 |
| 12 | Calendly webhook + matching | 5 | 10, 11 |

**Total: ~31 days at 1 dev (~6 weeks).** Calendly webhook is the longest single bullet (5 days for the full handler set).

This is bigger than my earlier 4-week estimate because the strategy depth pass + the tab redesigns are more substantial than I scoped originally. The reality is that we're rewriting three of the four main admin tabs simultaneously.

## Bullet-by-bullet detail

---

### Bullet 1 — Strategy depth pass for tabs (no code, 3 days)

**Why this exists:** the master plan flagged that Calls/Emails/Meetings/Next Step/Timeline are at "sketch depth" not "ticket-cuttable depth." Building from sketches risks 3 days of mid-build rework. 3 days of strategy upfront beats that.

**Scope:**
- Pass A (1 day): Calls tab + Emails tab depth specs
- Pass B (1 day): Meetings tab + Calendly depth spec
- Pass C (1 day): Next Step per-stage branches + Timeline split details

**Deliverables:**
- Per-tab component specs (state, props, layout, sections)
- Per-row UX wireframes (Calls today row, Emails event-stream row, Meetings card)
- Calendly webhook event handler signatures (created / canceled / rescheduled)
- Post-meeting sub-state model (asked-for-time / needs-followup-email / needs-followup-call / pre-pilot-active)
- Next Step content table for all 8 stages + engagement-driven sub-states
- Smartlead-inbox deep-link mechanic decision (master inbox vs per-mailbox)

**Output location:** updates this Phase 1 plan in place — each subsequent bullet section gets filled out with the deepened spec. Strategy work is captured in the source plan, not a separate artifact.

**Acceptance criteria:**
- Every bullet below (2-12) has acceptance criteria locked
- Component-level UX decisions made for Calls / Emails / Meetings tabs
- Logan reviews the deepened spec at end of Pass C; if approved, build starts immediately

#### Pass A — Calls + Emails locked decisions (2026-06-04)

After surveying the existing bullets 5-9, most spec depth is already in place. Pass A locks the remaining open UX decisions:

**A1. Smartlead-inbox deep-link URL (Bullet 9):**
Verified against `lib/smartlead.ts` (API base `server.smartlead.ai/api/v1`) and `lib/medjobs/smartlead-bridge.ts` (references to "Master Inbox"). The CRM admin UI deep-links into the WEB UI at `app.smartlead.ai`:

```
https://app.smartlead.ai/app/master-inbox?lead_id=<lead_id>&campaign_id=<campaign_id>
```

Lead ID + campaign ID come from `outreach.research_data.smartlead` linkage written at enrollment time. Fallback (legacy rows without linkage): `https://app.smartlead.ai/app/master-inbox` (root — admin manually finds thread).

**Build note:** verify the URL format actually deep-links on Smartlead's current UI by manually testing one before the Emails tab build closes. If Smartlead's URL convention has changed, update the constant and fallback gracefully.

**A2. Activity log pagination (Bullet 8):**
- 50 events per page (default)
- "Load more" button at bottom; appends next 50
- Filter chip state resets pagination to page 1
- No infinite scroll — explicit "Load more" so admin doesn't accidentally trigger heavy renders

**A3. Calls tab priority sort (Bullet 7):**

```
clicked-not-activated rows FIRST (engagement-driven priority bump)
  ↓
within that group: by due_at ASC
  ↓
non-clicked rows: by due_at ASC, then created_at ASC (existing default)
```

`hasClickedNoActivation` predicate (lib code):
```ts
function hasClickedNoActivation(outreach: Outreach): boolean {
  if (outreach.status === "active_partner") return false  // already Pilot Active
  const latestEmailSent = outreach.touchpoints
    .filter(t => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  if (!latestEmailSent) return false
  return (latestEmailSent.payload?.click_count ?? 0) > 0
}
```

Visual marker on bumped rows: small 🖱 + "clicked" pill (matches existing pill styling from connections tracker).

**A4. Emails tab default filter set (Bullet 8):**
- Shown by default: Sends + Clicks + Replies + Bounces
- Hidden by default: Opens (low signal, high volume)
- Filter chips: [Sent] [Opened] [Clicked] [Replied] [Bounced] [All]
- "All" = override to show every event regardless of filter state
- Filter state persists in URL query params (`?filter=clicks,replies`) so admin's view survives reload

**A5. "Needs Reply" detection predicate (Bullet 8):**
A row is "Needs Reply" when:
- Latest touchpoint on the outreach is `email_replied` AND
- No subsequent admin action: no later `email_sent` (admin reply), no `note_added(reason: "marked_handled")`, no stage-change to closed status

Implementation: SQL predicate on the outreach query, not a stored field. Renders dynamically.

**A6. "Bounced" detection predicate (Bullet 8):**
A row is "Bounced (needs fix)" when:
- Latest touchpoint type is `email_bounced` AND
- No subsequent `email_sent` (admin hasn't re-launched after fixing the email)

Same approach: SQL predicate, not stored.

#### Pass B — Meetings + Calendly locked decisions (2026-06-04)

**B1. Calendly webhook signature verification (Bullet 12):**
Calendly uses HMAC-SHA256 signatures with a shared secret. Format per Calendly docs:

```
Header: Calendly-Webhook-Signature: t=<timestamp>,v1=<signature>
where signature = HMAC-SHA256(secret, timestamp + "." + raw_body)
```

Verification logic in webhook handler (Supabase edge function): split header, compute HMAC with `CALENDLY_WEBHOOK_SECRET` env var, compare via constant-time equality. Reject 401 if signature invalid OR timestamp >5min old (replay protection).

**B2. Post-meeting sub-state model (Bullet 10):**
Existing `LogMeetingModal` outcomes are the truth source for sub-states. Mapping to Meetings tab sections:

| Modal outcome | replies_state | meeting_state | Meetings tab section |
|---------------|---------------|---------------|----------------------|
| `booked` | — | `scheduled` | Upcoming |
| `finding_time` | `engaged` | `in_flight` | (drops off Meetings — shows in Replies until booked) |
| `no_show` | — | `in_flight` | No-shows |
| `done_followup` | `needs_followup` | — | Needs Follow-up |
| `done_partner` (stakeholder) | — | — | Converted (drops off Meetings) |
| `done_client` (provider) | — | — | Converted (drops off Meetings) |
| `not_a_fit` | — | — | Closed (drops off Meetings) |
| **NEW: `activate_pilot`** (Bullet 11) | — | — | Converted (drops off Meetings, Pilot Active) |

Sub-state nuance Logan mentioned ("asked for time to think" / "needs follow-up email" / "needs follow-up call") is captured as **free-text in the existing `notes` field** on `done_followup` outcomes. The Meetings tab's "Needs Follow-up" section reads the latest note preview. No new state values; the notes text is the differentiator. This avoids over-engineering the state model + new enum values (G5 discipline).

**B3. Calendly reschedule event handling (Bullet 12):**
Calendly emits `invitee.canceled` (old time) + `invitee.created` (new time) for reschedules — verified against their API docs. Handler logic:
- On `invitee.canceled`: match outreach row → if currently has `meeting_state = "scheduled"` AND matching `calendly_event_uri`, emit `note_added(reason: "calendly_reschedule_pending")`. Do NOT immediately clear meeting_state — wait for the paired created event.
- On `invitee.created` arriving within 60 seconds of a pending reschedule for the same outreach: treat as reschedule completion → update `meeting_at` to new time, emit `note_added(reason: "calendly_reschedule_completed")`, clear pending state.
- On `invitee.created` with no pending reschedule: new booking (standard flow).
- On `invitee.canceled` with no paired creation within 60s: actual cancellation → `mark_meeting_canceled` action.

**B4. Unmatched bookings tray ergonomics (Bullet 10):**
- Renders at top of Meetings tab when `calendly_unmatched_bookings.resolved_at IS NULL` rows exist
- Per-row: invitee name + email + meeting time + age ("booked 2 hours ago")
- "Match to outreach" button → opens a modal with search field (search by org name / email / phone) → admin picks the right outreach row → backend dispatches `mark_meeting_scheduled` retroactively + sets `resolved_at + resolved_outreach_id`

#### Pass C — Next Step + Timeline locked decisions (2026-06-04)

**C1. Engagement-driven sub-state predicates (Bullet 6):**

```ts
function getEngagementSubState(outreach: Outreach): "no_engagement" | "opened_not_clicked" | "clicked_not_activated" | null {
  if (outreach.status === "active_partner") return null  // already Pilot Active — no engagement sub-state
  if (outreach.status !== "engaged" && outreach.status !== "outreach_sent") return null  // only applies mid-cadence

  const latestEmailSent = outreach.touchpoints
    .filter(t => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  if (!latestEmailSent) return "no_engagement"

  const clickCount = latestEmailSent.payload?.click_count ?? 0
  const openCount = latestEmailSent.payload?.open_count ?? 0

  if (clickCount > 0) return "clicked_not_activated"
  if (openCount > 0) return "opened_not_clicked"
  return "no_engagement"
}
```

Used by NextStepCard (Bullet 6) AND Calls tab priority sort (Bullet 7) AND Emails tab activity log filters (Bullet 8) — single source of truth.

**C2. Timeline collapse threshold (Bullet 5):**
- If past activity has ≤5 events total: show all
- If past activity has >5 events: default to last 3 + "Show all past activity (X earlier events)" button
- Upcoming section always fully expanded (typically <5 items)

**C3. Engagement chip rendering on email_sent rows (Bullet 5):**

```
📧 Day 0 email sent (Mon · 2 days ago)
   👁 3 opens · last Tue 4pm
   🖱 1 click · "Review Texas A&M student caregivers"
```

Chip rules:
- `👁 N opens` rendered if `open_count > 0`; "last {relative}" appended if `open_count > 1`
- `🖱 N clicks` rendered if `click_count > 0`; CTA label from `clicked_ctas[0]` (most recent click target)
- If both 0: no chip line at all (just the bare email_sent row)
- Multiple clicked CTAs (rare): show count "🖱 3 clicks · welcome page +2 others"

**C4. Next Step body copy (Bullet 6):**
Locked content table:

| Stage / sub-state | Headline | Sub-line | Primary action |
|-------------------|----------|----------|----------------|
| prospect (existing) | "Pre-Flight in progress" | "Complete the Research Card below" | (none — handled in Research Card) |
| in_outreach + no_engagement | "Awaiting reply or click" | "Next email: Day {X} on {date}. Next call: {date}." | Log reply (secondary) |
| in_outreach + opened_not_clicked | "They opened — give them time" | "Opened {N}× since {date}. No click yet." | Log call (when due, secondary) |
| in_outreach + clicked_not_activated | "**They clicked — call them**" (highlight) | "Visited the welcome page {date}. Haven't activated yet." | "Schedule call now" (primary, jumps priority) |
| call_due (existing) | (unchanged from current) | | |
| meeting_set (existing) | (unchanged) | | |
| follow_up (existing) | (unchanged) | | |
| bounce_fix (existing) | (unchanged) | | |
| converted + Pilot Active | "Pilot Active 🎉" | "Activated {date}. Last candidate viewed: {date}." | "Schedule check-in" (secondary; for Phase 6 dormancy bullet) |
| closed (existing) | (unchanged) | | |

**C5. "Schedule call now" action (Bullet 6):**
On clicked-not-activated state, primary action button "Schedule call now" creates a manual `outreach_followup_call` task due TODAY (not the next cadence day). Task payload: `{reason: "engagement_click_response", manual: true}`. Surfaces immediately in the Calls tab Today section.

---

### Strategy depth pass — outcome

All open UX decisions across bullets 5-12 are now locked. The existing bullet sections below carry the operational spec; Pass A/B/C added the per-decision detail.

**No changes needed** to bullets 2-4 (cadence, Smartlead webhook expansion, tab rename) — they were already at ticket-cuttable depth.

**Build can begin.** Bullet ordering (week 1 → week 6) stands.

---

### Bullet 2 — New post-launch cadence (1 day)

**File:** `lib/student-outreach/cadence.ts`

**Scope:** Change provider cadence definition:

```ts
// BEFORE (current)
provider: [
  { day: 0, steps: [intro email + paired call] },
  { day: 1, steps: [phone] },
  { day: 3, steps: [light email] },
  { day: 5, steps: [phone] },
  { day: 7, steps: [final email] },
]

// AFTER
provider: [
  { day: 0, steps: [intro email] },         // no paired call
  { day: 3, steps: [light email, phone] },  // call moves here
  { day: 5, steps: [phone] },                // unchanged
  { day: 7, steps: [final email] },          // unchanged
  // Day 1 deleted entirely
]
```

**Why:** the Day 0 paired call's role (verify contacts before sending) already moved into Pre-Flight in the v9.x work. The Day 1 call is too aggressive given the email just went out the day before.

**Related changes:** no narration changes needed — the existing per-step narration still applies.

**Acceptance criteria:**
- Unit test: provider cadence emits exactly 3 emails + 2 calls
- No Day 0 phone step; no Day 1 day at all
- Day 3 has both email + phone steps
- Day 5 has phone only; Day 7 has email only

**Test plan:**
- Run existing cadence tests; update fixture expectations to match new sequence
- Manual: trigger `schedule_sequence` on a fixture provider row; verify task queue matches new cadence

---

### Bullet 3 — Smartlead webhook expansion (open + click) (2 days)

**File:** `supabase/functions/smartlead-webhook/index.ts`

**Scope:** Add two new event handlers that UPDATE the existing `email_sent` touchpoint's payload (G1-compliant: no new touchpoint types). Plus complaint/unsubscribe handling.

**Event handlers:**

```ts
// New: email_open event
{
  email_open: async (event) => {
    // Find email_sent touchpoint by smartlead message id
    // UPDATE payload:
    //   open_count: (existing || 0) + 1
    //   last_opened_at: event.timestamp
    //   first_opened_at: payload.first_opened_at || event.timestamp
  },

  // New: email_link_click event
  email_link_click: async (event) => {
    // Find email_sent touchpoint
    // UPDATE payload:
    //   click_count: (existing || 0) + 1
    //   last_clicked_at: event.timestamp
    //   clicked_ctas: append event.link_url (deduplicated)
  },

  // Existing handlers stay:
  email_reply, email_bounce (already in place)
}
```

**Smartlead message ID → touchpoint resolution:** the existing `email_sent` touchpoint already carries `payload.smartlead_message_id` (or equivalent — verify exact field name from spec). Lookup by that ID. If no match → log warning, skip silently.

**Acceptance criteria:**
- Simulated `email_open` webhook updates the right touchpoint's payload with `open_count` + `last_opened_at` + `first_opened_at`
- Simulated `email_link_click` webhook updates with `click_count` + `last_clicked_at` + `clicked_ctas` array
- Duplicate events idempotent (multiple opens increment count correctly)
- Unknown smartlead_message_id logged + skipped (no failure)
- Signature verification still works (existing logic unchanged)

**Test plan:**
- Local webhook test via Supabase edge function CLI: POST simulated events; assert touchpoint payload updates
- Validate against actual Smartlead event payload shapes (read `lib/smartlead.ts` types + spec)

**Phase 0 dependency:** Phase 0 must register `email_open` + `email_link_click` events in Smartlead admin before this code is deployed. Verify before merging.

---

### Bullet 4 — In Basket tab rename + smart-hide (1 day)

**Files:**
- `lib/student-outreach/tab-config.ts`
- `components/admin/medjobs/MedJobsTabPage.tsx` (if it reads tab-config directly)

**Scope:** Two specific changes to `MEDJOBS_TABS` array:
1. **Rename `replies` → `emails`**: change the `key` and `label` on the tab definition. Tooltip updates: "Email activity — replies, opens, clicks, bounces. Triage and pick the next step."
2. **Smart-hide from horizontal tab row**: move `clients`, `partners`, `candidates` out of `MEDJOBS_TABS` (the primary row) and into `MENU_TABS` (the ⋯ overflow menu)

**Final primary horizontal tab set:** Prospects · Calls · Emails · Meetings (+ Sites still moves to sidebar per existing convention)

**Backward compatibility:**
- TabKey union retains `replies` for any historical call-site safety
- The TabKey union retains `clients | partners | candidates` for the queue endpoint
- Deep links `?tab=clients` still resolve via the menu-tabs render path

**Acceptance criteria:**
- In Basket renders exactly 4 horizontal tabs (Prospects / Calls / Emails / Meetings)
- ⋯ menu shows Clients / Partners / Candidates / Archive / All / etc.
- `?tab=replies` deep-link routes to the Emails tab cleanly (alias)
- Existing badge counts continue to work

**Test plan:**
- Manual: visit `/admin/medjobs`; confirm tab row shows the 4 primary; click ⋯ for the secondary
- Test deep links: `?tab=clients`, `?tab=replies`, `?tab=emails`
- Smart-hide rule (existing): tabs with zero count still don't show (unchanged behavior)

---

### Bullet 5 — Timeline split (Upcoming + Past Activity) (3 days)

**File:** `components/admin/medjobs/OutreachTimeline.tsx`

**Scope:** Restructure the single chronological stream into two sections.

**Upcoming section:**
- Source: `ctx.pending_tasks` (filter to outreach_email_send + outreach_followup_call + manual_followup + meeting tasks)
- Sort: by `due_at` ascending
- Render: each task as a thin row with icon (⌚ for email, 📞 for call, 📅 for meeting), day-relative date ("Tomorrow", "Fri", "Mon"), and task-type label

**Past Activity section:**
- Source: `ctx.touchpoints` sorted by `created_at` descending
- Render: existing per-type narration logic via `narrateTouchpoint`
- **Engagement chip grouping** (the load-bearing detail): `email_opened` and `email_clicked` payload-update events DO NOT become separate timeline rows. Instead, the corresponding `email_sent` row renders engagement chips inline: `📧 Day 0 email sent (Mon) · 👁 3 opens · 🖱 1 click (CTA: welcome page)`
- Engagement chips read from the `email_sent` payload (open_count, click_count, clicked_ctas)

**Collapse behavior on long timelines:**
- Default-show: Upcoming (always) + last 3 past events
- "Show all past activity" button at bottom of Past section if `touchpoints.length > 3`

**Acceptance criteria:**
- A row mid-outreach renders: Upcoming section (next email + next call) + Past section (Day 0 email_sent row with engagement chips for open/click events)
- Engagement events DO NOT create separate timeline rows
- Long timeline (10+ touchpoints) collapses to last 3 by default; "Show all" expands
- Empty timeline (prospect stage) renders cleanly

**Test plan:**
- Manual: walk a fixture outreach row through stages; verify both sections update correctly
- Edge case: row with engagement events but no opens → no `👁` chip rendered; only `🖱` if clicks
- Edge case: row with 0 touchpoints + 3 pending tasks → only Upcoming section shows

**UX wireframe (illustrative):**

```
┌─── Upcoming ─────────────────────────────────┐
│  ⌚ Tomorrow · Day 3 email                    │
│  📞 Fri · Day 3 call                          │
│  ⌚ Mon · Day 5 call                          │
└──────────────────────────────────────────────┘

┌─── Past Activity ────────────────────────────┐
│  📞 Logged · Day 3 call · voicemail (Thu)    │
│  📧 Day 0 email sent (Mon)                   │
│       👁 3 opens · last Tue                   │
│       🖱 1 click · "Review {campus} students"│
│  ⊕ Show all past activity                     │
└──────────────────────────────────────────────┘
```

---

### Bullet 6 — Next Step branches per post-launch stage (3 days)

**File:** `components/admin/medjobs/NextStepCard.tsx`

**Scope:** Add explicit branches for engagement-driven sub-states. Today's `NextStepCard` has 8 stage branches; sub-states within `in_outreach` are not distinguished. Need:

| Sub-state | Headline | Sub-line | Primary action |
|-----------|----------|----------|----------------|
| in_outreach (no engagement) | "Awaiting click or reply" | "Next email: Day {X} on {date}. Next call: {date}." | Log reply (secondary) |
| in_outreach + opened-not-clicked | "They opened — give them time" | "Opened {N}× since {date}. No click yet." | Log call (when due) |
| in_outreach + clicked-not-activated | "**They clicked — call them**" (highlight) | "Visited the welcome page {date}. Haven't activated yet." | Schedule call now (primary action; bumps priority) |
| call_due | (unchanged) | | |
| meeting_set | (unchanged) | | |
| converted (Pilot Active) | "Pilot Active 🎉" | "Activated {date}. Last candidate viewed: {date}." | Schedule check-in (secondary) |

**Logic:** read engagement signals from the most recent `email_sent` touchpoint's payload:
- `payload.click_count > 0` and outreach.status != 'active_partner' → "clicked-not-activated"
- `payload.open_count > 0` and `payload.click_count == 0` → "opened-not-clicked"
- Otherwise (no engagement) → existing in_outreach body

**The "clicked-not-activated" highlight visual:** matches the urgency-marker pattern from existing `call_due` stage (blue pill + bold).

**Acceptance criteria:**
- A row with click but no terms-acceptance renders the "clicked-not-activated" body with visually distinct (bold/colored) treatment
- Row that's opened but not clicked renders the calmer "give them time" copy
- Row with no engagement renders the existing in_outreach body
- Row that's Pilot Active renders the celebratory "Pilot Active 🎉" header

**Test plan:**
- Fixture row → manually set `email_sent.payload.click_count = 1` → confirm NextStepCard renders "clicked — call them"
- Set `click_count = 0`, `open_count = 5` → renders "opened — give them time"
- Set `outreach.status = active_partner` → renders "Pilot Active 🎉"

---

### Bullet 7 — Calls tab redesign (4 days)

**File:** `components/admin/medjobs/cards/ProspectCard.tsx` (or wherever calls render) + `app/admin/student-outreach/page.tsx` (Calls tab data fetch)

**Scope:** Two sections + per-row component upgrade.

**Today's Calls section:**
- Source: `pending_tasks` where `task_type = 'outreach_followup_call'` AND `due_at <= end_of_today`
- Sort priority: clicked-not-activated rows FIRST, then by `due_at` ASC, then by row created_at
- Per-row component renders:
  - Org name (header) + day label ("Day 3")
  - Phone (tappable `tel:` link) + extension
  - Purpose hint (one line — e.g., "Did you get our email?" for Day 3)
  - Log outcome button (opens existing `LogCallOutcomeModal`)
  - Visual mark on clicked rows (small 🖱 + "clicked" pill)

**Upcoming section:**
- Source: same task type, `due_at > end_of_today`
- Grouped by day ("Tomorrow", "Fri", "Mon", "Tue", etc.)
- Each day shows count + a "show all upcoming" affordance
- Defaults to next 7 days; "Show more" extends

**Engagement priority bumping logic:**

```ts
const todayRows = pendingCalls
  .filter(t => t.due_at <= endOfToday)
  .sort((a, b) => {
    const aClicked = hasClickedNoActivation(a.outreach)
    const bClicked = hasClickedNoActivation(b.outreach)
    if (aClicked && !bClicked) return -1
    if (bClicked && !aClicked) return 1
    return a.due_at.localeCompare(b.due_at)
  })
```

`hasClickedNoActivation` reads from the latest `email_sent` payload — same logic as Bullet 6.

**Per-row purpose hint by cadence day:**
- Day 3 — "Did you get our email Monday?"
- Day 5 — "Anything I can help with? Or want me to set up a quick call with Dr. DuBose?"
- Day 7 — "Last touch — better person at {org} to reach about caregiver hiring?"

**Acceptance criteria:**
- Today's Calls section shows all calls due today; clicked rows appear at the top with 🖱 marker
- Tap phone link opens device dialer
- Click "Log outcome" opens existing `LogCallOutcomeModal` correctly
- Upcoming section grouped by day; collapsed to next 7 days with "Show more" affordance
- Empty state: "No calls due today. Next call: {date} ({org})."

**Test plan:**
- Manual: fixture row with clicked email + Day 3 call → confirm row at top of Today with 🖱
- Edge: 20 calls due today → list paginates or virtualizes cleanly
- Edge: no calls due today → empty state shows correctly

---

### Bullet 8 — Emails tab redesign (4 days)

**Files:**
- `lib/student-outreach/tab-config.ts` (renamed in bullet 4)
- `components/admin/medjobs/cards/EmailEventCard.tsx` (new — per-event row)
- `app/admin/student-outreach/page.tsx` (Emails tab data fetch)
- `lib/student-outreach/email-event-stream.ts` (new — unified event source)

**Scope:** Single continuous event stream with smart-pinned high-priority sections.

**Top: Pinned "Needs Reply" section**
- Source: outreach rows in status `engaged` with sub-state `awaiting_admin_reply` (derived predicate)
- Concretely: rows where the LAST touchpoint is an `email_replied` AND no admin action has been logged since
- Per-row component renders org name + reply preview snippet + "Reply via Smartlead inbox →" deep-link button
- Always visible; pin to top regardless of count

**Top: Pinned "Bounced" section**
- Source: outreach rows where last `email_bounced` touchpoint hasn't been resolved (no subsequent `email_sent` to a different email)
- Per-row: org name + "fix email" affordance opening the drawer at the General Contact email field
- Pin to top regardless of count

**Below pinned: Activity log**
- Source: all email-related touchpoints (`email_sent`, `email_replied`, `email_bounced`) for in-flight outreach rows, sorted by `created_at` DESC
- Filter UI at top: [Sent] [Opened] [Clicked] [Replied] [Bounced] [All]
- Default filter: hide opens (low signal, high volume); show sends + clicks + replies + bounces
- Pagination: 50 per page; "Load more" button

**Per-event-type row UI:**

| Event type | Row content | Action |
|------------|-------------|--------|
| `email_sent` | "📧 Day 0 email to {org} ({date}) · 👁 3 opens · 🖱 1 click" | Open drawer |
| `email_opened` | (DOES NOT render — chip on email_sent) | — |
| `email_clicked` | (DOES NOT render — chip on email_sent) | — |
| `email_replied` | "💬 Reply from {org} ({date}) · preview snippet" | "Reply via Smartlead inbox →" + Open drawer |
| `email_bounced` | "⚠ Bounced — {org} ({date})" | "Fix email" → opens drawer at General Contact |

**Acceptance criteria:**
- Needs Reply section pinned at top; shows all rows needing admin response
- Bounced section pinned; shows all unfixed bounces
- Activity log default-filtered to hide opens
- Filter chips toggle inclusion; "All" shows everything
- Pagination works smoothly past 50 events
- Empty state per section ("No replies waiting" / "No bounces" / "No email activity yet")

**Test plan:**
- Fixture: row with reply → appears in Needs Reply
- Fixture: row with bounce + new email saved + new email_sent → bounce no longer appears (resolved)
- Filter: toggle Opens chip → opens appear; toggle off → opens hidden
- Performance: 500 fixture events; activity log paginates without UI lag

---

### Bullet 9 — Smartlead-inbox deep-link (1 day)

**Files:** integrated into Bullet 8's EmailEventCard component

**Scope:** "Reply via Smartlead inbox →" button on Needs Reply rows + replied event rows. Opens Smartlead master inbox in a new tab at the right thread.

**Deep-link URL format** (verify with Smartlead docs — current best guess):

```
https://app.smartlead.ai/app/master-inbox?lead_id=<lead_id>&campaign_id=<campaign_id>
```

The `lead_id` + `campaign_id` are stored on the outreach row's `research_data.smartlead` linkage (Smartlead bridge writes these at enrollment time).

**Fallback:** if `research_data.smartlead.lead_id` is missing (legacy row pre-Smartlead bridge), button shows "Reply via Smartlead inbox →" linking to the master inbox root with no thread context. Admin manually finds the thread.

**Acceptance criteria:**
- Click button → opens Smartlead master inbox in new tab at the right thread context
- Missing smartlead linkage → button links to master inbox root (graceful fallback)
- Button always rendered as `<a target="_blank" rel="noopener noreferrer">`

**Test plan:**
- Manual: fixture row with smartlead linkage → click button → verify URL contains lead_id and campaign_id
- Manual: legacy fixture row without linkage → button uses fallback URL

---

### Bullet 10 — Meetings tab redesign (3 days)

**Files:**
- `app/admin/student-outreach/page.tsx` (Meetings tab data fetch)
- `components/admin/medjobs/cards/MeetingCard.tsx` (new or rework existing)

**Scope:** Four sections:

**Upcoming meetings:**
- Source: outreach rows with `meeting_state = "scheduled"` AND `meeting_at > now()`
- Per-row: org name + meeting date/time + admin notes preview + "Open thread" button (drawer)

**Needs Follow-up:**
- Source: outreach rows with `meeting_state = "needs_followup"` after a meeting outcome
- Sub-state from the new post-meeting model (Pass B strategy work locks this):
  - "asked for time to think" — meeting happened, provider wants to consider
  - "needs follow-up email" — admin owes a follow-up summary email
  - "needs follow-up call" — admin owes a call
  - "pre-pilot-active" — meeting concluded positively but pilot not yet activated
- Each sub-state has a recommended next action

**No-shows / Reschedule:**
- Source: outreach rows with `meeting_state = "no_show"` OR last touchpoint `meeting_no_show`
- "Reschedule" action opens the rescheduling flow

**Unmatched Calendly bookings tray** (only visible when present):
- Source: Calendly webhook bookings that didn't match any outreach row
- Render: invitee name + email + meeting time + "Match to outreach" button (search-and-link)

**Acceptance criteria:**
- All 4 sections render correctly with section headers + counts
- Upcoming sorted by `meeting_at` ASC
- Needs Follow-up shows the sub-state label per row
- Empty state per section
- Unmatched bookings tray only renders when bookings exist

**Test plan:**
- Fixture: 3 upcoming + 2 follow-up + 1 no-show → all sections render
- Fixture: 0 upcoming → empty state for that section
- Fixture: simulated unmatched Calendly booking → tray appears with the unmatched row

---

### Bullet 11 — New LogMeetingModal outcome (1 day)

**File:** `app/admin/student-outreach/LogMeetingModal.tsx`

**Scope:** Add a new outcome option: **"Activate pilot on their behalf"**

**Behavior:**
- On submit: dispatches existing `make_client` action (which sets `interview_terms_accepted_at` + transitions outreach to `active_partner`)
- ALSO dispatches a new `set_pilot_active_through` action (or extends `make_client` payload) to set `pilot_active_through = now() + 90 days`
- ALSO sets `metadata.terms_accepted_via = "admin"` so the audit trail differentiates from self-serve
- Emits the standard `stage_change` touchpoint + a `note_added(reason: "admin_activated_pilot")` for the audit trail

**Outcome label + description in modal:**

> ☐ **Activate pilot on their behalf**
> The provider verbally agreed during the meeting. Activates Pilot Active for 90 days, sets pilot terms accepted (via admin), and starts the engagement clock.

**Acceptance criteria:**
- New outcome appears in `LogMeetingModal` outcome list
- Selecting it + submitting → all three flags set on `business_profiles.metadata` (interview_terms_accepted_at + pilot_active_through + terms_accepted_via)
- Outreach row transitions to `active_partner` cleanly
- `stage_change` + `note_added` touchpoints both emit

**Test plan:**
- Fixture meeting row → trigger outcome → verify business_profiles.metadata has all three fields set + status = active_partner
- Outreach drawer narration shows "Admin activated pilot on their behalf"
- Connections tracker / Partner Prospects refresh: catchment unlocks correctly

---

### Bullet 12 — Calendly webhook + matching (5 days)

**Files:**
- `supabase/functions/calendly-webhook/index.ts` (new edge function)
- `lib/medjobs/calendly-event-matcher.ts` (new — email → outreach row resolver)

**Scope:** Webhook subscription on Dr. DuBose's personal Calendly account. Handles three events.

**Webhook handler structure:**

```ts
{
  "invitee.created": async (event) => {
    // Provider self-booked
    // Match invitee.email → outreach row (case-insensitive on general_contact.email)
    // If matched: dispatch mark_meeting_scheduled action with meeting_at from event
    // If unmatched: insert into calendly_unmatched_bookings table for tray
  },

  "invitee.canceled": async (event) => {
    // Provider canceled
    // Match invitee.email → outreach row
    // If matched + meeting was scheduled: dispatch new action `mark_meeting_canceled`
    //   → emit note_added(reason: "calendly_cancellation")
    //   → keep outreach status as-is (admin decides next step)
  },

  "invitee.rescheduled": async (event) => {
    // Provider rescheduled (Calendly sends a new "created" + new "canceled" for old)
    // OR Calendly may emit a dedicated rescheduled event — verify their docs
    // Match invitee.email → outreach row
    // Update meeting_at to new time; emit note_added(reason: "calendly_reschedule")
  }
}
```

**Email matching logic:**

```ts
function findOutreachByCalendlyInviteeEmail(email: string) {
  const normalized = email.toLowerCase().trim()

  // Try 1: match against general_contact.email
  let match = await query(
    "SELECT * FROM student_outreach WHERE LOWER(research_data->'general_contact'->>'email') = $1 AND status NOT IN ('not_interested', 'no_response_closed', 'do_not_contact')",
    [normalized]
  )
  if (match.rows.length === 1) return match.rows[0]

  // Try 2: match against decision_maker.email
  match = await query(
    "SELECT * FROM student_outreach WHERE LOWER(research_data->'decision_maker'->>'email') = $1 AND status NOT IN ('not_interested', 'no_response_closed', 'do_not_contact')",
    [normalized]
  )
  if (match.rows.length === 1) return match.rows[0]

  // Try 3: business_profiles.email (legacy / directory)
  match = await query("...", [normalized])
  if (match.rows.length === 1) return match.rows[0]

  return null // unmatched
}
```

**Unmatched bookings table:** new lightweight table for the tray render:

```sql
CREATE TABLE calendly_unmatched_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  meeting_at TIMESTAMPTZ NOT NULL,
  calendly_event_uri TEXT NOT NULL,
  reason TEXT, -- "no_match" | "ambiguous_match"
  resolved_at TIMESTAMPTZ,
  resolved_outreach_id UUID REFERENCES student_outreach(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Admin "Match to outreach" action moves the booking to a matched outreach row (dispatches `mark_meeting_scheduled` retroactively + sets `resolved_at`).

**Webhook security:** Calendly supports signing keys. Use them. Stored in `CALENDLY_WEBHOOK_SECRET` env var. Verify signature before processing.

**Acceptance criteria:**
- Provider books a Calendly slot on Dr. DuBose's personal account → meeting appears in Meetings tab Upcoming section within ~5 seconds
- Provider cancels → meeting moves out of Upcoming + `note_added(reason: "calendly_cancellation")` lands in drawer timeline
- Provider reschedules → meeting time updates correctly
- Unmatched booking (invitee email not in any outreach row) → appears in Unmatched bookings tray
- Admin manually matches → meeting attaches to right outreach row
- Webhook signature verification works

**Test plan:**
- Local: fire simulated Calendly webhook events with known invitee emails → verify match logic + state transitions
- Live integration: book a real test meeting on Dr. DuBose's Calendly with a fixture-row email → verify the round-trip works
- Edge: invitee email matches MULTIPLE outreach rows → fall to unmatched bookings tray with `reason = "ambiguous_match"`
- Edge: invitee email matches zero rows → unmatched bookings with `reason = "no_match"`

**Calendly admin setup** (Phase 0-style precondition; document here even though Phase 0 handles registration):
- Dr. DuBose's personal Calendly admin → Integrations → Webhooks
- Webhook URL: Supabase edge function URL (`https://<project-ref>.supabase.co/functions/v1/calendly-webhook`)
- Events to subscribe: `invitee.created`, `invitee.canceled`, `invitee.rescheduled`
- Signing key generated + stored in `CALENDLY_WEBHOOK_SECRET`

## Build order (the load-bearing detail)

Each bullet is one focused work session. Group into roughly weekly chunks:

**Week 1:** Strategy depth pass (Bullet 1) + cadence change (2) + Smartlead webhook expansion (3) + tab rename (4)
- Foundation week. Lots of small wins.
- End of week: strategy specs locked, engagement events flowing into payloads, tabs renamed

**Week 2:** Timeline split (5) + Next Step branches (6)
- Sets up the UI to USE the engagement signals from week 1
- End of week: drawer shows engagement chips + sub-state branching

**Week 3:** Calls tab redesign (7) + Emails tab redesign (8) + deep-link (9)
- The big admin UX week
- End of week: admin works through Calls + Emails tab redesign on Vercel preview

**Week 4:** Meetings tab redesign (10) + LogMeetingModal outcome (11)
- End of week: Meetings tab fully redesigned, admin-activate-pilot outcome works

**Week 5-6:** Calendly webhook + matching (12)
- Webhook setup + matching logic + unmatched bookings tray
- End: Calendly self-bookings flow into Meetings tab automatically

## Definition of done for Phase 1

All 12 bullets meet their per-bullet acceptance criteria PLUS:

- [ ] All commits on `medjobs/phase-1-operational-backbone` merged
- [ ] Vercel preview matches the spec — Logan QAs each tab redesign + walks 3 fixture rows end-to-end (cold prospect → in_outreach → call_due → meeting_set → converted)
- [ ] No regressions on existing tabs (Sites + ⋯ menu tabs still work)
- [ ] No regressions on existing log modals (LogCallOutcomeModal, ReplyClassifierModal, etc.)
- [ ] Smartlead webhook test event for open + click events updates the right `email_sent` touchpoint payload
- [ ] Calendly test booking on Dr. DuBose's personal account → meeting appears in Meetings tab
- [ ] Cadence test: new schedule_sequence dispatch emits exactly 3 emails + 2 calls
- [ ] Documentation: master plan §3 (SHIPPED) updated to list Phase 1 deliverables
- [ ] Build log section below populated with daily progress notes
- [ ] Known-issues file (`medjobs-known-issues.md`) has any non-blocking findings logged + each has an owner + target resolution

## Build log

### Day 1 — 2026-06-04 (Wed) — Strategy depth pass complete + branch cut

**Done:**
- PR #925 (`merge/medjobs-staging-2026-06-02` → `staging`) merged via `mcp__github__merge_pull_request`. Staging now at `0f61caf57aa55106e2b976953daaec7e7301195e`.
- Phase 1 branch `medjobs/phase-1-operational-backbone` cut off the new staging tip + pushed to origin.
- **Bullet 1 — Strategy depth pass: COMPLETE.** Pass A (Calls + Emails) + Pass B (Meetings + Calendly) + Pass C (Next Step + Timeline) all locked. Pass output captured in Bullet 1 section above. Six open UX decisions resolved: Smartlead deep-link URL format, activity log pagination, Calls priority predicate, Email tab default filter set, post-meeting sub-state model (uses existing LogMeetingModal outcomes + notes free-text — no new enum values), Calendly reschedule handler logic.
- No code changes today; strategy work captured in plan file.

**Surfaced for verification (small follow-ups, not blockers):**
- Verify the Smartlead deep-link URL format (`app.smartlead.ai/app/master-inbox?lead_id=...&campaign_id=...`) actually deep-links to the thread — easy spot-check during Bullet 9 build. If their UI changed, fall back to root master inbox.

**Tomorrow (Day 2):** Begin Bullet 2 — cadence change in `cadence.ts`. Smallest atomic ticket; good warmup before the multi-day surface work.

### Day 1 (continued) — Bullet 2 COMPLETE

**Done:**
- **Bullet 2 — New post-launch cadence: COMPLETE.** Changed `lib/student-outreach/cadence.ts` provider cadence from v9 (Day 0 email+call, Day 1 call, Day 3 email, Day 5 call, Day 7 email = 3+3) to v10 (Day 0 email, Day 3 email+call, Day 5 call, Day 7 email = 3+2). Day 0 paired call deleted (moved to Pre-Flight). Day 1 deleted entirely.
- Updated stale comment in `lib/medjobs/smartlead-bridge.ts` referencing the old phone days (0, 1, 5) → now (3, 5). Smartlead bridge logic was already cadence-driven (no behavior change; only doc fix).
- Acceptance verification: all 7 criteria pass via `npx tsx` script — 3 emails, 2 calls, no Day 1, no Day 0 phone, Day 3 has both email + phone, Day 5 phone only, Day 7 email only.
- Typecheck clean.

**Surfaced (none).** Cadence change was clean and isolated.

**Next:** Bullet 3 — Smartlead webhook expansion (email_open + email_link_click → update existing `email_sent` touchpoint payload).

**Pending Logan signoffs** (per master plan §12 "Phase 0 stabilization" checklist; not blocking branch creation or strategy work):
- Sender identity (`logan@findmedjobs.co` + `partnerships@findmedjobs.co` proposed)
- Footer/unsubscribe copy
- Outreach body copy walkthrough (relevant for Phase 2+3 ticket cuts, not Phase 1)

## Open issues / mid-build findings

(populated during build; cross-reference `medjobs-known-issues.md`)

## Pending decisions surfaced during detail-pass

(populated during Bullet 1 strategy depth pass — placeholder for items that need Logan input before that bullet's spec locks)

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 4.1 (cadence), § 4.17 (Smartlead webhook), § 5.1-5.6 (operational surfaces), § 6.1 (Smartlead inbox), § 6.2 (Calendly cancel/reschedule), § 6.3 (post-meeting sub-state)
- v3 post-launch plan: [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.A (cadence), § P2.A (Next Step), § P2.B (Timeline), § P2.C (tabs), § P2.D (Calls), § P2.E (Emails), § P2.F (Meetings)
- Logan's 10-bullet framing (in thread 2026-06-04): items 6, 8, 9, 10
- Existing cadence: `lib/student-outreach/cadence.ts`
- Existing Smartlead webhook: `supabase/functions/smartlead-webhook/`
- Existing LogMeetingModal: `app/admin/student-outreach/LogMeetingModal.tsx`
- Existing tab config: `lib/student-outreach/tab-config.ts`
- Existing OutreachTimeline: `components/admin/medjobs/OutreachTimeline.tsx`

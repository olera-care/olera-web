# Structured Scheduling & Guided Care Pathway — Proposal

> Status: **DRAFT — Awaiting approval**
> Date: 2026-02-13

---

## Overview

Evolve the connection drawer from free-text coordination to a structured, guided pathway: **Schedule → Confirm → Prepare → Attend call**. Four changes:

1. **Structured time proposals** — replace free-text with selectable time slots
2. **Confirmed call state** — clear confirmation with calendar + reschedule actions
3. **Pre-qualification prompts** — surface care details before the call
4. **Family tab adjustments** — rename "Active" → "Pending", default to "Connected"

---

## 1. Structured Time Proposals

### Current Problem

When a family requests a call, the provider sees "Share Your Availability" which pre-fills `"I'm available for a call "` in the text input. The provider types something like "I'm available at 8 PM" — free text that the family must mentally parse, then respond with their own free text. Multiple round-trips, no structured acceptance.

### Proposed Solution

Replace free-text availability with a **time proposal card** — either party can propose up to 3 time slots. The other party taps to accept one, counter-propose, or decline.

### UI Pattern: Inline Proposal Cards

**Proposing times** (replaces "Share Your Availability" button):

```
┌─────────────────────────────────────────────┐
│  📞 Provider Six would like to schedule a   │
│  call                                       │
│  "Afternoons work best"                     │
│                                             │
│  ┌─ Suggest Times ─────────────────────┐    │
│  │                                     │    │
│  │  📅 Date    [Feb 15 ▾]             │    │
│  │  🕐 Time    [2:00 PM ▾]            │    │
│  │  🌐 Zone    [EST ▾]  (auto-detect) │    │
│  │                                     │    │
│  │  [+ Add another time]              │    │
│  │                                     │    │
│  │  [ Cancel ]  [ Send 1 Time ]       │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

- **Date picker**: Native `<input type="date">` — no calendar library needed
- **Time picker**: `<select>` with 30-min increments (9:00 AM – 8:00 PM)
- **Timezone**: Auto-detected from `Intl.DateTimeFormat().resolvedOptions().timeZone`, editable dropdown of US timezones
- **"+ Add another time"**: Up to 3 slots max
- Minimum: 1 slot required

**Proposal appears in thread** (as a special message type):

```
┌─────────────────────────────────────────────┐
│  Provider Six suggested times for a call:   │
│                                             │
│  ○ Sat, Feb 15 · 2:00 PM EST               │
│  ○ Sun, Feb 16 · 10:00 AM EST              │
│  ○ Mon, Feb 17 · 4:30 PM EST               │
│                                             │
│  [ Accept Selected ]   [ Suggest Different ]│
│                                             │
│  or  Decline                                │
└─────────────────────────────────────────────┘
```

- Radio-select one slot → "Accept Selected" becomes active
- "Suggest Different" opens the same time picker (counter-proposal)
- "Decline" cancels the entire next_step_request
- **Either party can propose** — families can also suggest times after requesting a call

**Already-responded proposals** (read-only in thread history):

```
│  Provider Six suggested times for a call:   │
│                                             │
│  ✗ Sat, Feb 15 · 2:00 PM EST               │
│  ✓ Sun, Feb 16 · 10:00 AM EST  ← accepted  │
│  ✗ Mon, Feb 17 · 4:30 PM EST               │
```

### How Proposals Flow

```
Family requests call
    │
    ▼
Provider sees action card → "Suggest Times"
    │
    ▼
Provider picks 1-3 time slots → sends proposal
    │
    ▼
Family sees proposal card in thread
    │
    ├─ Accept one → CONFIRMED (§2)
    ├─ Suggest Different → counter-proposal (same flow, roles swapped)
    └─ Decline → next_step_request cleared, system message
```

Either party can initiate proposals at any point after the call is requested. Counter-proposals replace the active proposal (only one active at a time).

### Data Model (metadata-only, no new tables)

Extend `connections.metadata` with a `time_proposals` array:

```typescript
// In connections.metadata
{
  // ... existing fields (thread, next_step_request, etc.)

  // NEW: Active time proposal (only one active at a time)
  time_proposal?: {
    id: string;                    // nanoid for idempotency
    from_profile_id: string;       // who proposed
    type: "call" | "consultation" | "visit";
    slots: Array<{
      date: string;                // "2026-02-15" (ISO date)
      time: string;                // "14:00" (24h format)
      timezone: string;            // "America/New_York" (IANA)
    }>;
    status: "pending" | "accepted" | "declined";
    accepted_slot_index?: number;  // which slot was chosen
    created_at: string;            // ISO timestamp
    resolved_at?: string;          // when accepted/declined
  } | null;

  // NEW: Confirmed scheduled call (set when a proposal is accepted)
  scheduled_call?: {
    type: "call" | "consultation" | "visit";
    date: string;                  // "2026-02-15"
    time: string;                  // "14:00"
    timezone: string;              // "America/New_York"
    proposed_by: string;           // profile_id of proposer
    confirmed_at: string;          // ISO timestamp
    status: "confirmed" | "completed" | "cancelled" | "rescheduled";
    cancelled_by?: string;         // profile_id if cancelled
    cancelled_at?: string;
  } | null;
}
```

**Why metadata, not a new table:**
- Scheduling state is tightly coupled to a single connection
- No cross-connection queries needed (we don't need "all calls today")
- JSONB is already the pattern for thread/next_step_request
- Avoids schema migration coordination with iOS team
- If we later need cross-connection scheduling queries, we can extract to a table then

### API Changes

**New endpoint: `POST /api/connections/propose-times`**

```typescript
// Request
{
  connectionId: string;
  slots: Array<{ date: string; time: string; timezone: string }>;
}

// Response
{
  time_proposal: TimeProposal;
  thread: ThreadMessage[];
}
```

- Validates: connection is accepted, user is participant, max 3 slots, dates in future
- Sets `metadata.time_proposal` to the new proposal
- Appends a `time_proposal` type thread message for display
- If an existing proposal is active, replaces it (counter-proposal)

**New endpoint: `POST /api/connections/respond-proposal`**

```typescript
// Request
{
  connectionId: string;
  action: "accept" | "decline";
  acceptedSlotIndex?: number;  // required when action = "accept"
}

// Response
{
  time_proposal: TimeProposal | null;
  scheduled_call: ScheduledCall | null;
  next_step_request: null;  // cleared on accept
  thread: ThreadMessage[];
}
```

- On **accept**: sets `time_proposal.status = "accepted"`, creates `scheduled_call`, clears `next_step_request`, appends confirmation system message
- On **decline**: sets `time_proposal.status = "declined"`, clears `time_proposal`, appends system message. Does NOT clear `next_step_request` (they can re-propose)

**Modify: `POST /api/connections/next-step`** (cancel action)
- Also clears any active `time_proposal` when the request is cancelled

---

## 2. Confirmed Call State

### Once a Time Is Accepted

The action bar transforms to show the confirmed call clearly:

```
┌─────────────────────────────────────────────┐
│  ✓ Call confirmed                           │
│                                             │
│  📅 Sun, Feb 16 · 10:00 AM EST             │
│  Proposed by Provider Six                   │
│                                             │
│  [ 📅 Add to Calendar ]                    │
│                                             │
│  Reschedule  ·  Cancel call                 │
└─────────────────────────────────────────────┘
```

- **Emerald/green background** — visually distinct from pending (amber) state
- **"Add to Calendar"** — primary CTA, generates `.ics` file download (no external API needed)
- **"Reschedule"** — opens the time proposal picker (new proposal replaces the scheduled call)
- **"Cancel call"** — confirmation dialog, then sets `scheduled_call.status = "cancelled"`, appends system message

### .ics File Generation

Simple client-side generation, no library needed:

```
BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20260216T100000
DTEND:20260216T103000
SUMMARY:Call with Provider Six - Olera
DESCRIPTION:Scheduled via Olera
END:VEVENT
END:VCALENDAR
```

- 30-minute default duration
- Download as `olera-call.ics` — works with Apple Calendar, Google Calendar, Outlook
- No Google Calendar API or OAuth needed

### Context Summary in Drawer Header

When a call is confirmed, show it in the connection info area (below the profile header, above the thread):

```
┌─────────────────────────────────────────────┐
│ 📞 Upcoming call · Sun, Feb 16 · 10:00 AM  │
└─────────────────────────────────────────────┘
```

- Small, persistent chip — always visible while scrolling the thread
- Tapping it scrolls to the confirmation card in the thread
- After the call time passes: chip changes to "Call was scheduled for [date]" (muted)

### State Transitions

```
scheduled_call.status:
  confirmed ──→ completed    (time passes, or either party marks it)
  confirmed ──→ cancelled    (either party cancels)
  confirmed ──→ rescheduled  (either party proposes new times)
```

We won't auto-transition to "completed" — that would need a cron job. Instead:
- After the scheduled time passes, the action bar copy softens: "How did the call go?" with a "Mark as completed" button or "Reschedule" if it didn't happen.
- This is a UI-only heuristic based on comparing `scheduled_call.date + time` to `new Date()`.

---

## 3. Pre-Qualification Prompts

### Goal

Make the call purposeful. Surface 2-3 contextual prompts that help both parties prepare.

### What Data Already Exists

The initial connection `message` field already captures:
- `care_recipient` — self or loved one
- `care_type` — companion, personal, memory, skilled_nursing, other
- `urgency` — ASAP, within a month, few months, researching
- `additional_notes` — free text

The family's `business_profiles.metadata` may also have:
- `care_needs`, `budget_min/max`, `care_location`, `timeline`

### Prompt Design: Contextual Nudges, Not Forms

Show gentle prompts below the confirmed call card. These are **suggestions, not requirements**.

```
┌─────────────────────────────────────────────┐
│  Prepare for your call                      │
│                                             │
│  ☐  Confirm care needs and schedule         │
│  ☐  Share budget range                      │
│  ☑  Location and service type  ✓ shared     │
│                                             │
│  Completing these helps make the call       │
│  productive.                                │
└─────────────────────────────────────────────┘
```

### Logic for Which Prompts to Show

**For families** (before a call with a provider):

| Prompt | Show when | "Completed" when |
|--------|-----------|------------------|
| "Confirm care needs and schedule" | Always | `care_type` + `urgency` exist in connection message |
| "Share budget range" | Always | Family profile has `budget_min` or `budget_max` in metadata, OR any thread message mentions "$" or "budget" |
| "Confirm location and service type" | Always | Connection message has `care_type` AND family profile has `city`/`state` |

**For providers** (before a call with a family):

| Prompt | Show when | "Completed" when |
|--------|-----------|------------------|
| "Review care needs" | Always | Provider sent at least 1 message after the call was confirmed |
| "Confirm your availability and rates" | Provider is caregiver type | Provider profile has `hourly_rate_min` in metadata |
| "Prepare service information" | Provider is organization type | Provider profile has `description` set |

### Implementation: Pure Frontend Logic

These prompts don't need new data — they're **computed from existing fields**. The component reads:
1. `connection.message` (parsed JSON) for care details
2. `otherProfile.metadata` / `activeProfile.metadata` for profile completeness
3. `thread` messages for heuristic detection (e.g., "$" mentioned)

No API calls. No new stored state. Just a `useMemo` that computes prompt completion.

### Optional: Tapping a Prompt Pre-fills the Message Input

Tapping "Share budget range" could pre-fill the message input with:
> "Our budget range is approximately..."

This keeps it conversational — the data flows through the thread, not through rigid forms.

---

## 4. Family "My Connections" Tab Adjustments

### Current State

| Tab | Label | Default? | Contents |
|-----|-------|----------|----------|
| 1 | **Active** | ✅ Yes | Pending requests (`status: pending`) |
| 2 | **Connected** | No | Accepted connections (`status: accepted`) |
| 3 | **Past** | No | Declined, withdrawn, expired, ended |

### Problem

- "Active" implies ongoing activity, but these are just pending/waiting — no action from the family
- "Connected" is where the real engagement happens, but it's not the default
- New users land on "Active" which is often empty, creating a dead-end feel

### Proposed Changes

| Tab | New Label | Default? | Contents |
|-----|-----------|----------|----------|
| 1 | **Connected** | ✅ Yes | Accepted connections — the primary workspace |
| 2 | **Pending** | No | Pending requests — waiting for provider response |
| 3 | **Past** | No | Declined, withdrawn, expired, ended (unchanged) |

### Visual Treatment

- **Connected tab (default, first position):**
  - Emerald count badge when there are connections
  - Unread amber dot stays (already exists)
  - Cards show scheduled call time if one exists (new subtitle line)

- **Pending tab:**
  - Blue count badge (matches "Awaiting Reply" badge color)
  - When count > 0, shows a subtle pulse dot to indicate waiting items

- **Tab order rationale:**
  Connected first because:
  1. It's where the family takes action (messaging, scheduling)
  2. New users with 0 connections see a helpful empty state ("When a provider accepts...")
  3. Users with active connections land directly in the right place
  4. "Pending" becomes a secondary check ("any new responses?")

### Code Changes

In `app/portal/connections/page.tsx`:

```typescript
// Before
const tabs = [
  { id: "active",    label: "Active",    ... },
  { id: "connected", label: "Connected", ... },
  { id: "past",      label: "Past",      ... },
];
const [activeTab, setActiveTab] = useState<ConnectionTab>("active");

// After
const tabs = [
  { id: "connected", label: "Connected", ... },
  { id: "active",    label: "Pending",   ... },  // renamed
  { id: "past",      label: "Past",      ... },
];
const [activeTab, setActiveTab] = useState<ConnectionTab>("connected");
```

Note: The internal `id` stays `"active"` to avoid changing `connection-utils.ts` mapping logic. Only the `label` changes to "Pending".

### Empty State Updates

- **Connected (new default):** "No connections yet" — "When a provider accepts your request, your conversations will appear here. Browse providers to get started." + [Browse Providers] CTA
- **Pending:** "No pending requests" — "When you reach out to a provider, your pending requests will show up here."

---

## 5. Data Model Summary

### No Schema Changes Required (Phase 1)

Everything fits within the existing `connections.metadata` JSONB column:

```
connections.metadata = {
  thread: ThreadMessage[],           // existing
  next_step_request: {...} | null,   // existing
  withdrawn: boolean,                // existing
  ended: boolean,                    // existing
  hidden: boolean,                   // existing

  // NEW
  time_proposal: {...} | null,       // active proposal
  scheduled_call: {...} | null,      // confirmed call
}
```

### New Thread Message Types

```typescript
type ThreadMessageType =
  | undefined          // regular message (existing)
  | "system"           // system notification (existing)
  | "next_step_request" // call/consult/visit request (existing)
  | "time_proposal"    // NEW: someone proposed times
  | "time_accepted"    // NEW: a time was accepted
  | "call_cancelled"   // NEW: scheduled call was cancelled
  | "call_rescheduled" // NEW: scheduled call was rescheduled
```

### What Would Require a New Table (Future, Not Now)

A dedicated `scheduled_calls` table would be needed only if we later want:
- Cross-connection scheduling queries ("all calls today for this provider")
- Calendar sync / webhook integration (Google Calendar API)
- Automated reminders (requires server-side cron)
- Analytics on call completion rates
- Double-booking prevention

**This is additive** — we'd create `scheduled_calls` and populate it from existing metadata. No breaking changes.

---

## 6. Phased Rollout

### Phase 1: Tab Adjustments (Implement Now)
- Rename "Active" → "Pending"
- Reorder tabs: Connected | Pending | Past
- Default to "Connected" tab
- Update empty state copy
- **Effort:** ~30 min, frontend only, no API changes

### Phase 2: Structured Time Proposals (Implement Now)
- Time proposal picker component
- Thread rendering for proposal cards (propose / accept / decline)
- `POST /api/connections/propose-times` endpoint
- `POST /api/connections/respond-proposal` endpoint
- Replace "Share Your Availability" with "Suggest Times"
- Family can also propose times (after provider sends first message, or directly)
- **Effort:** ~2-3 hours, new API routes + components

### Phase 3: Confirmed Call State (Implement Now)
- Confirmed call action bar (add to calendar, reschedule, cancel)
- `.ics` file generation
- Persistent "upcoming call" chip in drawer header
- Post-call state ("How did the call go?")
- **Effort:** ~1-2 hours, builds directly on Phase 2

### Phase 4: Pre-Qualification Prompts (Implement Now)
- Computed prompt checklist component
- Tap-to-prefill message input
- Render below confirmed call card
- **Effort:** ~1 hour, pure frontend logic, no API changes

### Phase 5: Future (Requires Backend)
- Dedicated `scheduled_calls` table
- Automated email/SMS reminders before calls
- Google Calendar sync
- Provider availability windows (recurring)
- Call outcome tracking / completion rates

---

## 7. What's NOT Included (Intentional)

- **No calendar widget** — native date/time inputs are sufficient for MVP
- **No recurring availability** — providers suggest times per-request, not weekly slots
- **No video/phone integration** — we confirm a time, not host the call
- **No email notifications** — future work (Phase 5)
- **No timezone conversion UI** — we store IANA timezone and display in the proposer's zone; recipients see the converted time

---

## 8. File Impact Summary

### New Files
| File | Purpose |
|------|---------|
| `components/portal/TimeProposalPicker.tsx` | Date/time slot picker (1-3 slots) |
| `components/portal/TimeProposalCard.tsx` | Thread card for viewing/accepting proposals |
| `components/portal/ConfirmedCallBar.tsx` | Action bar for confirmed calls |
| `components/portal/PreQualPrompts.tsx` | Computed pre-call checklist |
| `app/api/connections/propose-times/route.ts` | API: create time proposal |
| `app/api/connections/respond-proposal/route.ts` | API: accept/decline proposal |
| `lib/ics.ts` | .ics file generation utility |

### Modified Files
| File | Changes |
|------|---------|
| `components/portal/ConnectionDrawer.tsx` | Integrate new components into action bar + thread rendering |
| `app/portal/connections/page.tsx` | Tab rename, reorder, default change |
| `app/api/connections/next-step/route.ts` | Clear `time_proposal` on cancel |
| `lib/connection-utils.ts` | (Possibly) add scheduled call info to card subtitle |

### No Changes Needed
| File | Why |
|------|-----|
| `lib/types.ts` | Metadata is `Record<string, unknown>`, no type change needed |
| `supabase/migrations/*` | No schema changes |
| `middleware.ts` | No auth changes |

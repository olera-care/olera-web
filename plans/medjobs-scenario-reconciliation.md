# MedJobs Post-Outreach — Scenario Reconciliation & Answers

Status: **DESIGN — answers Logan's pressure-test. For review.** No build yet.
Created: 2026-06-08
Companion to: build plan + drawers-and-cadences-design + screen-inventory.
Grounded in actual code: `welcome-token.ts`, `app/medjobs/m/[token]/route.ts`,
`enrollRowIntoSmartlead` (`[id]/route.ts`), `engagement-state.ts`, `state-derivation.ts`.

---

## A. THE CONTACT-IDENTITY MODEL (answers Q8 — read this first; everything else depends on it)

### The one principle
**The ORG is the anchor, not the email address.** The pilot, the Terms acceptance, and the
"Trial Active" flag all live on **one `business_profiles` row keyed by `source_provider_id`**
(= the directory `olera_provider_id`). Email addresses are just *doors into that one org record.*

### How auth actually works (confirmed in `m/[token]/route.ts`)
1. Every magic link is signed with **one specific email** (in the token).
2. When clicked, that **token email** becomes the authenticated `auth.users` row → an `accounts`
   row → which **adopts the org's `business_profiles` row** (matched by `source_provider_id`).
3. `account.active_profile_id` is set to that org profile → the app renders provider chrome.
4. **First clicker wins:** whoever clicks first owns the account the org is linked to. If a
   *second, different* email later clicks its own link, it gets a different account → the org is
   already owned → **co-tenancy = read-only** (`claim_conflict`).
5. The magic-link session is for the **token's email regardless of the clicker's own mailbox** —
   so forwarding works (a gatekeeper can forward the email and the owner clicking it still lands
   as the token email's user).

### The four email roles
| Role | Where it lives | Gets initial outreach? | Gets activation link? | Can become the authed user? |
|---|---|---|---|---|
| **General Contact** | `research_data.general_contact.email` | ✅ always (required to launch) | only if they're who engaged | ✅ (if its link is clicked) |
| **Decision Maker** | `research_data.decision_maker.email` | ✅ if known (2nd lead, max 2) | ✅ **preferred when known** | ✅ (if its link is clicked) |
| **Specific contact** | `contacts[]` table | used for **phone** today, not the email lead | n/a | n/a |
| **Org email** | `business_profiles.email` (from directory) | ❌ display only | ❌ | ❌ |

> ⚠️ Note (flagged for build): today `enrollRowIntoSmartlead` sends to **GC + DM**, but the
> Pre-Flight modal's "will send to N contacts" preview reads the `contacts[]` table. For provider
> rows these can disagree. We should make the preview show GC + DM so the admin sees the truth.

### The rules (these resolve every Q8 sub-question)
1. **Initial outreach** → General Contact (always) + Decision Maker (if known). Each gets its
   **own** magic link.
2. **Activation link** → send to **the email that engaged**, to preserve context. Prefer the
   **Decision Maker** when they're our champion. **Send to ONE email** to avoid the two-account
   race.
3. **Both GC + DM exist and both click their own links** → first clicker owns the org; second →
   read-only co-tenancy. *Mitigation: drive activation through one email; don't blast the magic
   link to both once someone's engaged.*
4. **Decision Maker replies** → they're our person → activation link to the DM → DM becomes the
   authed provider user.
5. **General inbox replies / forwards to the owner** → if the owner surfaces a **new email**, use
   **"Redirected / Add contact"** to capture it, then send the activation link to **that** email
   so *the clicker = the account owner = the right person*.
6. **Owner replies from a different email than we mailed** → same as #5: capture the new email,
   send the activation link there. (Don't rely on them clicking a link addressed to the old box.)
7. **Authenticated provider user** = the token email of whichever link is clicked → its account →
   the org profile → **accepting Terms writes `interview_terms_accepted_at` on that org profile →
   Trial Active.** One org, one pilot, regardless of how many contacts we emailed.

---

## B. THE ACTIVATION TRIGGER MODEL (answers Q1, Q4 — "never depend on memory")

### "Awaiting Activation" is a real, derived, visible state
**Definition:** `status = engaged` (or just had an interested call/meeting) **AND** an
`activation_link_sent` marker exists **AND** not yet converted (no `interview_terms_accepted_at`,
not `active_partner`).

- **Marker:** a `note_added(reason: "activation_link_sent", payload: { email, source })` touchpoint,
  written **whenever the admin sends the magic link** (email pill, call→send-link, post-meeting,
  or Resend). `source` ∈ `reply | phone | meeting | dm`. No new touchpoint type (discipline OK).
- **Why a marker:** the cold emails *already* contain a magic link, so "they got a link" isn't
  special. The marker means *"a human deliberately sent the activation link because this provider
  is interested"* — that's the signal that starts the Awaiting-Activation clock.

### What triggers it (Q1)
| Source | Action that fires the marker |
|---|---|
| Interested **email reply** | Email pill **Interested** or **Send link** (sends link → marker) |
| Interested **phone call** | Call outcome **Interested** → then **Send activation link** button |
| **Post-meeting** | Log meeting → **needs follow-up / activate-later** → send link |
| **Decision maker identified later** | Add DM → **Send activation link** to the DM |

### What the admin sees, so they never have to remember (Q1, Q4)
- The row sits in the **Emails tab**, sorted **high** (with the warm replies).
- Drawer Next Step shows: **★ Interested — not activated yet · link sent {N}d ago · opened {x}×.**
- After **3 days** with no `platform_visited` + no Terms → the row is flagged **"⏰ stalled"** and
  bumped further up. *(This is the lightweight reminder — it replaces the separate "needs-nudge
  banner" idea; it's the same signal, attached to the Awaiting-Activation state.)*
- Buttons: **[Launch activation follow-up]** (the reviewed sequence) · **[Nudge now]** (one email)
  · **[Resend link]**.

### The chosen workflow for Q4 (interested by phone, doesn't activate)
**Option (b) + a built-in safety reminder — NOT auto-firing a sequence.**
1. On the call, admin logs **Interested** and clicks **Send activation link** → marker written →
   row enters **Awaiting Activation** immediately (work is alive, pinned, dated).
2. The state itself is the reminder; the **3-day "stalled" flag** makes forgetting impossible.
3. The admin chooses when to **Launch activation follow-up** (per your decision: no surprise
   sequences). Once launched, the sequence automates the nudging and stops on activation.

This satisfies "the system keeps that work alive and does not depend on memory" **without**
auto-blasting emails you didn't approve.

---

## C. HOW MANY ACTIVATION CADENCES FOR MVP (answers Q5)

The **destination is identical** for every interest source (Awaiting Activation → click → Terms →
Trial Active). Only the **first email's framing** differs. So:

**MVP = 2 cadences, not 4:**
1. **`activation_followup`** — serves interested-by-**email**, interested-by-**phone**, and
   **decision-maker-identified-later**. The first email is **editable at launch** (you're
   approving it anyway), so the admin tailors the opener — *"great talking just now"* vs *"thanks
   for your reply"* vs *"{DM name} suggested I reach out"* — in 5 seconds. One cadence, context
   supplied at approval time.
2. **`post_meeting_followup`** — genuinely different (deeper relationship, call scripts that
   reference the meeting). Kept separate.

This is context-relevant without maintaining four near-identical template sets.

---

## D. WANTS-TO-MEET FLOW (answers Q3)

### What "Wants to meet" generates
A **dual-path** human reply, editable, e.g.:

> Great — we'd love to find time. Either send a couple of windows that work this week or next and
> I'll get it on Dr. DuBose's calendar, **or** grab a slot directly here: {Calendly link}.
> — {RA name}, Research Assistant, Olera

- **Template:** the "wants_meeting" reply template (RA voice + Dr. DuBose Calendly w/
  `utm_content=<outreach_id>`).
- **Editable:** ✅ in the composer before sending.
- **Sends:** through Smartlead in-thread (same as other pills); copy-paste fallback if needed.
- **Card state after sending:** **wants_meeting** (lives in Emails/Replies, *not* Meetings yet —
  Meetings = real bookings only).
- **How the system knows a meeting is actually scheduled (both cases):**
  - **Self-schedule via Calendly** → `invitee.created` webhook → `mark_meeting_scheduled` → row →
    **Meetings** automatically.
  - **Provider sends times** → admin books it → clicks **Log meeting → On the calendar** (date) →
    row → **Meetings**.

Both real-world cases supported; the card only enters Meetings when a time truly exists.

---

## E. POST-MEETING CADENCE — DISTINCT, NOT A REPEAT (answers Q3-post-meeting)

Confirmed handled as its **own** cadence (`post_meeting_followup`), separate registry entry:
- **Queues:** +1d email, +4d **call**, +8d email (call only if phone exists).
- **Replies:** flow back to the **Emails tab** via the same reply webhook (dependency in §G).
- **Context preserved:** triggered by the meeting outcome; the meeting's notes **prefill the
  first email**; touchpoints tag `reason: "post_meeting_followup"`.
- **Copy:** post-meeting voice ("great talking yesterday…", scripts reference the conversation),
  **never** the cold intro copy.
- **Goal:** every step carries the activation magic link; stops on Trial Active.

---

## F. VOICEMAIL CALLBACKS — PLAN (answers Q6; MVP = light)

We do **not** ingest voicemail audio. The plan:
- **How admin checks voicemail:** their own phone / Google Voice (outside the app) — unchanged.
- **Current state holds the work:** "Left voicemail" already moves the row to **awaiting_callback**
  in the Emails tab (it doesn't disappear), and future cadence calls still fire.
- **Recording a callback:** admin opens the row → **Log call outcome** (if they called back and
  talked) or **Log reply** (if they left a message) → records what happened.
- **Card behavior:** it **updates the existing row** (no new card spawned) and moves it to the
  next state (engaged / meeting / awaiting activation / closed).
- **MVP:** ship as-is (state already exists). **Deferred:** auto-detecting an inbound call/voicemail
  → that needs a telephony integration we're not doing now. Documented as a future item.

---

## G. THE ONE REAL TECHNICAL DEPENDENCY (affects Q1, Q2, Q3, Q5)

For follow-up replies to **"appear in the Emails tab" automatically**, the activation &
post-meeting emails must be sent **in a way Smartlead's reply webhook can capture** (same
campaign/thread). If we instead send them as plain one-offs (Resend), replies land in the Gmail
inbox and the admin logs them **manually** — the current model.

- **Recommended:** send follow-up emails **through Smartlead** (append as steps / threaded sends)
  so the reply webhook covers them and the loop stays automatic.
- **Fallback (still fine):** Resend one-offs + manual logging via Log Reply.
- **This is the single thing to confirm during Phase 1/2 build.** It does not block the design.

---

## H. CLICKED-EMAIL → CALL BUMP — make the script useful (answers Q7)

Already exists: a click bumps the row to the **top of Calls** (clicked_not_activated). The
addition: the **Next Step + script reference the click**, e.g.:

> **They clicked "see your students" 3h ago — call while it's warm.**
> Script: *"Hi {name}, this is {RA} from Olera — I saw you took a look at the student page, wanted
> to see if you had any questions and help you get set up to start reaching out to them."*

Useful, not creepy: we reference *their action on our own page*, framed as *help*, with the goal of
activation. (When the admin clicks **Schedule call now**, the queued call task carries this
click-aware script.)

---

## I. FULL SCENARIO STATE MAP (answers Q9 — every scenario has a defined next state)

| # | Scenario | Entry trigger | Lands in (state) | Admin's next surface | Resolves to |
|---|---|---|---|---|---|
| 1 | Interested by **email** | pill Interested/Send link | Awaiting Activation | Launch follow-up / nudge | Trial Active |
| 2 | Interested by **phone** | call Interested + send link | Awaiting Activation | Launch follow-up / nudge | Trial Active |
| 3 | **Wants meeting** | pill Wants to meet | wants_meeting (Emails) | Calendly or Log meeting | meeting_set |
| 4 | **Meeting scheduled** | Calendly webhook / Log meeting | meeting_set (Meetings) | Log meeting | activate / follow-up |
| 5 | **Meeting done, not activated** | Log meeting → needs follow-up | needs_followup → Awaiting Activation | Launch post-meeting cadence | Trial Active |
| 6 | **Clicked link, no activation** | engagement (click) | clicked_not_activated (Calls top) | Schedule call (click script) | Trial Active |
| 7 | **Bounced email** | bounce webhook | bounce_fix | fix email + relaunch | back in cadence |
| 8 | **Wrong number** | call wrong_number | closed (wrong_contact) | reopen if needed | closed |
| 9 | **No answer ×N** | cadence exhausts | stale → archive | auto-revive on reply | closed/dormant |
| 10 | **Voicemail callback** | call voicemail → later log | awaiting_callback → (logged) | Log call / Log reply | next state |
| 11 | **DM identified later** | Add DM | back in outreach/activation | send DM the link | Awaiting Activation |
| 12 | **General inbox forwards to owner** | owner replies (new email) | engaged | Redirected → capture owner email | Awaiting Activation |
| 13 | **Owner replies from different email** | reply from new address | engaged | Redirected → capture, send link there | Awaiting Activation |
| 14 | **Provider activates Terms** | platform_visited + Terms | converted / Pilot Active | ongoing tasks | Trial Active ✓ |
| 15 | **Asks to stop outreach** | call/reply "stop" | closed (do_not_contact) | — | closed (no reopen) |
| 16 | **Not interested** | call/reply not interested | closed (not_interested) | reopen if they return | closed |

Every scenario has a defined state or an intentional deferral (10 partial, 7 bounce-pending).

---

## J. UPDATED OVER/UNDER-BUILD VERDICT (reconciled with the above)

Changes from my earlier verdict, driven by your pressure-test:
- **Keep "Nudge now" after all** — Q4 shows a single manual nudge is a genuinely different,
  useful action from launching a full sequence. (I'd earlier suggested cutting it.)
- **"Needs-nudge banner" → folded into Awaiting Activation** as the 3-day "stalled" flag, not a
  separate component. (Simpler; still answers "don't depend on memory.")
- **Activation cadences = 2, not 4** (§C) — context supplied at launch-time edit.
- **Calendly webhook** — still reasonable to **defer**, BUT §D needs the manual "Log meeting →
  On the calendar" path to be solid so self-scheduling isn't required for v1. (It already exists.)
- **Post-meeting cadence** — you asked to build it; kept, as a distinct cadence (§E).
- **The contact-identity rules (§A)** are now the spec the build must follow — previously implicit.

---

## K. STILL-OPEN DECISIONS

1. **Activation send channel (§G)** — confirm we try Smartlead-threaded sends first (auto reply
   capture), with Resend + manual-log as fallback. (Recommend yes.)
2. **Stalled threshold** — 3 days for Awaiting Activation? (Cold "stale" is 4; warm should be
   tighter.)
3. **Activation link target when both GC + DM exist (§A rule 2)** — default to **Decision Maker
   when present, else the email that replied**? (Recommend yes.)

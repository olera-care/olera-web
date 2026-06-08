# MedJobs Post-Outreach — Complete Screen Inventory

Status: **DESIGN — exhaustive. For Logan review.** No build yet.
Created: 2026-06-08
Companion to: `plans/medjobs-post-outreach-workflow.md` (build phases) and
`plans/medjobs-drawers-and-cadences-design.md` (narrative design).

**Goal of this doc:** show *every* screen, *every* button, *every* scenario, each tagged:
- 🟩 **EXISTS** — already built, shown so you can see the whole picture.
- 🟦 **NEW** — this build adds it.
- 🟧 **DECISION** — needs your input before we build (listed again in §13).

Legend for sketches: `[ Button ]` = button · `○` = radio choice · `▸/▾` = collapsible ·
`{token}` = filled-in value.

---

# PART 1 — THE LISTS (where every click starts)

The four daily tabs. Rows are sorted so the most urgent float up. Clicking any row opens the
Drawer (Part 2).

## 1.1 🟩 Prospects tab
```
┌ Prospects ─────────────────────────────────────────────────┐
│ Sunrise Home Care      [Prospect]  Pre-Flight in progress ▸ │
│ Bluebonnet Caregivers  [Prospect]  Ready to launch        ▸ │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 🟩 Calls tab
```
┌ Calls ─────────────────────────────────────────────────────┐
│ Aggieland Home Health  [Call due]  Day 3 · (979) 555-0199 ▸ │
│ Sunrise Home Care      [Call due]  ★ Clicked — call them   ▸ │  ← clicked-not-activated bumps up
└─────────────────────────────────────────────────────────────┘
```

## 1.3 🟩→🟦 Emails tab (internal key: `replies`)
Today rows show a status chip. 🟦 NEW: rows with an *unread real reply* show a preview line and
an unread dot.
```
┌ Emails ────────────────────────────────────────────────────┐
│ ● Sunrise Home Care   [Replied]  "How does it work?…"     ▸ │  🟦 reply preview + unread dot
│   Bluebonnet          [Awaiting activation] link sent 3d  ▸ │  🟦 new sub-state chip
│   Oak Manor           [Wants meeting]  send a time        ▸ │  🟩
│   Cedar Home Care     [Awaiting callback]  voicemail 1d   ▸ │  🟩
│   Pine Ridge          [In cadence]  Day 5 email next      ▸ │  🟩
│   Willow Care         [Stale]  no reply 6d                ▸ │  🟩
└─────────────────────────────────────────────────────────────┘
```
Sort priority (existing): needs_followup → wants_meeting → engaged → awaiting_callback →
mid_cadence. 🟦 awaiting_activation slots near engaged; needs_nudge bumps stalled rows up.

## 1.4 🟩 Meetings tab
```
┌ Meetings ──────────────────────────────────────────────────┐
│ Oak Manor   [Meeting]  📅 Tue Jun 10, 2:00 PM             ▸ │
│ Elm Senior  [Meeting]  Held — needs follow-up            ▸ │
└─────────────────────────────────────────────────────────────┘
```

## 1.5 🟩 Overflow (⋯): Clients · Partners · Candidates · All · Archive · Emails Sent · Outbound · Signups
Clients tab is where Trial-Active providers live:
```
┌ Clients ───────────────────────────────────────────────────┐
│ Maple Home Care  [Pilot Active]  73 days left            ▸ │
│ Birch Caregivers [Pilot expired] re-engage               ▸ │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 2 — THE DRAWER (every Next-Step state)

The drawer skeleton is constant (header · **Next Step** · context line · timeline · More
details). Only the **Next Step** box changes. Below is *every* state it can be in.

## 2.0 🟩 Drawer skeleton (frame around every state below)
```
┌── {Provider} · {Campus} · Provider ──────────────────  ✕ ─┐
│  NEXT STEP   ← the state-specific box (2.1–2.16) goes here │
│  CONTEXT  {one-line status}                                │
│  TIMELINE ▾  {every email / call / reply / meeting}        │
│  More details ▾  {contacts · danger zone}                  │
└────────────────────────────────────────────────────────────┘
```

## 2.1 🟩 Stage: prospect (pre-launch)
```
│ Pre-Flight in progress                                     │
│ Complete the Research Card below — Visit Website, collect  │
│ missing info, Call to Confirm, then Launch Outreach.       │
│ (Research Card actions: [Visit Website] [Call to Confirm]  │
│  [Launch Outreach →]  — gated until email + verification)  │
```
→ **[Launch Outreach]** opens **Modal A (Pre-Flight Review)**.

## 2.2 🟩 in_outreach · no_engagement
```
│ Awaiting reply at graize@olera.care.                       │
│ Next: Day 5 email · due in 2 days                          │
│ [ Log reply ]                                              │
```
→ **[Log reply]** opens **Modal C (Reply Classifier)**.

## 2.3 🟩 in_outreach · opened_not_clicked
```
│ They opened — give them time.                              │
│ Opened 2× since yesterday. No click yet.                   │
│ Next email: Day 5 (in 2 days)                              │
│ [ Log reply ]                                              │
```

## 2.4 🟩 in_outreach · clicked_not_activated (highest cold priority)
```
│ [Clicked]  They clicked — call them.                       │
│ Visited "see your students" 3h ago. Haven't accepted yet.  │
│ [ Schedule call now → ]   [ Log reply ]                    │
```
→ **[Schedule call now]** queues a call due today (→ row enters Calls).

## 2.5 🟦 ENGAGED · real reply received (THE EMAIL FACE)
```
│ ✉ THEY REPLIED — 2h ago · jane@sunrise.com                │
│ ┌────────────────────────────────────────────────────┐   │
│ │ "Thanks for reaching out — sounds useful. How does  │   │
│ │  it work and what does it cost?"                     │   │
│ └────────────────────────────────────────────────────┘   │
│ Reply: [Interested ★][Wants to meet][Send link]           │
│        [Not interested][Redirected][Other]                │
│ ┌ editable draft (RA voice + signature) ───────────────┐  │
│ │ Hi Jane — great to hear from you. Here's your link to │  │
│ │ see the students near you and get set up: {magiclink} │  │
│ │ — {RA name}, Research Assistant, Olera                 │  │
│ │ (Dr. DuBose Calendly in signature)                    │  │
│ └────────────────────────────────────────────────────┘  │
│ [ Send reply → ]      ·  (in-thread via Smartlead)        │
```
Each pill prefills a different draft. After **Send**: reply logged, state advances per pill
(see Modal E table). 🟦 If send-plumbing unavailable → button becomes **[ Copy draft ]** + "paste
into Smartlead" (same screen).

## 2.6 🟦 AWAITING ACTIVATION (interested, not activated yet)
```
│ ★ Interested — not activated yet.                          │
│ Link sent 3d ago · opened 2× · Terms not accepted.         │
│ [ Launch activation follow-up ]                            │
│ [ Nudge now ]   [ Resend link ]                            │
```
→ **[Launch activation follow-up]** opens **Modal F (Cadence-Launch · activation)**.
→ **[Nudge now]** opens **Modal H (single nudge email)**.
→ **[Resend link]** opens **Modal I (resend confirm)**.
🟦 If a sequence is already running, the first button reads **[ Activation follow-up running · +4d next ]** (disabled) with a **[ Stop sequence ]** link.

## 2.7 🟦 NEEDS NUDGE (any warm state, stalled > 4 days)
Same as the state it's in (2.5/2.6/2.8), but the Next Step gets a banner:
```
│ ⏰ Stalled 5 days — time to nudge.                         │
│ (…the underlying state's buttons render below…)            │
```

## 2.8 🟩→🟦 WANTS MEETING / awaiting_schedule (no booking yet)
```
│ 📅 They want to meet — no time booked yet.                 │
│ Send Dr. DuBose's Calendly link, or offer to book it.      │
│ [ Send Calendly link ]   [ Send "what times work?" ]      │  🟦 dual buttons
│ [ Log meeting ]                                            │  🟩 (manual)
```
🟦 the two send buttons drop the relevant draft into a composer (like 2.5). 🟩 [Log meeting]
opens **Modal D**. (Calendly booking auto-advances this via webhook — Part 5.)

## 2.9 🟩 Stage: call_due (THE CALL FACE)
```
│ [Call]  Make the call, use the script, log it.            │
│ 📞 (979) 555-0142 · Jane Doe (Owner)                     │
│ ▸ Day 3 script  "Hi Jane, did you get our email Monday?…" │
│ [ Log call outcome → ]   [ Log reply ]                    │
```
→ **[Log call outcome]** opens **Modal B**. → **[Log reply]** opens **Modal C**.
🟧 EDGE — **no phone on file**: phone line replaced by "No phone number — add one in More
details, or switch to email." Call CTA hidden.

## 2.10 🟩 awaiting_callback (voicemail / promised callback)
```
│ ☎ Awaiting callback — left voicemail yesterday.           │
│ [ Log reply ]   [ Log call outcome ]                      │
```

## 2.11 🟩 Stage: meeting_set · booked (THE MEETING FACE)
```
│ 📅 Meeting booked · Tue Jun 10, 2:00 PM                   │
│ Prep: campus students pre-loaded; have activation link    │
│ ready to send live.                                        │
│ [ Log meeting → ]                                         │
```
→ opens **Modal D (Log Meeting)**.

## 2.12 🟩→🟦 needs_followup (meeting held, needs more email)
```
│ Meeting held — follow-up needed.                          │
│ {follow-up notes from the meeting log}                     │
│ [ Launch post-meeting follow-up ]   [ Log reply ]         │  🟦 launch button
```
→ 🟦 **[Launch post-meeting follow-up]** opens **Modal G (Cadence-Launch · post-meeting)**.

## 2.13 🟩 Stage: follow_up (custom admin task overdue)
```
│ ⭐ {custom task name} is overdue.                          │
│ Due 2 days ago. Log the outcome from the timeline below.   │
```

## 2.14 🟩 Stage: bounce_fix
```
│ ⚠ Email bounced. Update the contact and re-launch.        │
│ Edit the email in More details, then re-launch.           │
```
🟦 becomes live once the bounce webhook emits touchpoints (currently placeholder).

## 2.15 🟩→🟦 Stage: converted (Trial Active / Pilot Active)
```
│ Pilot Active 🎉                                            │
│ Activated Jun 8 · 90 days left in the pilot.              │
│ Ongoing tasks surface in the timeline below.              │
```
🟦 the activation/post-meeting cadences auto-stop the instant this state is reached.

## 2.16 🟩 Stage: closed (not interested / no response / DNC / wrong / redirected)
```
│ Closed Jun 4 · not interested                            │
│ [ Reopen → ]   (hidden for Do-Not-Contact)               │
```

---

# PART 3 — THE OUTCOME MODALS (every option, every expand)

## 3.A 🟩 Modal A — Pre-Flight Review (Launch cold outreach)
```
┌ Confirm outreach plan · Sunrise Home Care · Texas A&M ── ✕ ┐
│ First email goes now. Follow-ups send themselves; calls    │
│ land in Calls; replies show in Emails.                     │
│ Will send to: Jane Doe (jane@sunrise.com)                  │
│ ▸ Day 0 · intro email          Subject: {…}             ▾ │ ← expand: Subject input,
│ ▸ Day 3 · light follow-up                                  │   Body textarea, [Preview]
│ ▸ Day 7 · social-proof                                     │
│ ▸ Day 10 · final follow-up                                 │
│ 📎 Olera flyer (PDF) attached automatically.               │
│ 4 emails ready          [ Cancel ]   [ Start outreach ]    │
└────────────────────────────────────────────────────────────┘
```
🟦 Minor: also list the cadence's **phone days** as read-only rows ("Day 3 · call") so the plan
shows calls too.

## 3.B 🟩 Modal B — Log Call Outcome
```
┌ Log call outcome · Sunrise Home Care · Jane · (979)…─── ✕ ┐
│ DIDN'T REACH THEM                                          │
│  ○ No answer                                               │
│  ○ Left a voicemail / message with front desk             │
│  ○ Wrong number                                           │
│ REACHED THEM                                               │
│  ○ Promised to call back                                   │
│  ○ Interested                                             │
│  ○ Meeting scheduled        → [datetime picker ▾]   ⟵expand│
│  ○ Mark as Partner ★ (stakeholder only) → [evidence ▾]    │
│  ○ Became a Client ✓ (provider only)                     │
│  ○ Not interested                                         │
│ OTHER                                                      │
│  ○ Stop communications                                    │
│  ○ Archive — no response                                  │
│ Notes ____________________________________________        │
│                              [ Cancel ]  [ Log outcome ]   │
└────────────────────────────────────────────────────────────┘
```
**Conditional expands:** `meeting_scheduled` → datetime input; `convert_to_partner` → Partner
Evidence panel (stakeholder only). 🟦 **change:** picking **Interested** shows an inline note —
"Stops cold cadence. You can launch the activation follow-up from the row next." (No auto-fire.)
**Outcome map:** see §11.

## 3.C 🟩 Modal C — Reply Classifier (Log reply)
```
┌ What did they say? · Sunrise Home Care ──────────────── ✕ ┐
│ Check Gmail and voicemail first, then pick what happened.  │
│  ○ They replied (generic) — cadence continues             │
│  ○ They want to meet → reply with Calendly; row → Meetings │
│  ○ Meeting is booked        → [datetime picker ▾]          │
│  ○ Became a Client ✓ (provider)  /  Mark as Partner ★ (stk)│
│  ○ Redirected to another contact → [name/email fields ▾]   │
│  ○ Not interested                                         │
│ Notes ____________________________________________        │
│                                   [ Cancel ]   [ Save ]    │
└────────────────────────────────────────────────────────────┘
```
**Conditional expands:** `already_booked` → datetime; `redirected` → first/last/email fields;
`committed` → Partner Evidence (stakeholder only).
🟦 NOTE: In the new Email face (2.5), the **pills replace the need to open this modal** for the
common cases — this modal stays as the fallback / manual-log path and for call-context replies.

## 3.D 🟩 Modal D — Log Meeting
```
┌ Log meeting · Sunrise Home Care · Jane Doe ──────────── ✕ ┐
│ BEFORE THE MEETING                                         │
│  ○ Still finding a time                                    │
│  ○ On the calendar          → [datetime picker ▾]          │
│ AFTER THE MEETING                                          │
│  ○ Activate pilot on their behalf 🎉 (provider)            │
│  ○ Mark as Partner ★ (stakeholder)  → [evidence ▾]        │
│  ○ Done — needs more email   → notes REQUIRED              │
│  ○ Not a fit                                              │
│  ○ No-show / cancelled — rescheduling                     │
│ Notes (required for "needs more email") ________________   │
│                              [ Cancel ]  [ {dynamic} ]     │
└────────────────────────────────────────────────────────────┘
```
Submit label changes by choice: "Activate pilot" / "Mark as Partner" / "Send to Replies" /
"Close as not a fit" / "Log no-show".
🟦 **change:** "Done — needs more email" → after save, the row's Next Step shows **[Launch
post-meeting follow-up]** (Modal G). The notes captured here prefill the cadence's first email.

## 3.E 🟦 Modal E — Email-face reply composer (inline, not a pop-up)
Lives inside the drawer (2.5). One row of pills → one editable draft → one Send.

| Pill | Draft prefilled with | On Send → state |
|---|---|---|
| Interested ★ | warm note + **magic activation link** | engaged → **Awaiting Activation** (2.6) |
| Wants to meet | "send me times" + **Calendly link (tracked)** | → wants_meeting (2.8) |
| Send link | one-liner + **magic link** | → Awaiting Activation (2.6) |
| Not interested | gracious decline | closed (2.16) |
| Redirected | "could you point me to…" + capture fields | contact swapped, cold cadence stops |
| Other | blank | logs reply, cadence continues |

Composer states: **default** (pills) → **drafting** (textarea + Send) → **sending…** →
**sent ✓** (collapses back to history) / **error** (retry or Copy fallback).

## 3.F 🟦 Modal F — Cadence-Launch · Activation follow-up
```
┌ Launch activation follow-up · Sunrise Home Care ─────── ✕ ┐
│ Nudges an interested provider to finish setup. Every email │
│ is from {RA name}, carries their link, and the whole       │
│ sequence STOPS the moment they activate. Approve below.    │
│ Sends to: Jane Doe (jane@sunrise.com)                      │
│ ▸ Now     ✉ "Here's your link to get set up"            ▾ │ ← expand: subject/body
│ ▸ +2 days ✉ "Quick nudge — 2 minutes to activate"        │
│ ▸ +4 days ☎ Call: "Did you get the link? Walk you thru?" ▾ │ ← expand: script
│ ▸ +7 days ✉ "Last note — your students are ready"        │
│ 📎 magic activation link → opens Terms ready to accept.    │
│ 4 steps ready          [ Cancel ]   [ Launch follow-up 🚀]│
└────────────────────────────────────────────────────────────┘
```
🟧 only the call step appears if a phone number exists.

## 3.G 🟦 Modal G — Cadence-Launch · Post-meeting follow-up
```
┌ Launch post-meeting follow-up · Sunrise Home Care ───── ✕ ┐
│ Follows up after your meeting toward activation. RA voice, │
│ carries the link, stops on activation. {meeting notes      │
│ prefill the first email.}                                  │
│ ▸ +1 day  ✉ "Great talking today — here's your link"    ▾ │
│ ▸ +4 days ☎ Call: "Any questions before you set up?"     ▾ │
│ ▸ +8 days ✉ "Checking in — glad to help you start"       │
│ 3 steps ready          [ Cancel ]   [ Launch follow-up 🚀]│
└────────────────────────────────────────────────────────────┘
```

## 3.H 🟦 Modal H — Nudge now (single email)
```
┌ Send a nudge · Sunrise Home Care ────────────────────── ✕ ┐
│ One quick email now (doesn't start a sequence).           │
│ Subject ____________________________________              │
│ ┌ body (RA voice + magic link prefilled) ─────────────┐   │
│ └──────────────────────────────────────────────────────┘   │
│                              [ Cancel ]   [ Send nudge ]   │
└────────────────────────────────────────────────────────────┘
```

## 3.I 🟦 Modal I — Resend link (confirm)
```
┌ Resend activation link? · Sunrise Home Care ─────────── ✕ ┐
│ Sends a fresh magic link to jane@sunrise.com. The link    │
│ lands them on their board with Terms ready to accept.      │
│                              [ Cancel ]   [ Resend link ]  │
└────────────────────────────────────────────────────────────┘
```

## 3.J 🟩 Danger Zone / Stop outreach (in More details)
```
│ Stop outreach:  [Not interested] [No response]            │
│                 [Wrong contact]  [Do not contact]         │
```
Maps to mark_not_interested / mark_no_response_closed / mark_wrong_contact / mark_dnc.

---

# PART 4 — PROVIDER-FACING (the finish line)

## 4.1 🟩→🟦 Activation link landing
```
   {magic link, &activate=1}
        ▼  (silent auth — already logged in)
┌ Hire Caregivers · Texas A&M students ────────────────────┐
│ Welcome! Review your campus students below.              │
│ ┌────────────────────────────────────────────────┐      │
│ │ ACCEPT TERMS TO START YOUR FREE TRIAL            │      │ 🟦 auto-opens with &activate=1
│ │ • See full profiles & contact students           │      │
│ │ • 90-day pilot, no card required                │      │
│ │ [ Accept & start trial ]                        │      │
│ └────────────────────────────────────────────────┘      │
│ [student] [student] [student] …                          │
└────────────────────────────────────────────────────────────┘
```
🟩 board + Terms modal exist. 🟦 NEW = the `&activate=1` param that **auto-opens** Terms.

## 4.2 🟩 Accepted → Trial Active
```
│ ✓ Trial Active 🎉  — you're all set for 90 days.          │
│ (welcome banner clears; full student access unlocked)     │
```
Provider's CRM row flips to **Pilot Active** (drawer state 2.15). All cadences auto-stop.

## 4.3 🟧 EDGE — co-tenancy conflict
If the provider's directory profile is already claimed by another account, the link lands them
authed but the board shows a "this organization is already set up — contact support" notice
instead of Terms. (Already handled by the magic-link route; surfacing here for completeness.)

---

# PART 5 — CALENDLY (automatic, no admin screen)

## 5.1 🟦 invitee.created webhook
Provider books via Dr. DuBose's Calendly link → webhook → row's pending Call/Email tasks are
superseded → **Meeting card appears** (drawer state 2.11), no admin action. Correlation by
`utm_content=<outreach_id>`, fallback invitee email.

## 5.2 🟦 invitee.canceled webhook
Booking canceled → meeting card → back to **wants_meeting / awaiting_schedule** (2.8).

---

# PART 6 — EDGE & ERROR STATES (so nothing is a surprise)

| # | Scenario | Where | Behavior | Tag |
|---|---|---|---|---|
| E1 | No phone number | Call face 2.9 / cadences | call steps skipped; CTA hidden | 🟧 confirm copy |
| E2 | Reply body not yet fetched | Email face 2.5 | "Reply received — loading…" then fills | 🟦 |
| E3 | In-thread send unsupported | Email face 2.5 / composer | falls back to **Copy draft** + paste | 🟦 |
| E4 | Sequence already running | Awaiting 2.6 | Launch disabled + "running · +Nd next" + Stop | 🟦 |
| E5 | Duplicate webhook delivery | reply ingestion | idempotent — no duplicate touchpoint | 🟦 |
| E6 | utm stripped from Calendly | webhook 5.1 | fall back to invitee email match | 🟦 |
| E7 | Provider already a Client | activation link 4.3 | board shows "already set up" notice | 🟩 |
| E8 | Reply after row closed | ingestion | auto-revives the row into Emails | 🟦 |

---

# PART 7 — MASTER OUTCOME MAP (every outcome → action → result)

| Face/Modal | Outcome | Backend action(s) | Result | Tag |
|---|---|---|---|---|
| Pre-Flight | Start outreach | schedule_sequence(provider) | cold cadence runs | 🟩 |
| Call | No answer | log_call_outcome(no_answer) | back next call day | 🟩 |
| Call | Voicemail | log_call_outcome(voicemail) | → awaiting_callback | 🟩 |
| Call | Wrong number | log_call_outcome(wrong_number) | closed | 🟩 |
| Call | Promised callback | log_call_outcome(promised_callback) | → awaiting_callback | 🟩 |
| Call | Interested | log_call_outcome(connected_engaged) | → Awaiting Activation; Launch btn | 🟩→🟦 |
| Call | Meeting scheduled | mark_meeting_scheduled | → Meetings | 🟩 |
| Call | Became a Client | make_client | **Trial Active** | 🟩 |
| Call | Not interested | mark_not_interested | closed | 🟩 |
| Call | Stop comms / Archive | mark_dnc / mark_no_response_closed | closed | 🟩 |
| Email pill | Interested / Send link | classify_reply(keep_emailing) + sendReply | → Awaiting Activation; Launch btn | 🟦 |
| Email pill | Wants to meet | flag_wants_meeting + sendReply | → wants_meeting | 🟦 |
| Email pill | Already booked | mark_meeting_scheduled | → Meetings | 🟩 |
| Email pill | Not interested | classify_reply(not_interested) | closed | 🟩 |
| Email pill | Redirected | add_contact + classify_reply(keep_emailing,stop) | contact swapped | 🟩 |
| Awaiting | Launch activation follow-up | schedule_sequence(activation_followup) | cadence runs | 🟦 |
| Awaiting | Nudge now | (single send) | one email | 🟦 |
| Awaiting | Resend link | (resend magic link) | link re-sent | 🟦 |
| Meeting | Activate pilot 🎉 | make_client | **Trial Active** | 🟩 |
| Meeting | Needs follow-up | mark_meeting_followup + schedule_sequence(post_meeting) | cadence runs | 🟩→🟦 |
| Meeting | Not a fit | mark_not_interested | closed | 🟩 |
| Meeting | No-show | flag_wants_meeting(no_show) | stays in Meetings | 🟩 |
| Calendly | invitee.created | mark_meeting_scheduled + supersede | → Meetings (auto) | 🟦 |
| Calendly | invitee.canceled | (revert) | → wants_meeting | 🟦 |
| Closed | Reopen | reopen | back to active | 🟩 |

---

# PART 8 — THE THREE CADENCES (full timing + copy intent)

| | Cold `provider` 🟩 | Activation `activation_followup` 🟦 | Post-meeting `post_meeting_followup` 🟦 |
|---|---|---|---|
| Trigger | Pre-Flight launch | "Launch activation follow-up" btn | "Launch post-meeting follow-up" btn |
| Steps | Day0 ✉ · Day3 ✉+☎ · Day5 ☎ · Day7 ✉ | Now ✉ · +2 ✉ · +4 ☎ · +7 ✉ | +1 ✉ · +4 ☎ · +8 ✉ |
| Volume | 3 ✉ + 2 ☎ / 7d | 3 ✉ + 1 ☎ / 7d | 2 ✉ + 1 ☎ / 8d |
| Voice | cold intro "easy way to hire" | "you're one click away" | "great talking, let's set up" |
| Carries | flyer + program link | magic activation link | magic activation link |
| Stops on | reply / not-interested | **Trial Active** | **Trial Active** |
| Approved by | Logan (Pre-Flight) | Logan (Modal F) | Logan (Modal G) |

All three: call steps queue only if phone exists; all use the same review-and-launch UX and the
same queue/cron plumbing.

---

# PART 9 — COVERAGE MATRIX (what's built vs. what we're building)

| Area | Screen/Modal | Status |
|---|---|---|
| Lists | Prospects / Calls / Emails / Meetings / Clients | 🟩 |
| Lists | reply preview + unread dot on Emails rows | 🟦 |
| Lists | Awaiting-activation chip; needs-nudge bump | 🟦 |
| Drawer | skeleton + prospect / engagement / call / meeting / converted / closed states | 🟩 |
| Drawer | **Email face with real reply + pills + Send** (2.5) | 🟦 |
| Drawer | **Awaiting Activation state + Launch/Nudge/Resend** (2.6) | 🟦 |
| Drawer | **needs-nudge banner** (2.7) | 🟦 |
| Drawer | dual send buttons on wants_meeting (2.8) | 🟦 |
| Drawer | **Launch post-meeting button** on needs_followup (2.12) | 🟦 |
| Modals | Pre-Flight / Log Call / Reply Classifier / Log Meeting | 🟩 |
| Modals | Pre-Flight shows phone days too | 🟦 (minor) |
| Modals | **Cadence-Launch · activation** (F) | 🟦 |
| Modals | **Cadence-Launch · post-meeting** (G) | 🟦 |
| Modals | **Nudge now** (H) · **Resend link** (I) | 🟦 |
| Provider | board + Terms modal | 🟩 |
| Provider | **`&activate=1` auto-open Terms** | 🟦 |
| Calendly | invitee.created / canceled webhook | 🟦 |
| Reply | **Smartlead reply-ingestion webhook** | 🟦 |
| Reply | **in-thread send (or copy fallback)** | 🟦 |
| Cadence | activation + post-meeting registry entries + copy | 🟦 |

---

# PART 10 — WHAT'S NOT IN THIS BUILD (explicitly out of scope)

- 🟥 No new Tasks tab (post-meeting work surfaces as Call/Email, per your decision).
- 🟥 No "finding a time" state inside Meetings (stays in Emails/Replies).
- 🟥 No new database tables / no new backend action verbs / no new touchpoint types.
- 🟥 No changes to directory claim paths or the provider-reviews Stripe paywall (guardrails).
- 🟥 No SMS / texting channel (email + call only).

---

# PART 13 — DECISIONS STILL OPEN (🟧)

1. **E1 copy** — when there's no phone, what should the Call face say? (Default proposed:
   "No phone on file — add one or switch to email.")
2. **Nudge vs. sequence default** — confirm the **Nudge now** single-email is worth building
   alongside the full activation sequence, or is the sequence enough for v1?
3. **Needs-nudge threshold** — 4 days (matches existing STALE_DAYS) or a different window for
   warm/awaiting-activation rows?
4. **Reply Classifier vs. pills overlap** — once the Email face has pills (2.5), do you want to
   *keep* the old Reply Classifier modal as a manual fallback, or retire it to avoid two ways to
   do the same thing? (Recommend: keep for call-context + manual logging.)

Everything else is decided. Tags above are the contract: 🟩 untouched, 🟦 we build, 🟧 we
confirm first.

# MedJobs Drawers, Outcome Modals & Cadence-Launch — Final Design

Status: **DESIGN v2 — for Logan review.** No build yet.
Created: 2026-06-08
Companion to: `plans/medjobs-post-outreach-workflow.md` (the 6-phase build plan).
Reconciles with existing code: `NextStepCard.tsx`, `ReplyClassifierModal.tsx`, `LogCallOutcomeModal.tsx`, `LogMeetingModal.tsx`, `PreFlightReviewModal.tsx`, `cadence.ts`.

---

## 0. Decisions locked (Logan, 2026-06-08)

1. **Cadence timing** — author's call; reasonable, non-aggressive (spelled out in §8).
2. **Voice** — every cadence email is written **as the Research Assistant** and **approved by
   Logan before it sends.** The review-and-launch module *is* the approval gate: nothing leaves
   the building until Logan clicks **Launch**. Signature block carries the RA's name + Dr.
   DuBose's Calendly link.
3. **"Interested" does NOT auto-fire a sequence.** It surfaces an **optional "Launch activation
   follow-up" button** on the row. Admin clicks it when ready → review-and-launch. (Stay in
   control; no surprise sequences.)
4. **Post-meeting cadence is in scope now** (email + call).

---

## 1. The one thing everything points at

> **Provider clicks their magic link → lands authenticated on the campus-filtered Hire
> Caregivers board → accepts the combined Terms → Trial Active.**

If a button doesn't move a provider toward that click, it doesn't belong in the drawer.

---

## 2. Mental model (read first)

Three pieces:

- **The Drawer** — one panel that opens when you click a provider. Same skeleton always; only
  the **"Next Step" box** changes based on what the provider is doing right now. The "Call
  drawer / Email drawer / Meeting drawer" are three **faces** of this one drawer, not separate
  screens.
- **The Outcome Modal ("Log …")** — the pop-up after you click the Next Step's primary button.
  You pick *what happened*; the system advances the provider's state.
- **The Cadence-Launch Module** — when an outcome means "start a *sequence* of follow-ups,"
  this review screen shows **every queued email and call with its timing**, lets you **edit**,
  and ends in one **Launch** button. (This is your existing Pre-Flight modal, generalized.)

```
 Click provider row
        │
        ▼
 ┌─────────────┐   click "Log …"   ┌──────────────┐
 │   DRAWER    │ ────────────────▶ │ OUTCOME MODAL │
 │ (3 faces)   │                   └──────┬────────┘
 └─────────────┘            one-off ──────┤────▶ state advances, done
                            a sequence ───┘────▶ ┌────────────────────┐
                                                 │ CADENCE-LAUNCH      │
                                                 │ review → edit → 🚀  │
                                                 └────────────────────┘
```

---

## 3. Where the rows live (the tabs) — context sketch

The provider rows you click into live in tabbed boards (already built). Relevant tabs:

```
┌ MedJobs · Texas A&M ─────────────────────────────────────────┐
│  [ Prospects ] [ In Outreach ] [ Calls ] [ Replies ] [ Meetings ] [ Clients ]
│                                              ▲
│  Sunrise Home Care      Awaiting activation · nudge ready  ▸  │  ← click opens drawer
│  Bluebonnet Caregivers  Replied 2h ago · unread           ▸  │
│  Aggieland Home Health  Call due today                    ▸  │
└──────────────────────────────────────────────────────────────┘
```

- **Calls** — rows with a phone step due → drawer opens to the **Call face**.
- **Replies** — rows where a provider replied / awaiting activation → **Email face**.
- **Meetings** — real booked meetings only → **Meeting face**.

Nothing changes about the tabs themselves; this is just so you can see where a click starts.

---

## 4. The Drawer skeleton (all faces share this)

```
┌── Sunrise Home Care · Texas A&M · Provider ───────────  ✕ ─┐
│                                                            │
│  ① NEXT STEP   ← the only part that changes per face       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  one-line WHY  +  DO THIS NOW  +  primary [ Log … ]    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ② CONTEXT (one line)  link sent ✓ · opened 2× · not active│
│                                                            │
│  ③ TIMELINE (collapsible)  every email/call/reply so far  │
│                                                            │
│  ④ More details ▾   (contact info, danger zone)           │
└────────────────────────────────────────────────────────────┘
```

**Admin manual — the skeleton:**
- **What you see:** the provider's name + campus up top, then "what to do next" in a single
  box, a one-line status, the full history, and rarely-needed details tucked away.
- **Why it's shaped this way:** the thing you act on is always at the top; you never scroll to
  find the button. History is there when you want it, hidden when you don't.

---

## 5. The CALL face

### Sketch
```
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [CALL]  Make the call, use the script, log it.      │ │
│  │ 📞 (979) 555-0142 · Jane Doe (Owner)               │ │
│  │ ▸ Day 3 script  "Hi Jane, did you get our email…"   │ │
│  │                                                    │ │
│  │ [ Log call outcome → ]      [ Log reply ]          │ │
│  └────────────────────────────────────────────────────┘ │
│  CONTEXT  link sent ✓ · opened 2× · not activated        │
```

### Admin manual
- **What you see:** a one-tap phone number, who you're calling, and today's script (click to
  expand). The CONTEXT line tells you whether they already have/clicked their activation link —
  so you know if this is a cold nudge or a "you're almost there" call.
- **What the Next Step tells you:** "Make the call, use the script, log it."
- **What you do:** tap the number, talk, then click **Log call outcome**. (If they actually
  emailed you back instead, use the secondary **Log reply**.)
- **Why:** the three things a caller needs — number, who, what to say — are all in front of you,
  and there's exactly one button that matters.

### Outcome modal — "Log call outcome"
```
┌ Log call outcome · Sunrise Home Care · Jane Doe ─────── ✕ ┐
│ DIDN'T REACH THEM                                         │
│  ○ No answer            returns on next call day          │
│  ○ Left voicemail       → Replies, awaiting callback      │
│  ○ Wrong number         closes the row                    │
│ REACHED THEM                                              │
│  ○ Promised callback    → Replies, awaiting callback      │
│  ○ Interested ★         stops cold cadence; offer to      │
│                          launch activation follow-up      │
│  ○ Meeting scheduled    → Meetings  [date/time ▾]         │
│  ○ Became a Client ✓    → Trial Active (you activate)     │
│  ○ Not interested       closes the row                    │
│ OTHER                                                     │
│  ○ Stop communications  /  ○ Archive — no response        │
│ Notes ____________________________________                │
│                                  [ Cancel ] [ Log ]       │
└───────────────────────────────────────────────────────────┘
```

### What each outcome does
| Outcome | Result | To Trial Active? |
|---|---|---|
| No answer | call done; back on next call day | keeps cadence alive |
| Left voicemail | → Replies, awaiting callback; calls still fire | keeps alive |
| Wrong number | closes row | no |
| Promised callback | → Replies, awaiting callback | keeps warm |
| **Interested ★** | stops cold cadence; row shows **"Launch activation follow-up"** button | **starts activation push** |
| Meeting scheduled | → Meetings (optional date) | path to activate |
| **Became a Client ✓** | **Trial Active**, terms accepted on their behalf | **finish line** |
| Not interested | closes row, cancels tasks | no |
| Stop comms / Archive | terminal closeouts | no |

**Change vs. today:** "Interested" stops the cold cadence and then surfaces the optional
**Launch activation follow-up** button (per decision #3) instead of going quiet.

---

## 6. The EMAIL face (highest-volume; most new capability)

### Sketch
```
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✉ THEY REPLIED — 2h ago · jane@sunrise.com          │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ "Thanks for reaching out — this sounds useful. │   │ │
│  │ │  How does it work and what does it cost?"      │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │ Reply:  [Interested ★] [Wants to meet] [Send link] │ │
│  │         [Not interested] [Redirected] [Other]      │ │
│  │ ┌─ editable draft (prefilled from the pill) ─────┐  │ │
│  │ │ Hi Jane — great to hear from you. Here's your   │  │ │
│  │ │ link to see the students near you and get set   │  │ │
│  │ │ up: {magic link}. Happy to answer any questions.│  │ │
│  │ │ — {RA name}, Research Assistant, Olera           │  │ │
│  │ └────────────────────────────────────────────────┘  │ │
│  │ [ Send reply → ]   (sends in-thread via Smartlead)  │ │
│  └────────────────────────────────────────────────────┘ │
│  CONTEXT  link sent ✓ · opened 2× · awaiting activation  │
```

### Admin manual
- **What reply text is shown:** the provider's *actual* incoming message, quoted at the top
  (pulled in automatically by the Smartlead webhook). You're answering what they said, not a
  blank box.
- **What templates are available:** intent **pills** — *Interested ★ · Wants to meet · Send
  link · Not interested · Redirected · Other*. Click one → an **editable draft appears**,
  already in the RA's voice and signature.
- **How you reply:** tweak the draft if you want → **Send reply** → it goes out in the same
  email thread through Smartlead. You never leave the dashboard.
  *(If the Smartlead send-plumbing turns out not to support in-thread send, the exact same draft
  becomes copy-ready and you paste it into Smartlead — the screen is identical, only the button
  changes. This is the only thing the optional Phase-0 check would settle.)*
- **What happens after sending:** the reply is saved to the timeline and the pill's intent
  advances the provider (table below). For **Interested / Send link**, the row then shows the
  **Launch activation follow-up** button.
- **Why:** reading their words + one-click intent + an editable draft is the fastest possible
  "answer a warm lead" loop, and it keeps every reply logged automatically.

### Outcome — the reply pills
| Pill | Sends | State effect | Then |
|---|---|---|---|
| **Interested ★** | draft w/ **magic activation link** | → Awaiting Activation | **shows Launch activation follow-up** |
| **Wants to meet** | dual: "send me times" **+** Dr. DuBose Calendly (tracked) | → Meetings/awaiting-schedule | human books |
| Already booked | (no send) records meeting | → Meetings | — |
| **Send link** | light note + magic link | → Awaiting Activation | shows Launch button |
| Not interested | gracious close | closes row | — |
| Redirected | asks for right contact, captures it | swaps contact, stops cold cadence | — |
| Other | blank draft | logs reply, cadence continues | — |

---

## 7. The MEETING face

### Sketch
```
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 Meeting booked · Tue Jun 10, 2:00 PM             │ │
│  │ Prep: their campus students are pre-loaded; have    │ │
│  │ the activation link ready to send live on the call. │ │
│  │                                                    │ │
│  │ [ Log meeting → ]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│  CONTEXT  booked via Calendly · link not yet sent        │
```

### Admin manual
- **What you see:** the date/time and a short prep line. (Meetings tab = **real booked meetings
  only**; "still finding a time" stays in Replies so this tab never lies about what's scheduled.)
- **Before the meeting:** have the activation link ready to drop in chat.
- **After the meeting:** click **Log meeting** and pick the outcome.

### Outcome modal — "Log meeting"
```
┌ Log meeting · Sunrise Home Care · Jane Doe ──────────── ✕ ┐
│  ○ Held → activate pilot 🎉   → Trial Active (you activate)│
│  ○ Held → needs follow-up     → launch post-meeting cadence│
│  ○ Held → not a fit           closes row                  │
│  ○ No-show / reschedule       stays in Meetings to re-book │
│  Notes ____________________________________               │
│                                  [ Cancel ] [ Save ]      │
└───────────────────────────────────────────────────────────┘
```

### What each outcome does
| Outcome | Result | To Trial Active? |
|---|---|---|
| **Held → activate 🎉** | **Trial Active**, terms accepted on their behalf | **finish line** |
| **Held → needs follow-up** | opens **Cadence-Launch (post-meeting)** | **drives to activate** |
| Held → not a fit | closes row | no |
| No-show / reschedule | stays in Meetings, ready to re-book | back to scheduling |

**Change vs. today:** "needs more email" becomes "needs follow-up" and opens the reviewed
post-meeting cadence (email + call) instead of silently bouncing to Replies.

---

## 8. The CADENCE-LAUNCH module (the shared new piece)

Generalized from `PreFlightReviewModal`. Same look, now also shows **calls + scripts** and
serves the two new cadences. This is **also the approval gate** (decision #2): the emails are
drafted in the RA's voice, and **nothing sends until you read and click Launch.**

### Sketch
```
┌ Launch activation follow-up · Sunrise Home Care ─────── ✕ ┐
│ Nudges an interested provider to finish setup. Every email │
│ is from {RA name} and carries their activation link. Stops │
│ automatically the moment they activate.                    │
│ Sends to: Jane Doe (jane@sunrise.com)                      │
│                                                          │
│  ▸ Now     ✉  "Here's your link to get set up"          ▾ │
│  ▸ +2 days ✉  "Quick nudge — 2 minutes to activate"      │
│  ▸ +4 days ☎  Call script: "Hi Jane, did you get the     │
│                 link I sent? Happy to walk you through it" │
│  ▸ +7 days ✉  "Last note — your campus students are ready"│
│                                                          │
│  (expand any row to edit subject / body / call script)    │
│  📎 magic activation link → opens Terms ready to accept    │
├────────────────────────────────────────────────────────┤
│  4 steps ready              [ Cancel ]  [ Launch 🚀 ]     │
└───────────────────────────────────────────────────────────┘
```

### Admin manual
- **What you see:** the whole follow-up plan as a list — emails **and** calls — each stamped
  with when it fires. Email cards expand to edit wording; call cards expand to edit the script.
- **What you do:** read it (this is your approval), tweak anything, click **Launch**.
- **What happens:** the first step fires now (or lands on today's call list); the rest queue
  and the cron sends them on schedule. The whole sequence **auto-stops the instant they hit
  Trial Active** — no awkward "you're already a customer" emails.
- **Why a review screen instead of auto-send:** these go out under our name to real businesses.
  You approve the plan once, then it runs itself. Same trust model as Pre-Flight.

### Cadence A — Activation follow-up (`activation_followup`)
Context: *interested, hasn't activated.* Reasonable, link-forward, **3 emails + 1 call / 7 days.**
| When | Channel | Gist |
|---|---|---|
| Now | ✉ email | "Here's your link to see your campus students and get set up." |
| +2 days | ✉ email | "Quick nudge — it takes ~2 minutes; here's the link again." |
| +4 days | ☎ call | "Did you get the link? Happy to walk you through it now." |
| +7 days | ✉ email | "Last note — your campus students are ready when you are." |

### Cadence B — Post-meeting follow-up (`post_meeting_followup`)
Context: *we met, they're warm.* **2 emails + 1 call / 8 days.**
| When | Channel | Gist |
|---|---|---|
| +1 day | ✉ email | "Great talking today — here's your link to get started." (recaps the call) |
| +4 days | ☎ call | "Following up on our chat — any questions before you set up?" |
| +8 days | ✉ email | "Checking in — still glad to help you get the first shifts filled." |

Both: email-only steps skip nothing; **call steps only queue if we have a phone number**
(same rule the cold cadence uses today). Both carry the **`&activate=1` magic link** so the
provider lands one tap from accepting Terms.

---

## 9. The "Awaiting Activation" row + the optional Launch button

When a provider is interested but hasn't activated, the row's Next Step looks like this:

```
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ★ Interested — not activated yet.                   │ │
│  │ They got the link; waiting on them to accept Terms. │ │
│  │                                                    │ │
│  │ [ Launch activation follow-up ]   [ Nudge now ]    │ │
│  │ [ Resend link ]                                    │ │
│  └────────────────────────────────────────────────────┘ │
│  CONTEXT  link sent 3d ago · opened 2× · no accept yet   │
```

**Admin manual:**
- **What you see:** a clear "interested but not across the line yet" state, with how long it's
  been and whether they've opened the link.
- **What you do:** click **Launch activation follow-up** to set the reviewed 7-day sequence
  running, or **Nudge now** for a single manual email, or **Resend link** if they lost it.
- **Why optional (not automatic):** per your call — you decide when a sequence starts; the
  system never surprises a provider with emails you didn't approve.

This whole state disappears automatically when they accept Terms (→ Trial Active).

---

## 10. Where the link lands (the finish line UI)

```
   magic activation link (&activate=1)
        │
        ▼
┌ Hire Caregivers · Texas A&M students ────────────────────┐
│  Welcome! Review your campus students below.              │
│  ┌──────────────────────────────────────────────────┐    │
│  │  ACCEPT TERMS TO START YOUR FREE TRIAL        ✕?  │    │  ← auto-opens
│  │  • See full student profiles & contact them       │    │
│  │  • 90-day pilot, no card required                 │    │
│  │  [ Accept & start trial ]                         │    │
│  └──────────────────────────────────────────────────┘    │
│  [student card] [student card] [student card] …          │
└────────────────────────────────────────────────────────────┘
        │ accept
        ▼  Trial Active 🎉  → drawer shows "Pilot Active · 90 days left"
```

**Admin manual:** the provider clicks any link we send → they're already logged in (silent
auth), looking at their campus's students, with the Terms box open. One tap = **Trial Active**,
and their row flips to the green "Pilot Active" state. That click is the entire point of every
drawer and cadence above it.

---

## 11. Master outcome → action → result map

Everything maps to an **existing** backend action (no new verbs).

| Face | Outcome | Backend action(s) | Result |
|---|---|---|---|
| Call | Interested | `log_call_outcome(connected_engaged)` → show Launch button | Awaiting Activation |
| Call | Meeting scheduled | `mark_meeting_scheduled` | → Meetings |
| Call | Became a Client | `make_client` | **Trial Active** |
| Call | No answer / VM / callback | `log_call_outcome(...)` | cadence continues |
| Call | Not interested / wrong # | `mark_not_interested` / `log_call_outcome(wrong_number)` | closed |
| Email | Interested / Send link | `classify_reply(keep_emailing)` + `sendReply` → show Launch button | Awaiting Activation |
| Email | Wants to meet | `flag_wants_meeting` + `sendReply`(dual) | → Replies/Meetings |
| Email | Already booked | `mark_meeting_scheduled` | → Meetings |
| Email | Not interested | `classify_reply(not_interested)` | closed |
| Email | Redirected | `add_contact` + `classify_reply(keep_emailing, stop_cadence)` | contact swapped |
| Awaiting | Launch activation follow-up | `schedule_sequence(activation_followup)` | reviewed cadence runs |
| Meeting | Held → activate | `make_client` | **Trial Active** |
| Meeting | Held → follow-up | `mark_meeting_followup` → `schedule_sequence(post_meeting_followup)` | reviewed cadence runs |
| Meeting | Not a fit | `mark_not_interested` | closed |
| Meeting | No-show | `flag_wants_meeting(no_show)` | stays in Meetings |
| Calendly webhook | invitee.created | `mark_meeting_scheduled` + supersede call/email tasks | → Meetings (auto) |

---

## 12. New vs. existing (the delta you're approving)

**Exists, kept (refine copy/labels only):** the unified drawer + Next Step box; all three Log
modals and their groupings; the Pre-Flight review-and-launch UX and the queue/cron plumbing;
`make_client → Trial Active`; Calendly-aware meeting states.

**New:**
1. Real reply text in the Email face (Smartlead webhook). *(Phase 1)*
2. Reply pills + editable draft + Send. *(Phase 2)*
3. Cadence-Launch module = Pre-Flight generalized to take a cadence key + render call/script
   steps. *(Phase 3)*
4. Two new cadences in `OUTREACH_DAYS_BY_TYPE`: `activation_followup`, `post_meeting_followup`,
   with RA-voiced copy. *(Phases 3 & 5)*
5. "Awaiting Activation" row state + optional **Launch activation follow-up / Nudge / Resend**
   buttons. *(Phase 3)*
6. The `&activate=1` link variant (Terms auto-open). *(Phase 3)*
7. Calendly webhook auto-creates the Meeting card + clears stale call/email work. *(Phase 4)*
8. Action-first polish across all three faces. *(Phase 6)*

**Discipline kept:** no new dispatcher actions, no new touchpoint types, no new tables — new
cadences are config + copy; webhooks are new routes reusing existing handlers.

---

## 13. Build sequencing (unchanged from the build plan)

Phase 1 (reply text) → 2 (reply + Send) → 3 (Cadence-Launch + activation cadence + Awaiting
state + `&activate=1`) → 4 (Calendly) → 5 (post-meeting cadence) → 6 (polish). Each phase is one
revertable PR, typecheck clean, staging → main per the workflow. Phase 0 (Smartlead send
spike) skipped per Logan unless Phase 2 hits the send-plumbing wall.

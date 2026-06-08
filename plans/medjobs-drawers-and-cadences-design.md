# MedJobs Drawers, Outcome Modals & Cadence-Launch — Design (pre-build)

Status: **DESIGN — for Logan review.** No build yet.
Created: 2026-06-08
Companion to: `plans/medjobs-post-outreach-workflow.md` (the 6-phase build plan).
Reconciles with existing code: `NextStepCard.tsx`, `ReplyClassifierModal.tsx`, `LogCallOutcomeModal.tsx`, `LogMeetingModal.tsx`, `PreFlightReviewModal.tsx`, `cadence.ts`.

---

## 0. The one thing everything points at

Every drawer, every outcome, every cadence has exactly one finish line:

> **Provider clicks their magic link → lands authenticated on the campus-filtered Hire Caregivers board → accepts the combined Terms → Trial Active.**

If an action doesn't move a provider toward that click, it shouldn't be in the drawer.

---

## 1. Mental model (read this first)

Three concepts, and how they fit together:

**A) The Drawer** — one panel that opens when you click a provider row. It always has the
same skeleton; only the **Next Step** box changes depending on what the provider is doing.
- When a *call* is due → it shows its **Call face**.
- When you're working a *reply* → its **Email face**.
- When a *meeting* exists → its **Meeting face**.
- These are not three separate screens. Same drawer, same history below, different "do this now."

**B) The Outcome Modal ("Log …")** — the small pop-up you get when you click the primary
button in the Next Step box ("Log call outcome", "Log reply", "Log meeting"). You pick *what
happened*; the system advances the provider's state. These already exist and are good — we
refine them, we don't replace them.

**C) The Cadence-Launch Module (NEW, generalized from Pre-Flight)** — when an outcome means
"now start a *sequence* of follow-ups" (not a one-off), the Outcome Modal hands off to a
review screen that shows **every queued email and call, with timing**, lets you **edit**, and
ends in **one Launch button**. This is the same UX as today's "Confirm outreach plan" /
Pre-Flight modal — just reused for two new contexts.

```
  Row click ──▶ DRAWER ──▶ Next Step box ──▶ [Log …] ──▶ OUTCOME MODAL
                                                              │
                       outcome is a one-off  ────────────────┤──▶ done, state advances
                       outcome starts a sequence ────────────┘──▶ CADENCE-LAUNCH MODULE
                                                                      (review → edit → Launch)
```

**Why this matters:** today, an "Interested" outcome just *stops* the cold cadence and leaves
the provider sitting there. Your instinct is right — interested-but-not-activated is exactly
where we should be launching a *purpose-built* follow-up sequence, reviewed before it fires.

---

## 2. The Cadence-Launch Module (the new shared piece)

This is a generalization of `PreFlightReviewModal`. Today that modal is hardwired to the
cold-outreach cadence and shows **emails only**. We make it accept a **cadence key** and also
render **call steps with their scripts**.

### What the admin sees
```
┌──────────────────────────────────────────────────────────┐
│  Launch activation follow-up                          ✕  │
│  Sunrise Home Care · Texas A&M                            │
│  These follow-ups nudge an interested provider to finish  │
│  setup. They stop automatically the moment they activate. │
├──────────────────────────────────────────────────────────┤
│  Sends to: Jane Doe (jane@sunrise.com)                    │
│                                                          │
│  ▸ Now    ✉  "Here's your link to get set up"            │
│  ▸ +2 days ✉  "Quick nudge — 2 min to activate"         │
│  ▸ +4 days ☎  Call script: "Did you get the link…"      │
│  ▸ +6 days ✉  "Last call on your campus students"        │
│                                                          │
│  (click any row to expand + edit subject / body / script)│
│                                                          │
│  📎 Each email carries the provider's magic activation    │
│     link → opens Terms ready to accept.                   │
├──────────────────────────────────────────────────────────┤
│  4 steps ready          [ Cancel ]   [ Launch follow-up ] │
└──────────────────────────────────────────────────────────┘
```

### How it works (admin manual)
- **What you see:** the whole follow-up plan as a list of cards — emails *and* calls — each
  stamped with when it fires (Now / +2d / +4d …).
- **What you do:** read it, expand any card to tweak the wording or the call script (one-off
  edit, same as Pre-Flight today), then click **Launch**.
- **What happens:** the first step fires now (or is queued for today's call list); the rest
  are queued and the cron picks them up — identical plumbing to the cold cadence. The whole
  sequence **auto-stops** the instant the provider hits Trial Active.
- **Calls** land in the Calls tab on their day with the script attached (exactly like cold
  calls do now). **Emails** send through the same pipeline (Smartlead/Resend) the cold
  cadence uses.

### Reuse note (semi-technical)
- `PreFlightReviewModal` already loops `OUTREACH_DAYS_BY_TYPE[key]` and renders email steps.
  We (a) let it also render `channel: "phone"` steps (show the script, not a subject/body),
  and (b) add two new keys to `OUTREACH_DAYS_BY_TYPE`: `activation_followup`,
  `post_meeting_followup`. No new dispatcher action — it submits through the same
  `schedule_sequence` path. (Discipline G2/G7 preserved.)

---

## 3. The Call drawer (face)

### Sketch
```
┌── Sunrise Home Care · Texas A&M · Provider ──────────────┐
│                                                          │
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [CALL]  Make the call, use the script, log it.      │ │
│  │ 📞 (979) 555-0142 · Jane Doe                        │ │
│  │ ▸ Day 3 script  "Hi Jane, did you get our email…"   │ │
│  │                                                    │ │
│  │ [ Log call outcome → ]   [ Log reply ]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  CONTEXT  link sent ✓ · opened 2× · not activated        │
│  ── timeline (collapsible) ──                            │
│  More details ▾                                          │
└──────────────────────────────────────────────────────────┘
```

### Admin manual
- **What you see:** the phone number (one tap to dial), who you're calling, and the script
  for whatever day the cadence is on.
- **What the Next Step tells you:** "Make the call, use the script, log it." Plus a context
  line showing whether they've already gotten/clicked their activation link — so you know if
  this is a cold nudge or a "you're so close, let's finish" call.
- **What script is shown:** the script attached to today's queued call (set when the cadence
  was launched).
- **What you do:** call, then click **Log call outcome**.

### Outcomes (the Log Call modal) and what each does
Grouped exactly as today — *Didn't reach them / Reached them / Other*:

| Outcome | What it does | Funnels to Trial Active? |
|---|---|---|
| No answer | Marks this call done; row returns on next call day | keeps cadence alive |
| Left voicemail | Row → Replies as "awaiting callback"; future calls still fire | keeps cadence alive |
| Wrong number | Closes the row | no |
| Promised callback | → engaged; row → Replies awaiting callback | keeps warm |
| **Interested** ★ | Stops the cold cadence **and opens the Cadence-Launch Module for `activation_followup`** | **YES — starts activation push** |
| Meeting scheduled | Row → Meetings (optionally with date) | path to activate |
| **Became a Client ✓** | `make_client` → **Trial Active**, terms accepted on their behalf | **YES — finish line** |
| Not interested | Closes the row, cancels pending tasks | no |
| Stop communications / Archive | Terminal closeouts | no |

**The one change vs. today:** "Interested" no longer just stops and goes quiet — it launches
the activation follow-up (reviewed first). Everything else is unchanged.

---

## 4. The Email drawer (face)

This is the highest-volume face and gets the most new capability (Phases 1–3).

### Sketch
```
┌── Sunrise Home Care · Texas A&M · Provider ──────────────┐
│                                                          │
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✉ THEY REPLIED — 2h ago                             │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ "Thanks for reaching out — this sounds useful.│   │ │
│  │ │  How does it work / what does it cost?"        │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │ Reply with:  [Interested ★] [Wants to meet]        │ │
│  │              [Send link] [Not interested] [Other]  │ │
│  │                                                    │ │
│  │ ┌─ editable draft (prefilled from the pill) ────┐  │ │
│  │ │ Hi Jane — great to hear from you. Here's a     │  │ │
│  │ │ link to see the students near you and get set  │  │ │
│  │ │ up: {magic link}. Happy to answer questions.   │  │ │
│  │ └────────────────────────────────────────────────┘  │ │
│  │ [ Send reply → ]   (sends in-thread via Smartlead)  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  CONTEXT  link sent ✓ · opened 2× · awaiting activation  │
│  ── timeline ──   More details ▾                         │
└──────────────────────────────────────────────────────────┘
```

### Admin manual
- **What reply text is shown:** the provider's actual incoming reply (pulled in by the
  Smartlead webhook), in a quoted box at the top — so you respond to what they *said*, not a
  generic prompt.
- **What response templates are available:** quick **pills** that map to intent —
  *Interested ★*, *Wants to meet*, *Send link*, *Not interested*, *Other (blank)*. Clicking a
  pill drops an **editable draft** below.
- **How you reply:** edit the draft if needed → **Send reply** → it goes out in the same email
  thread through Smartlead (no leaving the dashboard). *(If the Phase-0 plumbing check fails,
  the same draft becomes copy-ready and you paste it into Smartlead — the design doesn't change,
  only the send button's behavior.)*
- **What happens after sending:** the reply is logged on the timeline, and the pill's intent
  advances the provider's state (below).

### Outcomes (the reply pills) and what each does

| Pill | What it sends | State effect | Cadence? |
|---|---|---|---|
| **Interested ★** | Draft with the **magic activation link** | → **Awaiting Activation** | **Opens Cadence-Launch (`activation_followup`)** |
| **Wants to meet** | Dual: "send me times & I'll book" **+** Dr. DuBose's Calendly link (w/ tracking) | → Meetings / awaiting-schedule | no sequence (human handles booking) |
| Already booked | (no send) records the meeting | → Meetings | no |
| **Send link** | Just the magic link, light copy | → Awaiting Activation | optional activation cadence |
| Not interested | Gracious close | Closes row | no |
| Redirected | Asks for the right contact; captures it | swaps contact, stops cold cadence | no |
| Other | Blank draft | logs reply, cold cadence continues | no |

**The funnel:** *Interested* and *Send link* both put the magic link in the provider's hands
**and** start the reviewed activation cadence so they don't stall. That's the core loop.

---

## 5. The Meeting drawer (face)

### Sketch
```
┌── Sunrise Home Care · Texas A&M · Provider ──────────────┐
│  NEXT STEP                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 Meeting booked · Tue Jun 10, 2:00pm              │ │
│  │ Prep: their campus students are pre-loaded; have    │ │
│  │ the activation link ready to send live.             │ │
│  │                                                    │ │
│  │ [ Log meeting → ]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│  CONTEXT  booked via Calendly · link not yet sent        │
│  ── timeline ──   More details ▾                         │
└──────────────────────────────────────────────────────────┘
```

### Admin manual
- **What meeting details are shown:** date/time and a short prep line. (Meetings tab =
  **real scheduled meetings only** — "still finding a time" lives in Replies, not here.)
- **What you do before:** have the activation link ready to drop in chat during the call.
- **What you do after:** click **Log meeting**, pick the outcome.

### Outcomes (the Log Meeting modal — simplified) and what each does

| Outcome | What it does | Funnels to Trial Active? |
|---|---|---|
| **Held → activate pilot 🎉** | `make_client` → **Trial Active** (terms accepted on their behalf) | **YES — finish line** |
| **Held → needs follow-up** | **Opens Cadence-Launch (`post_meeting_followup`)** — reviewed email+call sequence | **YES — drives to activate** |
| Held → not a fit | Closes row as not interested | no |
| No-show / reschedule | Keeps row in Meetings, ready to re-book | back to scheduling |

**The one change vs. today:** "Done — needs more email" becomes "needs follow-up" and opens
the reviewed **post-meeting cadence** (email *and* call) instead of silently bouncing the row
to Replies. The post-meeting copy is its own voice — "great talking today, here's the link to
get started," not the cold-intro copy.

---

## 6. The three cadences, side by side

| | **Initial (cold)** `provider` | **Activation** `activation_followup` (NEW) | **Post-meeting** `post_meeting_followup` (NEW) |
|---|---|---|---|
| Trigger | Admin launches from Pre-Flight | "Interested" reply/call outcome | "Held → needs follow-up" meeting outcome |
| Context | They've never heard from us | They're interested, haven't activated | We've met, they're warm |
| Steps | 3 emails + 2 calls / 7d | ~3 emails + 1 call (Now/+2/+4/+6) | email + call (+1/+4/+8) |
| Voice | Cold intro, "easy way to hire" | "you're one click away," link-forward | "great talking, let's get you set up" |
| Every step carries | flyer + program link | **magic activation link** | **magic activation link** |
| Auto-stops on | reply / not-interested | **Trial Active** | **Trial Active** |
| Reviewed before launch | ✓ (Pre-Flight) | ✓ (Cadence-Launch) | ✓ (Cadence-Launch) |

All three use the **same review-and-launch module** and the **same queue/cron plumbing**.
The only differences are the copy and the timing rows in `OUTREACH_DAYS_BY_TYPE`.

---

## 7. Master outcome → action → result map

This is the single source of truth for "what does each outcome do." Everything maps to an
**existing** backend action (no new dispatcher verbs).

| Where | Outcome | Backend action(s) | Result |
|---|---|---|---|
| Call | Interested | `log_call_outcome(connected_engaged)` → **Cadence-Launch** | Awaiting Activation + activation cadence |
| Call | Meeting scheduled | `mark_meeting_scheduled` | → Meetings |
| Call | Became a Client | `make_client` | **Trial Active** |
| Call | No answer / VM / callback | `log_call_outcome(...)` | cadence continues |
| Call | Not interested / wrong # | `mark_not_interested` / `log_call_outcome(wrong_number)` | closed |
| Email | Interested / Send link | `classify_reply(keep_emailing)` + `sendReply` → **Cadence-Launch** | Awaiting Activation + activation cadence |
| Email | Wants to meet | `flag_wants_meeting` + `sendReply`(dual) | → Replies/Meetings |
| Email | Already booked | `mark_meeting_scheduled` | → Meetings |
| Email | Not interested | `classify_reply(not_interested)` | closed |
| Email | Redirected | `add_contact` + `classify_reply(keep_emailing, stop_cadence)` | contact swapped |
| Meeting | Held → activate | `make_client` | **Trial Active** |
| Meeting | Held → follow-up | `mark_meeting_followup` → **Cadence-Launch** | post-meeting cadence |
| Meeting | Not a fit | `mark_not_interested` | closed |
| Meeting | No-show | `flag_wants_meeting(no_show)` | stays in Meetings |
| Calendly webhook | invitee.created | `mark_meeting_scheduled` + supersede call/email tasks | → Meetings (auto) |

---

## 8. How it all reaches Trial Active (the activation link)

The magic activation link is the connective tissue. Two variants:
- **Standard** (cold cadence): link → board (campus-filtered) + welcome banner.
- **Activation** (`&activate=1`, used by activation + post-meeting cadences and the
  Interested/Send-link replies): link → board → **Terms modal auto-opens, ready to accept** →
  accept → **Trial Active**.

So no matter which path a provider takes — cold email reply, a call, or a meeting — the moment
they're "interested," they get a link that lands them one tap from accepting Terms, and a
reviewed follow-up sequence keeps nudging that single tap until it happens.

---

## 9. What's NEW vs. what already exists (the delta you're approving)

**Already exists, unchanged in spirit (we refine copy/labels only):**
- The one unified drawer + stage-driven Next Step box.
- All three Log modals (Call / Reply / Meeting) and their outcome groupings.
- The Pre-Flight review-and-launch UX and the queue/cron plumbing.
- `make_client` → Trial Active; Calendly-aware meeting states.

**New (what this design adds):**
1. **Real reply text** in the Email face (Smartlead webhook). *(Phase 1)*
2. **Reply pills + editable draft + Send** in the Email face. *(Phase 2)*
3. **Cadence-Launch Module** generalized from Pre-Flight to (a) accept a cadence key and
   (b) render call/script steps, not just emails. *(Phase 3)*
4. Two new cadences in `OUTREACH_DAYS_BY_TYPE`: `activation_followup`, `post_meeting_followup`,
   each launched through the review module. *(Phases 3 & 5)*
5. "Interested" outcomes (call + reply) and "needs follow-up" (meeting) now **open the
   Cadence-Launch module** instead of going quiet. *(Phases 3 & 5)*
6. The **`&activate=1`** link variant (Terms auto-open). *(Phase 3)*
7. **Calendly webhook** auto-creates the Meeting card + clears stale call/email work. *(Phase 4)*
8. Drawer **action-first polish** across all three faces. *(Phase 6)*

**Discipline kept:** no new dispatcher actions, no new touchpoint types, no new tables —
new cadences are config + copy; webhooks are new routes that reuse existing handlers.

---

## 10. Open questions for Logan

1. **Activation cadence timing** — Now / +2 / +4 / +6 with one call at +4? Or fewer touches?
2. **Activation/post-meeting voice** — personal note from Dr. DuBose, or lighter "the Olera
   team"? (Drives the copy.)
3. **"Interested" auto-opens the Cadence-Launch every time, or is it optional** (a "Launch
   activation follow-up" button on the Awaiting-Activation row the admin clicks when ready)?
   Recommend: **optional button** — you stay in control, no surprise sequences.
4. **Post-meeting cadence** — confirm you want it (email + call), or keep post-meeting manual
   for v1 and add the cadence later?

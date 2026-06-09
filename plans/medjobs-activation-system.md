# MedJobs Activation System — Canonical Spec

Status: **SPEC — agreed design, ready to phase into build.** Supersedes and replaces the four
design-exercise docs (`medjobs-post-outreach-workflow.md`, `medjobs-drawers-and-cadences-design.md`,
`medjobs-scenario-reconciliation.md`, `medjobs-screen-inventory.md`).
Last updated: 2026-06-09
Grounded in code: `welcome-token.ts`, `app/medjobs/m/[token]/route.ts`, `cadence.ts`,
`sequencer.ts`, `lib/smartlead.ts`, `enrollRowIntoSmartlead`, `NextStepCard.tsx`.

---

## 1. North star

Everything exists to drive one event:

> **Provider clicks their magic link → lands authenticated on the campus-filtered Hire
> Caregivers board → accepts the combined Terms → Trial Active.**

If a button doesn't move a provider toward that click (or cleanly close them out), it isn't in V1.

---

## 2. Contact model (only two contacts)

The only contacts are **General Contact** (the org inbox) and **Decision Maker** (owner/champion).
"Specific contact" and "org email" are dropped — artifacts.

**The org is the anchor, not the email.** The pilot + Terms live on **one `business_profiles`
row keyed by `source_provider_id`** (the directory `olera_provider_id`). Emails are just doors in.

- **Magic link** is signed with one specific email; whoever clicks it becomes that email's
  authenticated user → account → adopts the org profile. **First clicker owns the org**; a second,
  different email clicking later hits **read-only co-tenancy**.
- **Initial outreach** → General Contact (required) + Decision Maker (if known). Each gets its own link.
- **Activation link** → send to **one** email — the one who engaged; prefer the **Decision Maker**
  when known. Don't blast the link to both once someone's warm (avoids the two-account race).
- **Owner replies from a new email / general inbox forwards** → for V1 we keep it simple: send the
  next activation touch to whatever email replied. (Capturing/swapping a new Decision Maker is a
  deferred "education" — see §8.)
- **Authenticated provider user** = the token email of the clicked link → account → org profile →
  accepting Terms writes `interview_terms_accepted_at` → Trial Active. One org, one pilot.

---

## 3. Architecture in one picture

```
 Prospect ──(Pre-Flight)──▶ INITIAL OUTREACH CADENCE  (emails + calls, runs itself)
                                      │
            provider replies / picks up the phone / meets
                                      │
                         ┌────────────┴────────────┐
                         ▼                          ▼
                  [ Interested ]              [ Not interested ]
                         │                          │
            LAUNCH ACTIVATION CADENCE          closing note → Closed
        (link + meeting option, nudges,
         queued calls; stops on activate
              OR meeting booked)
                         │
              clicks link → accepts Terms
                         ▼
                  TRIAL ACTIVE 🎉  (all cadences auto-stop)
```

Two buttons carry the whole post-outreach funnel: **Interested** (→ activation cadence) and
**Not interested** (→ close). Calls add one more: **Couldn't reach** (clears the call).

There are **no pop-up outcome modules.** The only module is the **cadence-launch review**.

---

## 4. Drawers

The drawer skeleton is unchanged (header · Next Step · context line · timeline · more details).
Only the **Next Step** box differs. V1 has these faces:

### 4.1 Prospect — UNCHANGED
Keep the existing pre-flight/research card exactly as built (checklist, Visit Website, Call to
Confirm, Launch Outreach). Ends in **[Launch outreach]** → the Initial Outreach cadence module.

### 4.2 Email drawer (a reply came in)
```
┌ Sunrise Home Care · Texas A&M ─────────────────────── ✕ ┐
│ ✉ THEY REPLIED — 2h ago · Jane Doe (Decision Maker)    │
│ ┌──────────────────────────────────────────────┐      │
│ │ "Sounds useful — how does it work and cost?"    │      │
│ └──────────────────────────────────────────────┘      │
│ [ Interested → activation ]   [ Not interested → close]│
│ CONTEXT  opened 2× · Day 3 cold email sent             │
└──────────────────────────────────────────────────────────┘
```
Read the reply, pick one path. **Interested** opens the activation cadence review (first email is
the reply, offering link + meeting). **Not interested** sends a one-line closing note + archives.
(The reply text is shown once reply-ingestion ships, §9 Phase 2; before that the admin reads it in
Gmail and opens the row.)

### 4.3 Call drawer (a cadence call is due)
```
┌ Sunrise Home Care · Texas A&M ─────────────────────── ✕ ┐
│ [CALL] 📞 (979) 555-0142 · Jane Doe (Decision Maker)  │
│ ▸ Script (from this cadence + day)                     │
│ [ Interested → activation ]  [ Not interested → close ]│
│ [ Couldn't reach ]                                     │
└──────────────────────────────────────────────────────────┘
```
Same two main paths as email. **Couldn't reach** clears the call from the Calls tab (the next
cadence call is already queued). Script comes from the cadence+day (one place, §6).

### 4.4 Meeting drawer (after the meeting)
```
┌ Sunrise Home Care · Texas A&M ─────────────────────── ✕ ┐
│ 📅 Meeting · Tue Jun 10, 2:00 PM                       │
│ [ Interested → post-meeting activation ]               │
│ [ Not interested → close ]                             │
└──────────────────────────────────────────────────────────┘
```
**Interested** opens the activation cadence with the **post-meeting opener** (the only difference).

### 4.5 Passive states (no decisions, just visibility)
```
Running:       "Activation cadence running · next call in 2 days · [Stop]"
Pilot Active:  "Activated Jun 8 · 90 days left · all cadences stopped"  🎉
Closed:        "Closed · not interested · [Reopen]"
```

---

## 5. The one module: cadence-launch review

Generalized from the existing `PreFlightReviewModal`: takes a **cadence key**, renders email steps
(editable subject/body) **and** call steps (editable script), each stamped with timing, ending in
one **Launch**. Launch **is the approval** — nothing sends before it. Serves both cadences.

```
┌ Launch activation cadence · Sunrise ──────────────── ✕ ┐
│ Sends Jane the link + a meeting option, then nudges    │
│ until she activates or books. Stops on either.         │
│  ▸ Now     ✉ "great to connect — here's your link"   ▾ │
│  ▸ +2 days ✉ "your {campus} students are ready"       │
│  ▸ +4 days ☎ call — "questions, or want a time?"      │
│  ▸ +7 days ✉ "still here when you're ready"           │
│  📎 every email carries the magic link + Calendly       │
│  [ Cancel ]                    [ Launch cadence 🚀 ]   │
└──────────────────────────────────────────────────────────┘
```

---

## 6. The two cadences (+ copy, RA voice)

Both live in `OUTREACH_DAYS_BY_TYPE`. Call steps queue only if a phone number exists. Call scripts
are defined once per (cadence, day) — the call drawer just renders the queued task's script.

### Cadence 1 — Initial outreach (`provider`) — already built, unchanged
Day 0 ✉ intro · Day 3 ✉ + ☎ · Day 5 ☎ · Day 7 ✉ final. (Copy in `templates.ts`.)

### Cadence 2 — Activation (`activation`) — NEW
Launched from any warm signal (reply / call / meeting). Offers link **and** meeting. **Auto-stops
on Trial Active OR a booked meeting.**

| When | Channel | Subject / purpose |
|---|---|---|
| Now | ✉ | first touch (opener varies by source) |
| +2 days | ✉ | "your {campus} students are ready" |
| +4 days | ☎ | "questions, or want to find a time?" |
| +7 days | ✉ | "still here when you're ready" |

**Copy:**
- **First email (reply/call opener):** *"Hi Jane — great to connect. Two easy ways forward: here's
  your link to see the {campus} students near you and get set up in about two minutes — {link}. Or
  if you'd rather talk it through first, grab a time with Dr. DuBose here — {calendly} — or reply
  with a couple of windows and I'll set it up. Either way, happy to help. — {RA}, Olera"*
- **First email (post-meeting opener):** *"Hi Jane — thanks for taking the time with Dr. DuBose
  today. As promised, here's your link to view the {campus} students and get set up — {link}.
  Anything that came up after, just reply here. — {RA}"*
- **+2 days** · *"your {campus} students are ready"* · *"Hi Jane — just making sure this didn't get
  buried. Jump in anytime — {link} — or grab a time with Dr. DuBose — {calendly}. — {RA}"*
- **+4 days call:** *"Hi Jane, it's {RA} from Dr. DuBose's office — I sent the link to view the
  {campus} students. Wanted to see if you had questions, or if it's easier to find a few minutes
  with Dr. DuBose."*
- **+7 days** · *"still here when you're ready"* · *"Hi Jane — no rush at all. Whenever you're
  ready, your link's here — {link} — and Dr. DuBose's calendar is here — {calendly}. — {RA}"*
- **Closing note (Not interested):** *"Thanks for letting me know, Jane — I appreciate you taking
  a look. If anything changes down the road, we'd be glad to help. All the best. — {RA}"*

Tone standard for ALL copy: simple, human, warm, concise, specific, not salesy, not AI-sounding.

---

## 7. Scenario coverage (V1)

| Scenario | V1 handling |
|---|---|
| Interested by email | Email drawer → Interested → activation cadence |
| Interested by phone | Call drawer → Interested → activation cadence |
| Wants to meet | Same Interested path — activation cadence offers the meeting option |
| Meeting booked (Calendly) | Webhook → Meetings; activation cadence stops (Phase 5) |
| Meeting done, interested | Meeting drawer → Interested → activation (post-meeting opener) |
| Meeting done, no | Meeting drawer → Not interested → close |
| No answer on a call | Call drawer → Couldn't reach → call clears; next cadence call queued |
| Provider activates Terms | Trial Active; all cadences auto-stop |
| Not interested (any channel) | Not interested → closing note → Closed |
| Asks to stop | Not interested → close (Do-Not-Contact handling = deferred §8) |

---

## 8. Deferred "educations" (parked, not lost)

Explicitly out of V1; revisit after we feel the lean build:
- **Voicemail callbacks** — a dedicated callback state/flow (V1: "Couldn't reach" + a note).
- **Wrong number** — bad-contact correction flow (V1: handled as Not interested / edit contact).
- **Reschedule / no-show** — meeting re-book flow (V1: meeting just stays bookable).
- **Clicked-link → call bump** (old D6) — engagement-driven prioritization.
- **Redirected / new Decision Maker capture** — general-inbox→owner contact swap.
- **"Just reply"** one-off answer to a question without launching a cadence.
- **Do-Not-Contact** as a distinct close reason.
- **Bounce-fix** automation.

---

## 9. Phased development plan (reconciled with what's built)

Legend: ✅ reuse as-is · ♻️ refactor · ➕ add · 🗑️ delete/retire

### Phase 1 — Core activation loop (the MVP that converts)
- ➕ Add `activation` cadence to `OUTREACH_DAYS_BY_TYPE` (`cadence.ts`) + scripts in `sequencer.ts`.
- ➕ Add activation email templates + closing-note template (`templates.ts`).
- ♻️ Generalize `PreFlightReviewModal` → cadence-launch review that takes a **cadence key** and
  also renders **call/script** steps (not just emails).
- ♻️ `schedule_sequence` / `enrollRowIntoSmartlead`: support launching the **activation** cadence
  on an already-engaged row (new Smartlead campaign for its emails + queued call tasks) **without**
  resetting the cold stage.
- ♻️ Email & Call drawers (`NextStepCard`): replace the stage-specific bodies with the simplified
  **[Interested → activation] / [Not interested → close]** ( + **[Couldn't reach]** on calls).
- ➕ Auto-stop the activation cadence on **Trial Active** (and later on booked meeting).
- ➕ `&activate=1` board variant → Terms modal auto-opens (`app/medjobs/candidates/page.tsx`).
- ✅ Reuse: magic-link route, board, Terms modal, `make_client`, cron executor, Smartlead client.
- 🗑️ Retire `ReplyClassifierModal` and the heavy `LogCallOutcomeModal` paths as the new buttons land.

### Phase 2 — Reply visibility (ingestion)
- ➕ `/api/webhooks/smartlead` (secret-validated) → `email_replied` touchpoint with `reply_body`.
- ➕ Webhook-registration script (per campus campaign).
- ♻️ Email drawer renders the **real reply text**; Emails tab shows reply preview + unread.
- ✅ Reuse: `deriveRepliesState` → engaged surfacing.

### Phase 3 — Drawer/outcome cleanup
- ♻️ Collapse remaining `NextStepCard` branches to the four V1 faces + passive states.
- 🗑️ Remove old D4 (awaiting-activation action layer → status), D6 (clicked-bump), D7 (meeting
  "finding a time"), `LogMeetingModal`'s extra outcomes.
- ➕ Running-cadence status + **[Stop]** / **[Re-send link]** affordances.

### Phase 4 — In-thread reply send (nice-to-have)
- ➕ Send the activation cadence's first touch as a **threaded reply** via Smartlead
  `reply-email-thread` (so it stays in-thread and replies route back to the Phase-2 webhook).
- Fallback if the id-chain doesn't line up: new-thread send (design unchanged).

### Phase 5 — Meeting drawer + Calendly
- ♻️ Meeting drawer → **[Interested → post-meeting activation] / [Not interested]**.
- ➕ `/api/webhooks/calendly` (signing-key verified) → `mark_meeting_scheduled` + supersede pending
  call/email tasks + stop the activation cadence → row appears in Meetings.
- Needs: Calendly token + org URI (Logan provides). Deferrable until meeting volume justifies.

Each phase = one revertable PR, typecheck clean, staging → main per the workflow.

---

## 10. Guardrails (unchanged, must hold)

- No new DB tables, no new dispatcher action verbs, no new touchpoint types — new cadence is config
  + copy; webhooks are new routes reusing existing handlers.
- Never modify directory claim paths (claim-instant, claim-listing, create-listing, claim/finalize).
- Keep the provider-reviews Stripe paywall intact.
- `MEDJOBS_MAGIC_LINK_SECRET` required to launch any cadence (existing launch guard).
- Only TJ merges to staging/main.

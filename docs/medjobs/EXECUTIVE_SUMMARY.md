# MedJobs — Operational Brief
### How the system works, why it matters, and what we're driving toward in the next two weeks

> **Audience:** Engineering team + outreach/admin team
> **Production state:** `main` at `5702be6` (May 14, 2026)
> **Companion doc:** `docs/medjobs/OPERATIONAL_BRIEF.md` (engineering reference for Claude sessions and deeper work)

---

## 1. Why This System Exists

The MedJobs system exists for one operational reason: **to put hundreds of thousands of university students into senior caregiver roles, at scale, with a team small enough to fit in a single Zoom call.**

Everything else — the Sites primitive, the catchment logic, the Log modules, the Pre-Flight Checklist, the conversion engine — is in service of that single throughput goal.

The reason no one has built this before isn't that the problem is hidden. It's that the operational coordination required to do high-quality, multi-channel outreach against thousands of providers and university stakeholders **without a tailored CRM** is humanly impossible. Salesforce and HubSpot are too generic and too expensive to fit. Off-the-shelf CRM tooling collapses under the specificity of *"university stakeholder → student channel → provider hiring → eventually family hiring."* The AI-coded, form-fit, semi-automated CRM is the moat. **Email hygiene at scale is the second moat. Database enrichment quality is the third.**

What we're really building is not "a CRM." It is an **operationalized distribution engine for labor supply in elder care.** The CRM is the orchestration layer that makes a small team behave like a large one — relentless, multi-channel, never letting anything fall through the cracks.

Read the rest of this brief with that frame.

---

## 2. Core Operational Philosophy

The system rests on six principles. Every shipped commit upholds them. Every future change should.

**1. Operational realism over process purity.**
Real outreach is non-linear. A pre-flight call leads directly to a meeting. A reply asks us to talk to someone else. A provider commits on a call without ever opening an email. A meeting ends in no-show. The system absorbs these realities gracefully — pre-flight bypass paths, conversion from any modal, "Redirected to another contact," "No-show / rescheduling." If the workflow is rigid, admins start lying to the system to keep moving; that's how CRMs die.

**2. Logging is operational progression, not data entry.**
When an admin selects an outcome, something happens: a card moves, a queue advances, pending tasks cancel, the next action becomes obvious. The toast names the consequence. The destination queue briefly highlights the row. The timeline reads as a sentence. If logging an outcome doesn't move the world visibly, the outcome is misnamed or shouldn't exist.

**3. The system is stateful, not record-based.**
The canonical state of any provider is **derived** from the immutable log of touchpoints — every email sent, call made, voicemail left, reply classified, meeting held. Admins never manage state directly. They log events; the system computes state. Single source of truth, no drift.

**4. Aggression is the moat; the CRM sustains it.**
If $20M were paid to reach a single provider, a human would find every channel — call, voicemail, email, LinkedIn, Facebook, fax, snail mail, conference, contact form. The CRM exists to make that aggression repeatable across 2,500 providers with a five-person team. Every channel we add compounds the moat. Quitting a channel is forfeiting the moat.

**5. Two prospect types, two conversion engines.**
Provider prospects become **Clients** (terms accepted, card on file, 3-month trial @ $50/mo). Stakeholder prospects become **Partners** (evidence of distributing program info to students). The engines are intentionally separate — a provider going through the stakeholder path half-converts. Every Log module routes correctly to the right conversion engine based on the row's kind.

**6. Discipline preserves coherence across iterations.**
Ten rules govern what kinds of changes ship without explicit review (no new backend enum values, no new actions, no schema changes, etc.). They exist because the system has, in earlier sessions, drifted. The recent two-week pass added zero new backend enum values, zero new actions, zero schema changes — and shipped substantial UX progress. That's the discipline working. (Full discipline rules live in the technical doc.)

---

## 3. Shared Vocabulary

Before anything else, the team needs a shared conceptual language. These terms repeat throughout the brief and the system itself.

| Term | What it is |
|--|--|
| **Site** | A university-anchored geographic outreach unit. Adding a Site cascades into surfacing Provider Prospects and Partner Prospects in nearby cities. |
| **Catchment** | The set of cities surrounding a Site whose providers become Provider Prospects. |
| **Provider Prospect** | A home care agency surfaced as an outreach candidate. Virtual until admin clicks to start outreach, then materializes into an active outreach row. |
| **Partner Prospect** | A university stakeholder (department head, advisor, professor, student org leader) surfaced as an outreach candidate. |
| **Client** | A converted Provider — accepted terms, card on file, in 3-month trial. The terminal-positive state for the Provider funnel. |
| **Partner** | A converted Stakeholder — evidence of distribution of program info to students. The terminal-positive state for the Stakeholder funnel. |
| **Pre-Flight Checklist** | The data-completeness gate that unlocks outreach launch. Tracks required (email, phone, address), recommended (website, contact form, fax), and optional (notes) fields. |
| **Outreach Launch** | The action that queues the multi-day cadence of emails and calls per recipient. |
| **Cadence** | The pre-planned sequence of emails and calls across Day 0, 3, 5, 7, etc., per recipient. |
| **Touchpoint** | An immutable log entry of something that happened (email sent, call made, meeting scheduled, etc.). The audit log and the source of all derived state. |
| **Stage** | The derived UI-level state of a provider — Prospect / In Outreach / Call Due / Meeting / Converted / Closed, etc. Computed on read; never stored. |
| **Log Module** | The four modals where admin records outcomes: Pre-flight Call / Call / Reply / Meeting. |
| **Outcome** | A specific operational result an admin selects in a Log module (e.g., "Voicemail / message left", "Interested", "Meeting scheduled"). Every outcome moves the provider's state. |
| **Conversion** | The transition of a row to Client (provider) or Partner (stakeholder). Closes obsolete tasks; provider drops out of active queues. |
| **In Basket** | The admin's primary work surface — the unified queue of Prospects / Calls / Replies / Meetings tabs. |

This vocabulary appears in every conversation the team has about the system. Internalizing it is non-optional.

---

## 4. The Funnel, End to End

The MedJobs system is a three-phase funnel. Everything operationally interesting happens at the boundaries between phases.

### Phase 1 — Prospecting (ends at Pre-Flight Checklist completion)

The **Site** is the geographic anchor. Adding a Site cascades:

1. Site row is created (a university system).
2. Catchment cities are computed automatically (cities in our database within range of the university).
3. All non-medical home care providers in those cities are surfaced as virtual Provider Prospects.
4. University stakeholders (dept heads, advisors, professors, student orgs) are surfaced as Partner Prospects.

Provider Prospects start as **virtual** — they live in the Prospects tab but aren't yet active outreach rows. When admin clicks to start outreach, the provider materializes into a real `student_outreach` row. This avoids inserting 2,500 rows on every Site add.

Phase 1 then walks admin through the **Pre-Flight Checklist** for each provider:

- **Required to launch:** General Contact email, General Contact phone, address (street + city + state + ZIP), contact form resolution (only when a contact form URL exists).
- **Recommended:** Website, Contact form URL itself, Fax.
- **Optional:** Research notes, LinkedIn, Yelp, Facebook, Google Business Profile.

**Pre-flight is not just data collection.** It is an operational interaction stage. When admin clicks "Call to obtain information" and reaches a decision-maker who engages, that engagement short-circuits the planned campaign entirely. The pre-flight modal supports all the conversion outcomes — admin can mark a provider Interested, Promised callback, Became a Client, or Not interested, right from the pre-flight call. The campaign never needs to launch. This is the **engagement bypass**, and it's the system's first encounter with the anti-fragility principle.

### Phase 2 — Outreach + Logging (the operational center)

Once Pre-Flight passes and admin hits **Launch Outreach**, the system queues the multi-day cadence: Day-0 email fires inline; subsequent days queue tasks per recipient.

After launch, admin's job is simple: surface the right work at the right time, log what happens, let the system advance the state.

**Three queues:**

- **Calls queue** — calls scheduled for today across all active campaigns. The drawer shows the phone link, the day-specific script, and primary "Log call outcome" + secondary "Log reply" buttons.
- **Replies queue** — providers awaiting reply (either we sent an email and they haven't responded yet, or we left a voicemail / message and are watching for callback).
- **Meetings queue** — providers with meetings in flight or scheduled.

**Logging is the operational center.** Admin makes the call / reads the inbox / holds the meeting / logs the outcome. The system handles everything else — cancels obsolete tasks, transitions the state, fires the toast, highlights the row in the destination queue, narrates the consequence in the timeline.

**Notes are optional everywhere** except "Done — needs more email" (Meeting modal), where the team needs to know what to email next.

**Auto-revive** is a critical anti-fragility behavior: if a provider that was archived as "no response" sends an inbound email reply, they automatically reopen to In Outreach. No admin intervention needed. The system protects against premature closeouts.

### Phase 3 — Conversion (terminal positive)

A provider becomes terminal-positive in one of two ways:

- **Provider → Client:** Logged as "Became a Client ✓" from the Call modal, Pre-flight modal, Reply modal, or Meeting modal. All four routes flip the row to active partner status, write the conversion timestamp on the business profile, and **unlock catchment-area university stakeholders for outreach.**
- **Stakeholder → Partner:** Logged as "Mark as Partner ★" from the Call modal, Reply modal, or Meeting modal. All three routes flip the row to active partner status, capture distribution evidence, and queue the first seasonal check-in email.

Once converted, the provider drops out of every active queue. History is preserved in the touchpoint timeline; admin can view it anytime through the Logs page.

### Logs / History

`/admin/medjobs/logs` is the audit surface. Filterable by type (calls / emails / meetings / replies / notes) and source (stakeholder / client / candidate / site). Useful for retrospective review, throughput tracking, and orientation when picking up a provider's history.

---

## 5. How Operational Progression Works — Outcomes Map

Every Log outcome causes a meaningful, observable state change. This is the contract between admin and system: **log honestly, the system moves the world.**

The four Log modules are listed below with every outcome and its operational consequence.

### Pre-flight Call modal — `Call to obtain information`

Used during pre-flight research, before outreach launch.

| Outcome | What happens |
|--|--|
| **No answer** | The call is logged. The provider stays in your Prospects list. Your planned campaign isn't affected. |
| **Voicemail / message left** | The call is logged. The provider stays in your Prospects list, and they also show up in Replies so you can watch for a callback. |
| **Reached someone** (no specific outcome) | The call is logged. You can add any new contact info you got from the call. The provider stays in your Prospects list. |
| **Reached someone → Interested** | The provider expressed interest during the call. We skip the planned email/call campaign entirely. They move to Replies — you'll continue the conversation from your inbox. |
| **Reached someone → Promised to call back** | The provider said they'd call us back. They move to Replies so you can watch for the return call. |
| **Reached someone → Became a Client ✓** | The provider committed to the trial right on the call. They become a Client immediately. University stakeholders in their area unlock for outreach. |
| **Reached someone → Not interested** | The provider declined during the call. We close them out and skip the campaign entirely. |
| **Wrong number** | The number was wrong. The provider stays in your Prospects list — update the number and retry. |

### Call modal — `Log call outcome`

Used when calls are queued from your Calls tab after outreach launch.

| Outcome | What happens |
|--|--|
| **No answer** | Today's call is logged complete. They reappear in your Calls tab on the next scheduled call day. |
| **Voicemail / message left** | Today's call is logged complete. They move to Replies to await callback. Future scheduled calls still fire as planned. |
| **Wrong number** | Closes the provider as unreachable on this number. |
| **Promised to call back** | We're in active conversation. They move to Replies to await their return call. |
| **Interested** | We're in dialogue. The automated email and call campaign stops — you'll handle the conversation from your inbox. They move to Replies. |
| **Meeting scheduled** | They agreed to a meeting on the call. They move to Meetings, with the date saved if you captured it. |
| **Mark as Partner ★** (stakeholder) | They committed to sharing with students. They become a Partner. The evidence panel captures how. |
| **Became a Client ✓** (provider) | They committed to the trial on the call. They become a Client. University stakeholders in their area unlock. |
| **Not interested** | They declined. Closes the provider. |
| **Stop communications** | They asked us never to contact them again. Closes as Do Not Contact — will NOT auto-reopen even if they reply later. |
| **Archive — no response** | The cadence ran without engagement. Closes the provider, but if they ever reply later, they automatically reopen. |

### Reply modal — `Log reply`

Used when you receive an email reply or voicemail and want to record what happened.

| Outcome | What happens |
|--|--|
| **They replied (keep emailing)** | We're in active conversation. The automated email campaign stops. You'll handle the back-and-forth from Gmail directly. |
| **They want to meet** | They expressed interest in a meeting. They move to Meetings (still finding a time). |
| **Meeting is booked** | A meeting is on the calendar. They move to Meetings (booked) with the date. |
| **Mark as Partner ★** (stakeholder) | They committed in the reply. They become a Partner. |
| **Became a Client ✓** (provider) | They committed in the reply. They become a Client. University stakeholders unlock. |
| **Redirected to another contact** | They sent us to someone else. Add the new contact inline — they're added to your snapshot, and the original cadence stops. |
| **Not interested** | They declined in the reply. Closes the provider. |

### Meeting modal — `Log meeting`

Used to track meeting status and outcomes.

| Outcome | What happens |
|--|--|
| **Still finding a time** | We're going back and forth over email about when to meet. They stay in Meetings. |
| **On the calendar (booked)** | A meeting is scheduled. Save the date if you have it. |
| **Mark as Partner ★** (stakeholder) | The meeting concluded with a Partner commitment. |
| **Became a Client ✓** (provider) | The meeting concluded with a Client commitment. |
| **Done — needs more email** | The meeting happened, but there's still email follow-up to do (they want to think it over, talk to leadership, see materials). They move to Replies for that follow-up. |
| **Not a fit** | The meeting happened, but they're not the right partner. Closes the provider. |
| **No-show / cancelled — rescheduling** | They didn't show up or cancelled at the last minute. The no-show is logged; they stay in Meetings so you can re-book. |

This map is the contract between admin and system. Internalize it; the rest follows.

---

## 6. The Operational Lifecycle

### Canonical funnel + bypass paths

The system supports a canonical "happy path" through the funnel — *and* the bypass paths that operational reality demands.

```
                  ┌─────────────────┐
                  │   Site added    │
                  └────────┬────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Provider Prospect   │
                │     (virtual)        │
                └──────────┬───────────┘
                           │ click to start outreach
                           ▼
                ┌──────────────────────┐
                │     Materialize      │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Pre-Flight Checklist │
                └──────────┬───────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
   ┌────────────────┐          ┌────────────────────┐
   │ Launch         │          │ Pre-flight Call    │  ◄── ① BYPASS:
   │ Outreach       │          │ (research call)    │      live engagement
   └────────┬───────┘          └─────────┬──────────┘      during pre-flight
            │                            │
            ▼                            │
   ┌────────────────┐                    │
   │  In Outreach   │ ◄──────────────────┘
   └────────┬───────┘ ◄── ⑦ AUTO-REVIVE on inbound reply
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
       │ Meetings │ ◄── ⑥ NO-SHOW loop (re-book stays here)
       └─────┬────┘
             │
             ▼
       ┌──────────────┐
       │  Conversion  │ ◄── ③④⑤ BYPASS: convert from
       └──────┬───────┘     Call / Reply / Meeting directly
              │
              ▼
       ┌──────────────────────────┐
       │  Client    /   Partner   │
       └──────────────────────────┘


        TERMINAL CLOSEOUTS (from any non-terminal state):
   ┌─────────────────────────────────────────────────────┐
   │  → Not Interested   → Do Not Contact                │
   │  → Wrong Contact    → No Response Closed (⑦)        │
   └─────────────────────────────────────────────────────┘
```

### Bypass paths

| # | Bypass | When it fires | Why it matters |
|--|--|--|--|
| ① | **Pre-flight engagement bypass** | Admin clicks "Call to obtain information" during pre-flight; reaches a decision-maker who engages on the call | The planned email/call campaign is skipped entirely. The provider can become Interested, Converted, or Not Interested before launch — no wasted outreach. |
| ② | **Voicemail → Replies (pre-launch)** | Pre-flight voicemail logged | Provider appears in Replies before campaign launch — admin watches for callback. |
| ③ | **Call → Meeting** | Admin selects "Meeting scheduled" outcome on a queued call | Skips the Reply step entirely; goes straight to Meetings. |
| ④ | **Call → Converted** | Admin selects "Became a Client" or "Mark as Partner" on a call | Skips Meetings entirely. |
| ⑤ | **Reply → Converted** | Admin selects "Became a Client" or "Mark as Partner" on a reply | Skips Meetings entirely. |
| ⑥ | **Meeting → No-show → re-book** | Admin logs "No-show / rescheduling" | Provider stays in Meetings ready to re-book; doesn't drop out of the queue. |
| ⑦ | **Auto-revive** | Closed-as-no-response provider sends an inbound reply | Provider automatically reopens to In Outreach. Anti-fragility against premature archiving. |

This is what we mean when we say the CRM is **operationally intelligent, adaptive, and anti-fragile.** The system absorbs the messy reality of real outreach instead of forcing admins to work around it. **It is not a rigid linear CRM.**

### Status → Stage mapping (what admin sees)

Each provider has a **Status** (stored) and a **Stage** (derived from the status, pending tasks, and touchpoint history). Admins interact with the Stage; the system manages the Status.

| Stored Status | What it means operationally | Where they show up |
|--|--|--|
| `prospect` / `researched` | Identified but not yet contacted; pre-flight may be in progress | Prospects tab |
| `outreach_sent` | Outreach launched; cadence in flight; awaiting first response | Calls tab (when a call is due that day) or Replies tab |
| `engaged` | We're in active dialogue — call answered, voicemail left, reply received, callback promised, etc. | Replies / Calls / Meetings (depending on which signal is most recent) |
| `meeting_scheduled` | A meeting is on the books | Meetings tab |
| `active_partner` (provider with metadata) | Became a Client | Drops out of active queues — moves to the Clients view |
| `active_partner` (stakeholder) | Became a Partner | Drops out of active queues — moves to the Partners view |
| `not_interested` | They declined | Closed (Archive view) |
| `no_response_closed` | Cadence completed without engagement | Closed (Archive view) — auto-reopens if they reply later |
| `do_not_contact` | They asked us never to contact again | Closed (DNC) — does NOT auto-reopen |
| `wrong_contact` | Contact info turned out wrong | Closed |

---

## 7. The Two Prospect Types

The system runs two distinct conversion engines in parallel.

### Provider → Client

A **Provider Prospect** is a non-medical home care agency in a Site's catchment. The objective is to convert them into a **Client**:

> Provider agency that has accepted Olera's terms, put a card on file, and entered the 3-month trial at $50/month. They access the platform to post jobs and hire student caregivers.

Provider conversion can be logged from any of four places — **Call modal, Pre-flight modal, Reply modal, or Meeting modal.** All four routes flip the row to `active_partner`, write the conversion timestamp on the business profile, and **unlock the catchment-area university stakeholders for Partner outreach.** The unlock is critical — it means converting a provider in (say) College Station, TX automatically surfaces the Texas A&M stakeholders as outreach candidates.

### Stakeholder → Partner

A **Partner Prospect** is a university stakeholder — department head, advisor, professor, or student org leader. The objective is to convert them into a **Partner**:

> Stakeholder with logged evidence of distributing program info to students. Evidence might be: verbal commitment to share with their class, hosting an info session, allowing a flyer drop, forwarding our materials, etc.

Stakeholder conversion can be logged from **Call modal, Reply modal, or Meeting modal.** All three routes flip the row to `active_partner`, capture distribution evidence, and queue the first seasonal check-in email. (Provider-only conversion path is not exposed in the stakeholder context, and vice versa.)

### Why the engines are distinct

The terminal evidence is different. A Client is identified by a financial commitment (terms + card). A Partner is identified by a distribution commitment (evidence of student reach). The downstream effects also differ — converting a Provider unlocks new outreach targets; converting a Partner kicks off a quarterly check-in cadence. **The wrong engine on the wrong row half-converts.** Every Log module is correctly gated by row kind to prevent this.

---

## 8. Current State

### What's built and shipped to production

- **Sites add-flow** with auto-cascading catchments and virtual Provider Prospects
- **Provider Prospect drawer + Pre-Flight Checklist** with required/recommended/optional tiers and engagement bypass support
- **All four Log modules** (Pre-flight, Call, Reply, Meeting) — vocabulary unified, conversion accessible from all four
- **Outreach launch + cadence sequencer** with per-recipient per-day task queueing
- **Conversion engine** — `make_client` (provider) and `mark_partner` (stakeholder) routing correctly, with downstream side-effects (Partner Prospect unlock, seasonal email queue) firing
- **Auto-revive** on closed-no-response + inbound reply
- **Logs page** with filterable feed
- **Toast layer + recently-moved row highlight + sidebar count pulse** — every meaningful Log dispatch produces visible progression feedback
- **Timeline narration** as complete sentences with consequence cues
- **DangerZone** for terminal admin overrides (DNC, Archive, Wrong contact, Redirect)
- **Stable queue ordering + read/unread + smart-hide** — mature and working

### What's partially built (needs admin-driven iteration)

- **Database enrichment** — the directory has providers, but completeness varies; some catchments may be sparse; some specific decision-makers missing
- **Email hygiene infrastructure** — single-domain sending today; bounce rates not actively monitored at scale; no multi-domain rotation. Functional for low volume; fragile at 25-site scale.
- **Contact form workflow** — banner + outcome action wired; admin must visit external form, submit, return to mark Submitted (no automation)
- **Per-recipient cadence** — works correctly post-enroll; UX for adding new Specific Contacts mid-campaign is admin-driven

### What's not yet built (deferred)

- Calendly webhook ingestion (manual logging suffices for MVP)
- Inbound email parsing / auto-classification (admin classifies manually)
- Fax outreach send infrastructure
- Snail mail outreach send infrastructure
- LinkedIn / IG DM / Facebook outreach UI
- Quarterly client check-in automation
- Care Shifts direct family hire flow (separate primitive, future)

### Key operational risks

| Risk | Why it matters |
|--|--|
| **Email reputation collapse at scale** | Most pressing risk. Sending thousands of emails per week from one or two domains without rotation, warmup, or active bounce monitoring will degrade deliverability. TJ's email hygiene priority is correctly placed. |
| **Bad catchment data → wrong prospects** | A misassigned university or missing city cascades into wasted outreach hours. Worth auditing the seed Sites before expanding. |
| **Admin behavior drift if the system feels broken** | If logging an outcome doesn't move the world (or moves it wrong), admins start working around the system. Recovery is much harder than prevention. The shipped progression-feedback layers defend against this; they need to actually work in practice. |

---

## 9. Operational Priorities for the Next Two Weeks

In strict priority order.

### Priority 1 — Use the system aggressively, as if you are interns

**Grazy, Esther:** operate the system as if you are interns competing for a perfect grade. Your grade is:

1. How many Clients you convert
2. How many Partners you convert
3. How many distinct refinement findings you produce (system bugs, friction points, missing affordances, copy improvements, operational realities the system doesn't yet handle)

**Each refinement finding is worth as much as a conversion.** Both move the project forward. Pick 3–5 universities, run every Provider Prospect through Pre-Flight → Outreach Launch → Calls → Replies → Meetings → Conversion or terminal decline. Log every outcome honestly. When something feels janky, capture it (which screen, which click, what you expected, what happened) and surface it — don't work around it silently.

This is how the system gets hardened. Designing in abstraction has hit its useful limit; the next round of progress requires real friction with real outreach.

### Priority 2 — Email hygiene deep dive (TJ)

The single most important strategic engineering priority.

- Audit current sending infrastructure (Resend setup, sender domains, bounce handling)
- Design multi-domain rotation strategy for scale (~10,000+ emails/week at maturity)
- Identify warmup, reputation monitoring, and complaint-handling gaps
- Spec the implementation; if scope allows in two weeks, build the foundation
- **Goal:** a clear path to "we can send 10,000 emails/week without burning domains"

Without this, the third moat (volume) cannot scale. We can build everything else perfectly and still fail on deliverability.

### Priority 3 — Database enrichment audit

For the seed 3–5 universities Grazy and Esther are using, audit:

- Are the catchment cities correct?
- Are the providers per city complete?
- Which provider records are missing critical pre-flight data (email, phone, address, contact form URL)?
- What's the highest-leverage automation opportunity — LinkedIn scraping, Apollo API, Yelp parse, GBP API?

The quality of prospecting depends entirely on enriched provider data. The more this is automated, the less time admins spend on manual data validation, and the more time they spend on actual outreach.

### Priority 4 — Iterate relentlessly through real operational usage

Pull Grazy + Esther's findings list daily. Fix what blocks operation. Defer what doesn't. Maintain the shipping discipline: small commits, one concept per commit, typecheck before pushing, no new backend enums.

---

## 10. The Grand Vision

The MedJobs system is one of three Olera primitives.

1. **MedJobs** — university partners → student caregivers → provider hiring (what this brief is about)
2. **Provider directory + claim flow** — providers claim accounts that double as their MedJobs portal (one identity, one account across the entire platform)
3. **Care Shifts** — families hire caregivers directly (student or otherwise) for shift-based ADL support, managed by Olera-standardized scheduling

The pipeline reads: **MedJobs gets caregivers** (via universities) **+ clients** (providers who hire them) → **Care Shifts opens the same caregiver pool to families** → Olera becomes the operating layer for senior in-home care at scale.

### Why this is bigger than a CRM

Standardized ADL care at scale **reduces ER visits, hospitalizations, and institutionalization.** Those are the largest expenditures in Medicare and Medicaid. Reducing them preserves U.S. dollar purchasing power. Preserving the dollar's purchasing power protects health globally. Connecting student labor to elderly care is, at this scale, **a public-health intervention with macroeconomic implications.**

This framing matters because it explains why the operational discipline matters. **The CRM is not a sales tool. It is the throughput infrastructure for a labor-supply pipeline that is, in aggregate, defensive infrastructure.**

---

## 11. What Success Looks Like in Two Weeks

- **3–5 universities seeded** with verified catchments
- **First Client converted** (provider signed terms, card on file, in trial)
- **First Partner converted** (stakeholder with logged distribution evidence)
- **Documented refinement list** from Grazy + Esther covering operational reality vs. shipped system
- **Email hygiene strategy scoped**, ideally with foundation built
- **Database enrichment audit complete**; highest-leverage automation opportunity identified
- **Bug list trending down, not up**

If we hit those marks, the path to **25 sites / ~$100k ARR floor** is operationally proven. The remaining work is volume, the secondary channels (fax, snail mail, LinkedIn), and the email hygiene moat. From there, the mature target of 200–2,000 universities is a question of execution, not architecture.

---

## 12. Where to Go From Here

This is the strategic brief. For deeper engineering context — the full state machine, the conversion routing map, the file-level references, the discipline rules (G1–G10), the deferred items registry, and the canonical engineering vocabulary — read the companion document:

📄 **`docs/medjobs/OPERATIONAL_BRIEF.md`**

The companion doc lives in the repo and is the canonical reference for any future Claude session working on the system. Future engineering work on MedJobs should begin: *"Read `docs/medjobs/OPERATIONAL_BRIEF.md` before we start."*

Both documents stay aligned. When the system evolves, both docs evolve together.

---

**Send questions to Logan on his return. Don't wait on him to begin.**

# Technology Readiness Workstream

> **Owner:** Esther (tech lead) · **Sponsor:** Logan · **Engineering support:** TJ
> **Organizing framework:** the operating system in [`00-OPERATING-SYSTEM.md`](00-OPERATING-SYSTEM.md).
> That diagram is the source of truth for what the technology has to support.
>
> **Outputs live in** [`tech-readiness/`](tech-readiness/) — the matrix, the user-flow maps, the defect log.

---

## 1. The question this answers

> **Given the MedJobs operating system we have defined: what technology already exists, what works, what
> is incomplete or broken, what still depends on manual work, and what must be built or improved before we
> can confidently increase volume through the funnel?**

This is a **verification workstream, not a redesign.** We have built a meaningful amount of MedJobs
technology and nobody currently has an end-to-end view of whether it supports the operating model we just
defined. The purpose is to find out, quickly and systematically, so that acquisition can be turned up with
confidence rather than hope.

Two failure modes it exists to prevent, in equal measure:

- **Rebuilding what already works.** Weeks lost re-implementing a flow that was fine.
- **Acquiring ahead of the system.** Providers and students entering a funnel whose downstream steps drop
  them, and nobody finding out for a month.

**Automation is not the goal.** Technology earns its place where it makes the operation faster, more
reliable, easier to run, better for the user, or measurable. Judgment and relationship work stay human —
and the audit says so explicitly rather than treating every manual step as a defect.

---

## 2. Scope

**In scope: the whole operating stack**, not just the codebase.

| Layer | Examples |
|---|---|
| Product | Provider portal, student portal, partner portal, public pages, application |
| Admin | In Basket, queues, drawers, step boards, sites, logs, stats |
| CRM | Outreach rows, touchpoints, tasks, statuses, queues |
| Communications | Email (transactional and cold), SMS, calling, scheduling, notifications, internal alerts |
| Money | Billing, invoicing, payment capture |
| Measurement | Instrumentation, stats endpoints, dashboards, exports |
| Shadow systems | Spreadsheets, inboxes, Calendly, anything real work currently runs through outside the platform |

**Stages covered:** PR1–PR3 · ST1–ST8 · Portal vetting · MA1–MA5, and every handoff between them.

> **Note on numbering.** The operating system now carries five university activation channels (ST3–ST7),
> so student application submitted is **ST8**. Earlier drafts said ST7.

**Out of scope for this pass:** redesign proposals, refactors, and anything about scaling beyond the first
site. Findings that point at those go in the defect log with a P3 and wait.

---

## 3. Method — five passes

Do them in order. Each pass feeds the next. **Work from the system, not from memory** — open the page, run
the flow, read the route, check the table.

### Pass A — Stage inventory against the operating system

For every stage and every handoff, answer these fifteen questions and record the answers in
[`tech-readiness/MATRIX.md`](tech-readiness/MATRIX.md):

1. What action has to occur operationally?
2. Who performs it?
3. Who touches the technology?
4. What UI supports it today?
5. What information must enter the system?
6. What information must be shown to the user?
7. What communication has to go out, to whom, on what trigger?
8. What state or status change is recorded?
9. What triggers the next step?
10. What is automated today?
11. What is manual today?
12. What happens outside the platform entirely?
13. Is the step instrumented — can we tell it happened and how long it took?
14. Can the next owner immediately see what they need to do?
15. What happens when the normal path fails?

Questions 12, 14 and 15 are the ones that usually surface the real problems. A stage can look complete and
still fail because the work actually happens in someone's inbox, or because the next owner has no way of
knowing it is their turn.

### Pass B — User journeys, one at a time

Trace each user separately, end to end, listing every page, form, email, text, notification, status,
action and handoff they encounter. Record in
[`tech-readiness/USER-FLOWS.md`](tech-readiness/USER-FLOWS.md).

| User | Journey to trace |
|---|---|
| **Provider** | First contact → meeting → profile completion → staffing need → candidate intro → interview → hire → six shifts → billing → ongoing support |
| **Student** | First exposure → application → vetting → profile → match → intro → interview → hire → six shifts → ongoing support |
| **Admin Team** | Prospecting (PR1/ST1), outbound, CRM management, follow-up, handoff to Logan |
| **Sales lead (Logan)** | What he needs before, during and after a provider or advisor meeting — and what must land in the system for a clean handoff to Chantel |
| **User success (Chantel)** | Client Success, University Success, student success, fulfillment, follow-up, moving entities through the funnel |
| **Tech / leadership** | What Esther and the founders need to see to know whether the operating system is working at all |

The internal journeys matter as much as the external ones. Most operating models fail at an internal
handoff, not at a customer screen.

### Pass C — Communications and shadow systems

Inventory every channel in the stack and, for each: what it is used for, who owns it, whether it is
instrumented, and whether it is reliable.

Then do the harder half: **find the work happening outside the platform.** Ask each owner what they do in
a spreadsheet, an inbox, a text thread, or a calendar because the system does not support it. Every one of
those is either a gap or a deliberate manual step — the audit's job is to say which.

### Pass D — Instrumentation

For every PR, ST and MA milestone, determine whether the system can reliably tell us:

- whether the milestone occurred
- when it occurred
- who owned it
- how long the entity sat at that stage
- what the outcome was
- why it failed or dropped out
- what stage comes next

**The bar:** we should be able to reconstruct the complete history of any single provider and any single
student moving through MedJobs, and to calculate conversion rates and cycle times between major stages.

**If a stage cannot be measured reliably, that is a gap even when the workflow works.** An unmeasurable
funnel cannot be improved and cannot be reported on January 5.

### Pass E — Live end-to-end validation

Inventory is not verification. Run real test entities through the real system.

**Provider path:** create a test provider → run the PR workflow → convert → capture a staffing need →
receive a candidate intro → schedule and hold an interview → confirm a hire → verify six shifts → issue
and collect a bill.

**Student path:** create a test student → submit an application → get vetted → become a qualified
candidate → get matched → get introduced → interview → hire.

**Internal paths:** repeat from the Admin Team, sales lead and user success seats — not just as an
administrator with full permissions, but as each role actually sees the system.

For every step record: expected behavior, actual behavior, and any bug, confusing UX, missing state,
missing communication, manual workaround, instrumentation failure, permissions problem, or handoff
failure. Log each in [`tech-readiness/DEFECTS.md`](tech-readiness/DEFECTS.md).

**Use a clearly marked test dataset and clean it up.** `/erase` exists for removing test data from
Supabase; agree the naming convention before creating anything so removal is unambiguous.

---

## 4. Classification

Every required capability gets exactly one:

| | Meaning |
|---|---|
| 🟢 **GREEN** | Exists and appears ready for operational use |
| 🟡 **YELLOW** | Exists but needs verification, UX work, instrumentation, or minor engineering |
| 🔴 **RED** | Missing, broken, or inadequate for reliable operation |
| ⚪ **MANUAL BY DESIGN** | Done by a human on purpose, because automating it would not currently improve the operation |

**MANUAL BY DESIGN is a real answer, not a euphemism.** The conversion meeting, the advisor relationship,
and the judgment calls inside client success are not automation targets. Marking them clearly is what
stops the audit from generating a backlog of things we should never build.

---

## 5. Priority

For every gap, ask one question:

> **Does this prevent us from running more volume through MedJobs safely, reliably, measurably, and
> without disproportionate manual effort?**

| | Meaning |
|---|---|
| **P0** | Blocks the end-to-end operating system, or creates unacceptable operational or data risk |
| **P1** | Does not block operation, but prevents reliable scaling or creates substantial manual work |
| **P2** | Meaningfully improves efficiency, usability, instrumentation, or conversion |
| **P3** | Optimization that can wait until we have real operating data |

A UX imperfection is not automatically an engineering priority. The point of the question above is to stop
us polishing technology that does not yet matter commercially.

---

## 6. Starting inventory

The repository already tells us roughly what exists. This is a **starting point to verify, not a finding** —
Pass A replaces it with what Esther actually observes.

| Area | What appears to exist |
|---|---|
| **Provider-facing** | `app/medjobs/candidates` (board + detail), `providers`, `staffing-pilot`, eligibility screener, welcome banner, interview scheduling, internship agreement modal |
| **Student-facing** | `app/medjobs/apply`, `jobs`, `submit-video`, `inbox`, `/portal/medjobs` (profile, jobs, interviews) |
| **Partner-facing** | `app/medjobs/partner/[token]` portal with activate / colleague / event / message routes |
| **Magic-link auth** | `app/medjobs/m/[token]` with expired and used states; provider links are multi-use |
| **Admin / CRM** | In Basket (Providers · Partners · Calls · Emails · Meetings · Follow-up), sites, prospects, clients, partners, candidates, meetings, calls, replies, logs, stats, catchment audit, integrations |
| **Admin tooling** | Provider-prospect materialization, contact enrichment, research workspace, site and business-profile step boards, operations summary, sidebar counts, bulk re-engage / bulk professors |
| **Cold email** | Smartlead bridge, sequence and lead refresh, webhook ingestion, reply backfill, auto-pause on claim |
| **Transactional email** | Resend, with a webhook |
| **Scheduling** | Calendly, with a webhook and a registration route |
| **Payments** | Stripe webhook, checkout and billing-portal routes (legacy subscription path); `medjobs_placements` fee fields are **stubbed** |
| **Logs / history** | Unified completed-work feed merging touchpoints, business-profile tasks and site tasks |
| **SMS** | Twilio exists in the codebase but appears in only one MedJobs route — not a systematic channel |

**What appears to have no technology at all: MA4, six-plus shifts worked.** There is no shift or
hours-worked concept anywhere in the MedJobs code. The only related value is a 120-hour threshold on the
placement record, which backs the service guarantee rather than the bill.

---

## 7. Discrepancies already visible between the diagram and the code

Flag these rather than quietly changing either the diagram or the code. Each needs a decision, and
each is Esther's to confirm or refute in Pass A.

| # | Discrepancy | Why it matters |
|---|---|---|
| **D1** | **MA4 has no implementation.** No shift tracking exists. | MA4 gates all revenue. The commercial threshold of the model has no technology behind it |
| **D2** | **Two billing paths, neither matching the diagram.** A legacy subscription path (checkout, billing portal, Stripe webhook) and a stubbed per-placement fee. The diagram bills after six shifts. | We cannot currently issue the bill the operating model describes. Tracked as **C1** |
| **D3** | **"Client" has three definitions** — signed agreement, pilot-terms flag, eligibility screener. | PR3 → MA1 has an ambiguous entry condition, and the conversion metric has no stable denominator. Tracked as **C2** |
| **D4** | **Qualification criteria are undefined.** The diagram says the Portal vets against them; they are not written down anywhere. | Vetting cannot be verified, automated, or delegated until they exist |
| **D5** | **The five activation channels are not modelled.** The CRM records partner stakeholders and distribution evidence, but has no concept of job board vs. listserv vs. event vs. class visit. | We cannot tell which of ST3–ST7 produces students, so we cannot allocate effort |
| **D6** | **No application attribution.** Nothing records how a student heard about MedJobs. | Same consequence as D5, from the student side |
| **D7** | **Professor outreach is permission-gated in code** (`permission_dependency_id`) but the diagram shows ST7 as a peer channel. | Either the diagram needs the dependency or the gate needs relaxing — decide, don't drift |
| **D8** | **The Smartlead webhook is inert without its secret.** | Without it there are no opens, clicks, replies or bounces in the app, which blinds the Emails and Follow-up queues. Tracked as **O-3** |

Anything else Pass A turns up goes in this table.

---

## 8. Outputs

| Artifact | What it holds |
|---|---|
| [`tech-readiness/MATRIX.md`](tech-readiness/MATRIX.md) | The readiness matrix — every stage, its requirement, its technology, its status, its gap, its action, its priority |
| [`tech-readiness/USER-FLOWS.md`](tech-readiness/USER-FLOWS.md) | Six end-to-end journey maps, one per user type |
| [`tech-readiness/DEFECTS.md`](tech-readiness/DEFECTS.md) | Everything Pass E turns up, with expected vs. actual |
| This file, §7 | The running discrepancy log between the diagram and reality |
| [`08-ITERATION-LOG.md`](08-ITERATION-LOG.md) | Anything found in passing that is not part of the audit |

---

## 9. Sequence

```
AUDIT → VERIFY → IDENTIFY GAPS → PRIORITIZE → FIX P0/P1 → RE-TEST END TO END
      → DECLARE MINIMUM OPERATING SYSTEM READY → INCREASE VOLUME → OBSERVE → ITERATE
```

Proposed timebox. Speed matters here — every week the audit runs is a week acquisition is held back — so
this is deliberately two weeks, not a quarter.

| Days | Work | Output |
|---|---|---|
| **1–3** | Passes A and C — stage inventory and stack inventory | Matrix populated through "manual work today" |
| **4–5** | Pass B — the six user journeys | User-flow maps |
| **6–8** | Pass E — live end-to-end validation, both external and internal paths | Defect log |
| **9** | Pass D — instrumentation audit | Instrumentation gaps in the matrix |
| **10** | Classify, prioritize, review with Logan and TJ | Complete matrix, agreed P0/P1 list |
| **11–14** | Fix P0 and P1 | Shipped fixes |
| **15** | Re-test end to end | Clean pass, or a named exception |
| **15** | **Readiness gate review** | Ready, or a list of what is not |

**Report progress daily in one line** — which pass, what broke, what is blocked. A two-week audit that
goes quiet for two weeks is not a workstream, it is a black box.

---

## 10. The MedJobs 2.0 Minimum Operating System Ready gate

> **What must be demonstrably working before we substantially increase provider and student acquisition?**

The standard is **not perfection.** It is sufficient confidence that additional volume produces learning
and commercial outcomes rather than a backlog of dropped entities nobody can see.

A gate item passes only when it has been **demonstrated end to end with a test entity**, not when someone
believes it works.

| # | Gate item | Passes when |
|---|---|---|
| **G1** | **A provider can traverse PR1 → PR3 → MA1** | A test provider goes from prospect to receiving a candidate intro without anyone editing the database by hand |
| **G2** | **A student can traverse ST8 → vetted → qualified → MA1** | A test student applies, is vetted against written criteria, and appears as a qualified candidate |
| **G3** | **An interview completes** | Invite, acceptance, calendar, and hold are all reflected in the system, on both sides |
| **G4** | **A hire is confirmed** | MA3 recorded, with both parties seeing the same state |
| **G5** | **Six shifts can be confirmed** | Some reliable mechanism exists — automated or deliberately manual — with a recorded result. **Currently RED** |
| **G6** | **A bill can be issued and collected** | Money moves, and is reconcilable. Manual invoicing counts |
| **G7** | **Every stage is instrumented** | We can reconstruct one provider's and one student's full history, and compute stage conversion and cycle time |
| **G8** | **Every handoff is visible** | The receiving owner can see that it is their turn without being told |
| **G9** | **Failure paths are handled** | No-shows, drop-outs, declines and stalls have a defined state and do not disappear silently |
| **G10** | **No unowned manual work** | Every manual step is either MANUAL BY DESIGN with a named owner, or has a P0/P1 fix scheduled |

**G5, G6 and G7 are the ones most likely to fail today.** G5 has no technology at all, G6 has two paths
and neither matches the model, and G7 depends on the Smartlead webhook being live.

**If the gate does not pass**, the outcome is not a delay to everything — it is a **capped volume**: keep
acquisition at current levels on one site, ship the P0s, re-test. Volume increases when the gate passes,
not when the calendar says so.

---

## 11. What this workstream is not

- **Not a redesign.** No rebuilding of anything that works.
- **Not an automation project.** Manual by design is a legitimate and frequently correct answer.
- **Not a bug-fix sprint.** The output is a prioritized, evidence-backed picture. Fixing follows, scoped
  to P0 and P1.
- **Not a reason to pause acquisition.** Current volume on the current site continues throughout. The gate
  governs *increasing* volume, not running at all.

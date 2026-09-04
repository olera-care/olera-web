# MedJobs 1.0 — Executive Operating Plan

> **Layer 1 of 2.** This is the whole strategy in one sitting (~12 minutes). The step-by-step is
> `01-EXECUTION-PLAYBOOK.md`; the daily SOPs are `protocols/`.
>
> **Audience:** Chantel, Esther, Graize, Ces — plus Logan and TJ.
> **Status:** Draft v1.0, 2026-09-04. Built from the 2026-09-04 strategy meeting and Graize's
> operating protocol. **Six items in `07-OPEN-DECISIONS-AND-CONFLICTS.md` must close before this plan
> can run at full speed** — most importantly the price (C1) and the definition of a Client (C2).

---

## 1. What MedJobs 1.0 is

**MedJobs 1.0 is an operated placement service that puts pre-health university students into paid
caregiver jobs at non-medical home care agencies, one university catchment at a time.**

Say it to a provider in one sentence:

> *"We run a student caregiver program with \[University\]. We recruit and vet pre-health students who
> want clinical hours, and we put them in front of you to interview. You pay when you hire."*

Say it to a student in one sentence:

> *"Paid caregiving work near campus, real patient hours toward your application, and a recommendation
> when you're done."*

**What it is not, in 1.0:** not a job board (a board with no operator behind it does not clear), not
self-serve (every hire is human-shepherded), not multi-city, not direct-to-family (that is D23), and not
an ads product. Every one of those is a real future; none of them is this quarter.

### The problem it solves

| Side | The pain | Why it is unsolved today |
|---|---|---|
| **Home care agencies** | Cannot hire or keep caregivers. Turnover in non-medical home care runs brutally high; a missed shift is a client lost. | Job boards send them the same unqualified applicants. Staffing agencies cost more than the margin on the shift. |
| **Pre-health students** | Need paid work *and* patient-contact hours *and* a clinician recommendation, all before they apply. | Hospital volunteering is unpaid and rationed. Caregiving jobs exist but never reach them — no agency markets to a pre-med sophomore. |

Both sides sit within three miles of each other around every university in the country and never meet.
MedJobs is the operator that introduces them, and takes a fee when a hire happens.

### Why we can run it and others can't

1. **A physician founder opens university doors** that a staffing startup cannot. *"Not everyone can just
   show up to a university and say, hey, can I speak to you"* (TJ). Logan can.
2. **We already own the provider graph.** Olera's directory means the catchment around any campus is a
   query, not a research project.
3. **It has already worked manually — about $6,000 of it** — end to end, with real hires. We are not
   testing whether the model works. We are testing whether it works **without a founder doing every step**.
4. **The space is emergent.** TJ: *"It's a good time for us to take a piece of that pie… You want to
   compete as the space emerges."*

### Why now

**January 5** is the CRP submission. It needs demonstrated **customer traction and revenue**, and MedJobs
is one of the two paths carrying it. That gives the pod roughly **17 weeks**. April 15's grant report is a
separate obligation on the same four people — this plan is written to be run by four people who are not
only doing this.

---

## 2. The operating model in one picture

```
   SITE                    (one university + its provider catchment)
     │
     ├─── DEMAND SIDE ──────────────────────────────────────────────┐
     │    Prospect → Pre-Flight → Cadence (email + calls) → Reply    │
     │    → MEETING → Client (terms accepted) ────────────────┐      │
     │                                                        │      │
     └─── SUPPLY SIDE ─────────────────────────────────────┐  │      │
          Partner prospects (advisors, student orgs,       │  │      │
          dept heads) → outreach → MEETING → Partner       │  │      │
          → flyer distributed → students apply             │  │      │
          → vetted live candidates ───────────────────┐    │  │      │
                                                      ▼    ▼         │
                                              THE MARKETPLACE        │
                                    invite → interview → offer       │
                                    → accept → CONFIRMED PLACEMENT   │
                                                      │              │
                                                      ▼              │
                                      BILL · CHECK IN · CAPTURE ─────┘
                                      (revenue, evidence, referrals)
```

**Two funnels, one marketplace, one billing moment.** The demand side and the supply side are independent
pipelines that must arrive at the same site at the same time. A client with no candidates churns; a
candidate with no client leaves. Keeping them in step is the actual operating discipline of MedJobs 1.0 —
everything else is execution detail.

### The four operating truths this model is built on

1. **The whole cold funnel exists to book one meeting.** Not to explain the program, not to send a PDF.
   Logan converts ~100% of providers who agree to a meeting. So the cold email, the call script and the
   reply handling all optimize for *one* thing: a calendar slot. Collateral sent instead of a booking is a
   lost conversion.
2. **Supply is the throughput ceiling, not demand.** The build plan is blunt: *"throughput is ultimately
   gated by student supply."* We can sign providers faster than we can staff them. Plan around that.
3. **Speed of reply is the product.** An interested provider sat unanswered for 30 days this summer. The
   standard is Diana's: *"she would have been responding the next hour."* One business day, always.
4. **Above five live relationships, memory fails.** Logan: *"as soon as it's above 5 people, you get
   fucked."* Everything is logged in the CRM or it did not happen. This is not bureaucracy — it is the only
   reason four people can hold sixty relationships.

---

## 3. The pod

Four owners, four lanes, no overlap on decisions. Full detail in `02-ROLES-AND-CADENCE.md`.

| Owner | Lane | Owns end to end | The one number they are judged on |
|---|---|---|---|
| **Graize** | **Demand** | Provider prospecting → pre-flight → cadence → call queue → booked meeting | **Meetings booked per week** |
| **Chantel** | **Conversion & Accounts** | Meeting → Client → onboarding → interviews → offers → confirmed hires → billing | **Confirmed placements** |
| **Ces** | **Supply & Data** | Catchment/provider data quality → partner recruitment → flyer distribution → student applications → live candidates | **Live candidates per site** |
| **Esther** | **The System** | CRM integrity, queue health, deliverability, instrumentation, the weekly metrics pack | **Zero queue debt + a working weekly number** |

**Why these four, from the evidence, not from the org chart:** Graize is already producing meetings without
founder help. Chantel asked for the concrete commercial terms — she is the closer, and she named the
centralization pain that Esther will fix. Esther proposed the system split and was asked to take first crack
at the CRM. Ces has the verification discipline the benefits pipeline runs on, and supply-side quality is a
verification problem before it is a marketing one.

**No designated pod lead.** Logan explicitly left this open: *"some groups of 3 to 4 don't need a leader."*
The pod runs on the sequence in this document instead. If it stalls twice in a row on the same handoff, that
is the signal to appoint one — not before.

**The founder's role is bounded and declining.** Logan runs conversion meetings and opens university doors.
He does not work the queue. The transition of the conversion meeting from Logan to Chantel is scheduled,
measured, and is itself one of the scale gates (C8 → Gate F).

---

## 4. How we make the MVP operational — the first ten working days

The system is built. It is not *running*. Ten days to make it run. Day-level detail is in
`01-EXECUTION-PLAYBOOK.md §2`.

**Day 0 — unblock (TJ + Logan, half a day).** Five things, none of them optional, all of them small:
verify the Smartlead webhook secret is set (without it the Emails and Follow-up tabs are blind and half of
Graize's protocol is inoperable); confirm migration `103_medjobs_placements` is applied; start mailbox
warmup (2–4 week lead time — the longest pole in the plan); **name Site #1**; and **answer C1 and C2 —
the price and the definition of a Client.** Nothing downstream is honest until those two are settled.

**Days 1–3 — load the site.** Ces audits the catchment and fixes the provider data. Graize materializes the
first 40 prospects and clears pre-flight. Ces builds the partner list — advisors, pre-health org leaders,
department heads. Esther stands up the metrics sheet and the daily zero-out. Chantel drafts the concrete
collateral she asked for: a one-page provider explainer with the actual price on it.

**Days 4–7 — first fire.** Launch the provider cadence at deliberately low volume (~25 sends/day) and work
the call queue every day. Launch partner outreach in parallel — **supply does not wait for the first client.**
First conversion meetings hit Logan's calendar with Chantel co-attending.

**Days 8–10 — close the loop.** First Client activated end to end and, crucially, **first flyer physically
circulating**. First students applying. Every break gets logged rather than worked around.

**What "operational" means at the end of day 10** — all five, or we are not done:
a provider cadence running daily without a founder touching it · a booked conversion meeting on the
calendar · a partner who has agreed to distribute · at least one student application submitted ·
a metrics sheet with real numbers in it.

---

## 5. What is protocol and what is experiment

The single most common failure of a young operating model is standardizing the wrong half — freezing the
message before it works, while leaving the mechanics to improvisation. So:

**Standardized — do it the same way every time** (`protocols/P1`–`P7`): the pre-flight checklist and launch
gate · cadence structure and call days · logging discipline (every outcome logged, always) · the 1-business-day
reply SLA · booking the meeting rather than sending collateral · the post-meeting details email and
agreement flow · Follow-up triage rules · disposition vocabulary (never Archive a decline) · the weekly
operating cadence.

**Experimental — vary it deliberately, one at a time, and write down the result** (`05-EXPERIMENTS.md`):
cold email copy and subject lines · whether to lead with MedJobs on a provider call · the flyer creative ·
which partner subtype activates fastest · the student incentive framing · how price is presented ·
channel mix beyond email and phone · the "3 attempts then archive" threshold.

**The rule that keeps them apart:** *if it decides who gets touched and when, it is protocol. If it decides
what we say, it is experiment.* Mechanics are frozen so we can trust the numbers; messages stay liquid
because we do not yet know which ones work.

---

## 6. What we measure from day one

Full definitions, sources and targets in `03-METRICS.md`. The pod tracks **one north star, five funnel
rates, and four health signals** — and nothing else, on purpose.

**North star: confirmed placements.** A student hired, an agreement signed, a fee billed. It is the only
number that is simultaneously revenue, product proof, and grant evidence.

| The five rates | Owner | Week-4 target |
|---|---|---|
| Prospect → meeting booked | Graize | ≥ 8% |
| Meeting booked → meeting held | Graize/Chantel | ≥ 70% |
| Meeting held → Client | Chantel | ≥ 60% |
| Partner contacted → distributing | Ces | ≥ 20% |
| Live candidate → interview invited | Chantel | ≥ 30% |

**The four health signals** (Esther, weekly): queue debt (anything overdue >48h) · reply SLA breaches ·
bounce + complaint rate · **supply/demand balance** — live candidates per active client, the single number
that predicts churn before it happens.

**Every metric has a named human, a source of truth, and a target before it is tracked.** A number nobody
owns is decoration.

---

## 7. How we learn — the feedback loops

| Loop | When | Who | Output |
|---|---|---|---|
| **Zero-out** | Daily, ≤30 min | Each owner | Every queue empty or explained. Nothing ages silently |
| **Jank log** | Continuous | Everyone | Screen, click, expected, actual → `08-ITERATION-LOG.md`. **Surface it; never work around it silently** |
| **Tuesday review** | Weekly, 45 min | Pod | Metrics pack, biggest leak named, one experiment started, one stopped |
| **Failure triage** | On every loss | Owner of the stage | Classify: data / deliverability / message / product / operator. The class routes the fix |
| **Gate review** | Monthly | Pod + Logan | Are we ready to scale? Against `04-SCALE-GATES.md`, not vibes |

The one cultural rule that makes this work, taken directly from the existing engineering brief: **a
refinement finding is worth as much as a conversion.** Both move the project. An operator who surfaces
five real breaks in a week has had a good week even with zero conversions.

---

## 8. When we are allowed to scale

Scaling a broken process multiplies the breakage. Six gates, all measured on **one site**, all held for
**two consecutive weeks** — the two-week hold is what separates a working system from a good week.
Detail in `04-SCALE-GATES.md`.

| Gate | Threshold |
|---|---|
| **A · Reliability** | Zero queue debt >48h; 100% of outcomes logged; zero SLA breaches |
| **B · Demand** | ≥ 5 Clients on one site; meeting-held → Client ≥ 60% |
| **C · Supply** | ≥ 15 live candidates and ≥ 3 distributing partners on that site |
| **D · Marketplace** | ≥ 5 confirmed placements in a 30-day window |
| **E · Money** | ≥ 3 hires billed and collected end to end |
| **F · Independence** | Two full weeks with no founder action except conversion meetings — and ≥ 2 of those meetings run by Chantel |

**Gate F is the real one.** A, B, C, D and E can all be passed by a founder working nights. F is the only
gate that proves the *operating model* works rather than the people.

---

## 9. How we scale once the gates pass

Three stages, each gated by the previous. Detail in `04-SCALE-GATES.md §3`.

**Stage 1 · Prove it repeats (Sites 2–3, ~4 weeks).** Same pod, same protocols, two more universities in
the same state. The only question: does site #2 reach its first placement faster than site #1? If it does
not, the protocols are wrong and no amount of hiring fixes that.

**Stage 2 · Prove it delegates (Sites 4–8, ~6 weeks).** Bring in 2–3 student interns — Logan's model of
grunt work traded for research authorship. Each pod member becomes an owner of a lane rather than an
operator in it. The test: can an 18-year-old with only our protocols run pre-flight and the call queue?
That question is answered by `protocols/`, which is exactly what those documents are for.

**Stage 3 · Prove it compounds (Sites 9–25).** Automate what the first eight sites proved repetitive —
inbound reply classification (D2), multi-domain warmup (D25), Calendly ingestion (D1), quarterly check-ins
(D21). **Automate only what has been done manually enough times to be boring.** The deferred registry in
`../OPERATIONAL_BRIEF.md` Appendix B is already the queue; operating reality decides the order.

**The arithmetic that makes this worth doing:** ~3 hires per catchment per month at $250+ across a few
hundred university catchments is a low-eight-figure-per-year pipeline against ~3,000 US universities. And
500 placed students with satisfaction data is the preliminary evidence base for a ~$2M NIH proposal. The
placement service pays for itself; the dataset is the second business hiding inside the first — which is
why `07-OPEN-DECISIONS-AND-CONFLICTS.md` O-10 (capture the research fields from placement #1) matters far
more than its size suggests.

---

## 10. What the founders still have to decide

Six blockers, in the order they bite. The pod can start today; it cannot finish without these.

| # | Decision | Owner | Needed by |
|---|---|---|---|
| **C1** | **Price, payer, timing.** $250/hire monthly (meeting) vs $100 per party at confirm (shipped code) vs $0 (pre-pilot). Chantel cannot sell against a 2.5× spread. | Logan + TJ | Before the first conversion meeting |
| **C2** | **What makes someone a Client** — signed agreement, pilot terms, or the eligibility screener? Three flags, three meanings, one metric. | TJ + Logan | Day 3 |
| **O-1** | **Which university is Site #1?** Logan's relationships decide it. | Logan | Day 1 |
| **C5** | Does the provider pipeline stay in MedJobs or move to Provider Outreach? *Decide it; don't migrate mid-sprint.* | Logan + TJ | Tuesday session |
| **C8** | Logan's role: conversion meetings until when, and who takes them over? | Logan | Week 2 |
| **O-11** | **Does provider cold outreach continue at current intensity?** Chantel asked in the meeting; it was not answered. An unanswered capacity question defaults to doing both, badly. | Logan + TJ | Tuesday session |

Plus the fast technical unblocks that only TJ can do: webhook secret (**O-3**), placements migration
(**O-2**), sending domain warmup (**O-4**), Stripe capture path (**O-5**).

---

## 11. The honest risks

| Risk | Why it is real | What we do about it |
|---|---|---|
| **Supply starves demand** | Structural, and already flagged in the build plan as HIGH | Supply runs one site ahead; Gate C blocks scaling without it |
| **Email reputation collapse** | Named as the top risk in the engineering brief; warmup has a 2–4 week lead time we have not started | Start warmup Day 0; hard volume caps; bounce/complaint kill-switch in `protocols/P2` |
| **Founder remains the bottleneck** | The conversion meeting converts *because it is him* | Scheduled handoff, measured as Gate F |
| **The pod is not full-time on this** | April 15 grant work and provider outreach compete for the same four people | O-11 must be answered; the plan assumes ~60% of four people, not 100% |
| **We standardize the wrong things** | Freezing a message that does not work yet is worse than having no protocol | The protocol/experiment split in §5, reviewed every Tuesday |
| **Jan 5 arrives with activity but no revenue** | Stripe is stubbed; there is no capture path today | Manual invoicing from hire #1. Do not let billing infrastructure gate hires |

---

## 12. What good looks like on January 5

Not a forecast — the target the operating model is designed to hit:

- **3 sites live**, each with clients, partners and candidates
- **15+ Clients**, **25+ confirmed placements**, **revenue collected and reconcilable**
- **A pod running the whole thing** with the founder in conversion meetings only — and Chantel running
  most of those
- **Protocols good enough that an intern onboarded in a day** — the actual proof that this is a business
  and not a founder one-off

> Logan, in the meeting: *"We keep getting dinged because we're not expanding out of founders' brains.
> We're not building enterprise-level businesses, we're building founder one-offs."*
>
> This plan is the answer to that sentence. Everything else here is detail.

---

**Next:** `01-EXECUTION-PLAYBOOK.md` for the step-by-step · `02-ROLES-AND-CADENCE.md` for who does what on
which day · `protocols/` for the SOPs you actually run from.

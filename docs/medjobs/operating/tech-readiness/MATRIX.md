# Technology Readiness Matrix

> **Owner:** Esther · **Method:** [`../09-TECH-READINESS.md`](../09-TECH-READINESS.md) Pass A, C and D.
> **Framework:** the stages in [`../00-OPERATING-SYSTEM.md`](../00-OPERATING-SYSTEM.md).
>
> **Status:** seeded, not audited. The "existing technology" column is a starting point read from the
> repository. Everything in Table B is Esther's to determine by opening the system, not by reading code.

**Why two tables.** Twelve columns is unreadable on a page. Table A is what each stage *requires*;
Table B is how *ready* it is. Same rows, same order, joined on the stage ID.

**Legend.** 🟢 ready · 🟡 exists, needs work · 🔴 missing or broken · ⚪ manual by design · `?` not yet determined

---

## Table A — What each stage requires

| Stage | Operational requirement | User(s) | Existing technology (unverified) | Manual work today |
|---|---|---|---|---|
| **PR1** Target list built | Providers in the service area identified and verified as real, operating agencies with usable contact details | Admin Team | Sites + catchment, virtual provider prospects, materialize endpoint, catchment audit, contact enrichment | ? |
| **Outbound** (provider) | Sequence launched, calls worked, replies triaged, meeting booked | Admin Team | Smartlead bridge + webhook, cadence sequencer, Calls / Emails / Follow-up queues, log modals | ? |
| **PR2** Meeting held | Meeting booked, held, outcome recorded, context passed to Chantel | Logan | Calendly + webhook, meeting queue, log meeting modal | ? |
| **PR3** Client success | Follow-up questions, profile completion, follow-through to first hire | Chantel | Clients queue, business-profile step boards, provider portal, eligibility screener | ? |
| **ST1** Target advisors | Advisors, org leaders and department heads identified per site | Admin Team | Partner prospects, partner sourcing, source-partners endpoint | ? |
| **Outbound** (university) | Subtype-aware sequence, calls, replies, meeting booked | Admin Team | Same outreach machinery, subtype-aware templates | ? |
| **ST2** Advisor meeting held | Meeting held, outcome recorded, relationship passed to Chantel | Logan | Calendly, meeting queue, log meeting modal | ? |
| **ST3** University job board | Opportunity posted and kept current on the university's board | Chantel · Logan | Job postings, opportunity model | ? |
| **ST4** Student org relationships | Relationship established, opportunity circulated to members | Chantel + Logan | Partner portal, distribution evidence | ? |
| **ST5** Campus events | Event scheduled, held, students captured | Chantel + Logan | Partner portal event route | ? |
| **ST6** Advisor listservs | Opportunity distributed to the advisor's list | Chantel · Logan | Partner portal message route | ? |
| **ST7** Professor outreach + class visits | Permission obtained, professors reached, class visits held | Chantel + Logan | Professor gating (`permission_dependency_id`), bulk professors | ? |
| **ST8** Student application submitted | Application captured completely enough to vet | Portal | `apply`, `apply-partial`, uploads, submit-video | ? |
| **Vetting** Portal vets application | Application assessed against defined qualification criteria; qualified candidates surface | Portal | `student-eligibility`, `go-live`, candidates board | ? |
| **MA1** Candidate intro | Client sees candidates who fit the staffing need | Chantel · Portal | Candidates board, candidate cards, job match, invite | ? |
| **MA2** Interview held | Interview invited, accepted, scheduled, held, confirmed by both sides | Chantel · Portal | `interviews`, claim-interview, interview calendar, `.ics` | ? |
| **MA3** Hire confirmed | Offer made and accepted; placement recorded | Chantel · Portal | `placements` (offered / accepted / confirmed), internship agreement modal | ? |
| **MA4** 6+ shifts worked | Work is verified to have actually happened | Chantel · Portal | **None found** | Entirely manual — mechanism undefined |
| **MA5** Bill issued and collected | Invoice raised against the confirmed threshold and payment received | Chantel | Stripe webhook, checkout, billing portal (legacy subscription); placement fee fields **stubbed** | ? |
| **Handoff** Admin → Logan | Logan sees a booked meeting with the context he needs | Admin Team → Logan | Meeting queue, drawer timeline | ? |
| **Handoff** Logan → Chantel | Chantel sees a converted client, or an activated university, and what was promised | Logan → Chantel | Clients queue, partners queue, step boards | ? |
| **Handoff** Chantel → Portal | A staffing need and a qualified pool the Portal can match | Chantel → Portal | Demand profile metadata, candidates board | ? |

---

## Table B — How ready each stage is

| Stage | UI/UX | Comms | Instrumented? | Status | Gap | Recommended action | Priority |
|---|---|---|---|---|---|---|---|
| **PR1** | ? | ? | ? | ? | | | |
| **Outbound** (provider) | ? | ? | ? | ? | Depends on the Smartlead webhook secret (**D8**) | | |
| **PR2** | ? | ? | ? | ? | | | |
| **PR3** | ? | ? | ? | ? | "Client" has three definitions (**D3**) | | |
| **ST1** | ? | ? | ? | ? | | | |
| **Outbound** (university) | ? | ? | ? | ? | | | |
| **ST2** | ? | ? | ? | ? | | | |
| **ST3** | ? | ? | ? | ? | Channel not modelled (**D5**) | | |
| **ST4** | ? | ? | ? | ? | Channel not modelled (**D5**) | | |
| **ST5** | ? | ? | ? | ? | Channel not modelled (**D5**) | | |
| **ST6** | ? | ? | ? | ? | Channel not modelled (**D5**) | | |
| **ST7** | ? | ? | ? | ? | Permission gate not in the diagram (**D7**) | | |
| **ST8** | ? | ? | ? | ? | No source attribution (**D6**) | | |
| **Vetting** | ? | ? | ? | ? | Qualification criteria undefined (**D4**) | Write the criteria before auditing the mechanism | **P0** |
| **MA1** | ? | ? | ? | ? | | | |
| **MA2** | ? | ? | ? | ? | | | |
| **MA3** | ? | ? | ? | ? | | | |
| **MA4** | 🔴 | 🔴 | 🔴 | 🔴 **RED** | No shift or hours-worked concept exists (**D1**) | Decide the mechanism — provider attestation, student log, or manual confirmation — then build the minimum that records a result | **P0** |
| **MA5** | ? | ? | ? | 🔴 **RED** | Two billing paths, neither matching the model (**D2**) | Manual invoicing until the fee and trigger are decided (**C1**) | **P0** |
| **Handoff** Admin → Logan | ? | ? | ? | ? | | | |
| **Handoff** Logan → Chantel | ? | ? | ? | ? | | | |
| **Handoff** Chantel → Portal | ? | ? | ? | ? | | | |

---

## Instrumentation detail (Pass D)

One row per milestone. A stage is only instrumented if **every** column is yes.

| Stage | Occurred? | When? | Owner? | Time in stage? | Outcome? | Failure reason? | Next stage? |
|---|---|---|---|---|---|---|---|
| PR1 | ? | ? | ? | ? | ? | ? | ? |
| PR2 | ? | ? | ? | ? | ? | ? | ? |
| PR3 | ? | ? | ? | ? | ? | ? | ? |
| ST1 | ? | ? | ? | ? | ? | ? | ? |
| ST2 | ? | ? | ? | ? | ? | ? | ? |
| ST3–ST7 | ? | ? | ? | ? | ? | ? | ? |
| ST8 | ? | ? | ? | ? | ? | ? | ? |
| Vetting | ? | ? | ? | ? | ? | ? | ? |
| MA1 | ? | ? | ? | ? | ? | ? | ? |
| MA2 | ? | ? | ? | ? | ? | ? | ? |
| MA3 | ? | ? | ? | ? | ? | ? | ? |
| MA4 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| MA5 | ? | ? | ? | ? | ? | ? | ? |

**The two reconstruction tests.** The audit passes instrumentation only if we can produce, from the
system alone: (1) the complete history of one provider from PR1 to MA5, and (2) the complete history of
one student from ST8 to MA4 — each with timestamps and owners.

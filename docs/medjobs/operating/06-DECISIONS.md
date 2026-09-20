# Decision Log

> Every operating decision for MedJobs, with the reasoning and — most importantly — **what would reverse it.**
>
> **Why this file exists:** a decision nobody wrote down gets re-litigated every three weeks, and a decision
> without a stated reversal condition can never be revisited honestly. Chantel's question in the meeting —
> *"I'm just not sure where everything sits at the moment"* — is what this file prevents.

**Format:** `D-NNN · date · owner · decision · reasoning · reverses if`

**Status:** `PROPOSED` (recommendation from this workspace, awaiting an owner) · `DECIDED` (an owner said yes) ·
`REVERSED` (superseded — kept, never deleted).

---

## Decided

### D-001 · 2026-09-04 · Pod · MedJobs 2.0 scope is one site, provider + supply + marketplace, ending at a billed placement

**Status:** PROPOSED — needs Logan's confirmation.

**Reasoning:** the model has already been proven manually end to end (~$6,000). What is unproven is running
it without the founder in every step. Scoping to one site keeps the variable count low enough to learn from.
Out of scope for 2.0: direct-to-family (D23), agency pools (D24), multi-city, ads.

**Reverses if:** the Jan 5 requirement forces breadth over depth — in which case say so explicitly and accept
that no site gets proven.

---

### D-002 · 2026-09-04 · Pod · Supply runs one site ahead of demand, not after it

**Status:** PROPOSED — needs Logan's sign-off on the minimum board size.

**Reasoning:** Logan's meeting sequence was provider-first (*"here's your egg… now go get the chickens"*).
The build plan states the opposite constraint: *"throughput is ultimately gated by student supply,"* with
"no students" listed as a HIGH structural fall-off, and Loop 2b built specifically to recover from it. Both
can be satisfied by running supply in parallel and gating conversion meetings on a minimum viable board
(recommended: **8 live candidates**). See **C6**.

**Reverses if:** supply proves far easier than expected — if a single advisor email produces 30 applications,
the constraint has moved and demand becomes the gate.

---

### D-003 · 2026-09-04 · Pod · Pre-flight calls enrich the record; they do not gate the campaign

**Status:** PROPOSED — Grazy + Esther to confirm.

**Reasoning:** the protocol archives a prospect after 3 unanswered pre-flight calls, before any email is
sent. That deletes providers who have a valid email and were never contacted through the cheapest channel,
and it contradicts the aggression doctrine in `../OPERATIONAL_BRIEF.md §2.4`. The system also has no attempt
counter, so the rule is untracked today. New rule: **if required contact fields are present, launch.** Calls
continue as cadence call-days. Archive only via the Follow-up rules in `protocols/P7`. See **C3**.

**Reverses if:** bounce or complaint rates rise above the `../EMAIL_LAUNCH_PLAN.md §5` thresholds on
un-called prospects — that would mean the pre-flight call was doing list hygiene we did not credit it for.

---

### D-004 · 2026-09-04 · Pod · "Not interested" is never Archive

**Status:** PROPOSED — correctness fix; adopt on sight.

**Reasoning:** in the system, Archive means `no_response_closed`, which **auto-revives to `engaged` on any
inbound email**. Marking a decline as Archive means their next out-of-office resurrects them into an active
queue and they get worked again — a complaint-rate risk of our own making. Declines log `Not interested`;
opt-outs log DNC; **Archive is only ever for silence.** See **C4**.

**Reverses if:** never. This is how the code behaves.

---

### D-005 · 2026-09-04 · Pod · Reply SLA is 1 business day; meeting requests same day

**Status:** PROPOSED — adopt immediately, costs nothing.

**Reasoning:** an interested provider went unanswered from August 5 to September 4. Logan's standard is
Diana's: *"she would have been responding the next hour."* One business day is the enforceable version.
See **O-7**.

**Reverses if:** volume makes it impossible — at which point the answer is more operators, not a looser SLA.

---

### D-007 · 2026-09-04 · Pod · No designated pod lead for now

**Status:** PROPOSED — Logan's stated preference.

**Reasoning:** *"some groups of 3 to 4 don't need a leader… I want to see where y'all's talents and passions
would take this."* Coordination comes from the sequence in `01-EXECUTION-PLAYBOOK.md` rather than a person.

**Reverses if:** the pod stalls twice on the same handoff, or a gate review fails on Gate A (reliability) —
both are symptoms of missing coordination, not missing effort.

---

### D-008 · 2026-09-04 · Pod · Decide the CRM architecture; do not migrate during the sprint

**Status:** PROPOSED — Logan + TJ to decide the target at the Tuesday session.

**Reasoning:** Esther's split (MedJobs = students, cold outreach = providers, a third layer converts) is
sound and Logan endorsed it. But re-platforming the provider queue mid-sprint would cost the pod its only
working pipeline in exchange for an architecture with no proven operating model behind it. Ship the
operating model on the surfaces that exist; move it afterwards. See **C5**.

**Reverses if:** the current surface actively blocks the sprint — for example, if provider and MedJobs
outreach collide on the same rows and double-email a provider.

### D-009 · 2026-09-20 · Logan · The first ask is interest, not a meeting — reverses D-006

**Status:** DECIDED.

**Reasoning:** a meeting is a large ask from a cold email, and it is not the thing we need. What we need is
a provider who says *tell me more*. Two live records made the case: Danville Support Services replied
*"she would love to see the details first prior to having a quick meeting,"* and Arosa Salt Lake replied
with a time. Both are interested; only one of them wanted a calendar. The board logged both as a
follow-up outcome and queued another follow-up, because the ladder had nowhere to put *yes*.

So the ladder's goal moves from **meeting held** to **set up to receive a student**. Interest is confirmed
first, from any channel — an email reply, a call, a callback, a voicemail they left. Confirming it sends an
onboarding pack that carries the whole process, and the meeting becomes a checkbox on that outcome: some
providers want one, and for them it runs *alongside* onboarding rather than in front of it.

D-006 said the opposite — *book the meeting, do not send collateral instead* — and it was right about the
thing it was guarding against, which is throwing a contract or a landing page at a cold provider. The pack
is not that. It goes to somebody who has already said they are interested.

**Reverses if:** self-serve providers onboard and then never hire, while meeting-first providers do. That
would mean the meeting was doing work the pack cannot, and the meeting goes back in front.

---

### D-010 · 2026-09-20 · Logan · Terms are accepted twice — lightly at interview, fully at hire

**Status:** DECIDED. Narrows **C2**; the full-terms half waits on **C1**.

**Reasoning:** agreeing to interview a student is a smaller commitment than agreeing to be billed, and one
gate cannot honestly carry both. The light gate is what ships today —
`business_profiles.metadata.interview_terms_accepted_at`, written when a provider schedules an interview —
and it keeps its current jobs: it is what makes a provider a Client and what starts the pilot window. The
full gate is new, sits at the first hire, and is where the price is agreed.

**What this costs:** a second acceptance record and a surface at hire time. Neither exists. The full gate
cannot be built before C1 settles, because there is no price to agree to.

**Reverses if:** two gates produce providers who accepted one and not the other and then hire anyway — at
which point the question is which gate was real.

---

### D-011 · 2026-09-20 · Logan · The onboarding pack states no price

**Status:** DECIDED. **Defers C1 — it does not resolve it.**

**Reasoning:** whatever the pack says about money becomes the thing providers hold us to, and C1 is a 2.5×
spread across four sources with no owner's signature on any of them. Writing a number into an email that
goes to every interested provider would settle C1 by accident, in the worst possible venue. The pack covers
the workflow — how applications arrive, how to review one, how to set requirements, and applicant →
interview → hire → billing — and says that terms come at the two gates in D-010. Price is discussed when a
hire is actually near.

**What this does not buy:** it does not answer the question Chantel asked, which is what to say on a call
when a provider asks the price. C1 is still blocking for that.

**Reverses if:** providers reach the hire gate and balk at a number they are seeing for the first time. That
is the failure mode of leaving it out, and it is the reason C1 still has a date on it.

### D-012 · 2026-09-20 · Logan · The pilot terms are attached to the pack, and they name the price

**Status:** DECIDED. **Narrows D-011 and, in practice, decides C1's amount.**

**Reasoning:** a provider deciding whether to try this wants to see what they are agreeing to, and
D-011's answer — say nothing about money — leaves them guessing. So the pack attaches pilot terms, for
review, with nothing to sign. The terms say what D-011 keeps out of the email: no obligation, we keep
sending students until you hire one and it works out, and **$250 per hire** if you want to carry on
after that, agreed formally then rather than now.

**The thing to be honest about:** this is not a narrowing of D-011 so much as a different route to the
same place. A number in a document attached to every interested provider is a number we have published.
C1's *amount* is settled by this in practice whatever the decision log says; what genuinely remains open
is the trigger and the free-first-hire question. The draft is at `../PILOT_TERMS_DRAFT.md` and the PDF
does not exist yet, so the attachment link 404s by design rather than sending a draft.

**Reverses if:** the amount comes out anywhere other than $250, in which case a document stating $250 is
already in providers' inboxes and has to be corrected rather than quietly replaced.

---

## Open — awaiting a founder decision

These are the blockers. Each is detailed in `07-OPEN-DECISIONS-AND-CONFLICTS.md`.

| ID | Decision | Owner | Needed by | Recommendation |
|---|---|---|---|---|
| **C1** | Price, payer, billing timing | Logan + TJ | Before the pilot terms PDF is approved — **D-012** puts $250 in writing to every interested provider | The amount is settled in practice at $250/hire, provider-only. What is genuinely still open is the **trigger** and whether the first hire is free |
| **C2** | What defines a Client | TJ + Logan | Day 3 | Narrowed by **D-010**: interview-terms acceptance stays the Client definition and the pilot start; a second, fuller acceptance sits at the first hire. Eligibility stays the product's feature gate underneath |
| **O-1** | Site #1 | Logan | Day 1 | Where Logan already has an advisor relationship, not the biggest school |
| **C5** | Does the provider pipeline stay in MedJobs? | Logan + TJ | Tuesday session | Decide the target; don't migrate now (D-008) |
| **C8** | Founder handoff schedule for conversion meetings | Logan | Week 2 | Logan Wks 1–2 → Chantel co-runs Wks 3–4 → Chantel alone Wk 5+; measured as Gate F |
| **O-11** | Does provider cold outreach continue at current intensity? | Logan + TJ | Tuesday session | Answer it explicitly. An unanswered capacity question defaults to doing both, badly |

---

## Reversed

### D-006 · 2026-09-04 · Pod · Book the meeting; do not send collateral instead

**Status:** REVERSED 2026-09-20 by **D-009**.

**What it said:** direct from the meeting — *"Don't just throw on the contract. Don't throw them to the
landing page. Just be like, why don't you meet with Dr. DuBose?"* The meeting converts at ~100% of those who
agree to it; collateral sent in its place converts at an unknown and probably much lower rate. Collateral
supports the booking; it does not replace it.

**Why it was reversed:** the ~100% figure is conversion *of those who agree to a meeting*, and it says
nothing about how many agree. Making the meeting the ask is what the cold email was failing at. D-009 keeps
the guard that mattered — nothing is thrown at a cold provider — by putting the pack behind a confirmed
*yes* rather than in front of it.

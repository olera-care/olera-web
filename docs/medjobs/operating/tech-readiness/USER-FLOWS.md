# End-to-End User Flows

> **Owner:** Esther · **Method:** [`../09-TECH-READINESS.md`](../09-TECH-READINESS.md) Pass B and Pass E.
> **Status:** templates. Fill each by walking the flow in the real system, not by reading code.

**How to fill a step.** One row per thing the user encounters. Note what *should* happen and what
*actually* happens — a step where those differ is a defect, and goes in
[`DEFECTS.md`](DEFECTS.md) as well.

**Row template**

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|

Two questions to keep asking at every step, because they surface most real failures:

- **Does the user know what to do next?** A screen that is technically correct and leaves someone
  guessing is a defect.
- **Does the *next owner* know it is their turn?** Handoffs fail silently more often than screens do.

---

## 1. Provider

First contact → meeting → profile completion → staffing need → candidate intro → interview → hire →
six shifts → billing → ongoing support.

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|
| | | | | | | |

**Specifically check:** the cold email link and where it lands · the magic link (multi-use for providers) ·
the eligibility screener · what the candidate board shows when it is empty · the invite flow · the
internship agreement · what the provider sees after a hire · how they learn what they owe.

---

## 2. Student

First exposure → application → vetting → profile → match → intro → interview → hire → six shifts →
ongoing support.

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|
| | | | | | | |

**Specifically check:** every route in from the five activation channels · a partial application and
whether it can be resumed · document and video upload · what a student sees while waiting to be vetted ·
the interview invitation and acceptance · what happens after the hire.

---

## 3. Admin Team

Prospecting (PR1 / ST1), outbound, CRM management, follow-up, handoff to Logan.

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|
| | | | | | | |

**Specifically check:** can a new team member tell what to work on next without being told · does every
queue empty · is every outcome loggable without a workaround · does a booked meeting reach Logan with
context attached.

---

## 4. Sales lead — Logan

Before, during and after a provider or advisor meeting.

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|
| | | | | | | |

**Specifically check:** what he can see about a prospect before the call · whether the outcome can be
recorded in under a minute · whether Chantel is left with everything she needs, including anything he
promised in the meeting.

---

## 5. User success — Chantel

Client success, university success, student success, fulfillment, follow-up, moving entities forward.

| Step | Trigger | UI / surface | Comms sent | State recorded | Next owner sees | Expected vs. actual |
|---|---|---|---|---|---|---|
| | | | | | | |

**Specifically check:** can she see every active client and every active university in one place · does
anything tell her a client has gone quiet · can she see which of the five activation channels a student
came from · can she tell which placements are approaching six shifts · what she has to do outside the
platform.

This is the heaviest internal seat in the operating model. If anything here runs on memory or a private
spreadsheet, it will not survive a second site — record it.

---

## 6. Tech and leadership oversight

What Esther and the founders need to see to know the operating system is working.

| Question | Where it is answered today | Adequate? |
|---|---|---|
| How many providers are at each stage? | | |
| How many students are at each stage? | | |
| What is stuck, and for how long? | | |
| What is the conversion rate between each stage? | | |
| What is the cycle time between each stage? | | |
| How many placements have reached six shifts? | | |
| How much has been invoiced and collected? | | |
| Which activation channel is producing students? | | |
| What broke this week? | | |

**If a question has no answer, that is an instrumentation gap** — record it in the matrix even when the
underlying workflow is fine.

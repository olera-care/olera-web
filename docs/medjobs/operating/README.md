# MedJobs Operating Workspace

**The single source of truth for how Olera commercializes MedJobs** — strategy, operating protocol, roles,
metrics, experiments, decisions, and iteration history, from MVP through early scale.

> **New here? Read in this order:**
> 1. [`00-EXECUTIVE-OPERATING-PLAN.md`](00-EXECUTIVE-OPERATING-PLAN.md) — the whole strategy, ~12 minutes
> 2. [`02-ROLES-AND-CADENCE.md`](02-ROLES-AND-CADENCE.md) — your lane and your week
> 3. [`protocols/`](protocols/) — the SOP you run from daily
>
> **Founders:** `00-` §10 and [`07-OPEN-DECISIONS-AND-CONFLICTS.md`](07-OPEN-DECISIONS-AND-CONFLICTS.md)
> are the two things that need you. **Six blockers.**

---

## What is in here

| File | What it is for | Owner | Updated |
|---|---|---|---|
| [`00-EXECUTIVE-OPERATING-PLAN.md`](00-EXECUTIVE-OPERATING-PLAN.md) | **Layer 1.** What MedJobs 2.0 is, the operating model, the pod, metrics, path to scale, founder decisions | Pod | On strategy change |
| [`01-EXECUTION-PLAYBOOK.md`](01-EXECUTION-PLAYBOOK.md) | **Layer 2.** The seven stages, the ten-day readiness sprint, the operating week, failure triage, handoff contracts | Pod | Weekly |
| [`02-ROLES-AND-CADENCE.md`](02-ROLES-AND-CADENCE.md) | Who owns what, a week in each person's life, the daily zero-out, meeting cadence, absence coverage | Pod | On team change |
| [`03-METRICS.md`](03-METRICS.md) | North star, the five rates, the four health signals, sources, targets, the weekly pack | Esther | Weekly |
| [`04-SCALE-GATES.md`](04-SCALE-GATES.md) | The six gates that say we may scale, and the three-stage scaling plan | Pod | Monthly |
| [`05-EXPERIMENTS.md`](05-EXPERIMENTS.md) | What stays liquid, the running register, the queue, completed results | Chantel | Weekly |
| [`06-DECISIONS.md`](06-DECISIONS.md) | Every operating decision with its reasoning and **what would reverse it** | Pod | On decision |
| [`07-OPEN-DECISIONS-AND-CONFLICTS.md`](07-OPEN-DECISIONS-AND-CONFLICTS.md) | **Where sources disagree, named explicitly** + open questions and their owners | Pod | On discovery |
| [`08-ITERATION-LOG.md`](08-ITERATION-LOG.md) | Jank log, weekly entries, protocol change history — the memory of the model | Esther | Weekly |
| [`protocols/`](protocols/) | **P1–P7.** The SOPs. What an intern is handed on day one | Lane owners | On change |
| [`sources/`](sources/) | Distilled primary material — the meeting and Grazy's protocol | — | On new input |

---

## The one-paragraph version

MedJobs 2.0 is an **operated placement service** that puts pre-health university students into paid caregiver
jobs at non-medical home care agencies, **one university catchment at a time**. It has already run manually
end to end and made ~$6,000; what is unproven is running it **without a founder in every step**. Two funnels
— providers on the demand side, partners and students on the supply side — meet in one marketplace and
produce one billing event: a **confirmed placement**. Four people own it: **Grazy** (demand), **Chantel**
(conversion and accounts), **Sess** (supply and data), **Esther** (the system). The target is proving the
model on one site well enough to pass six gates, then repeating it on two more, then delegating it to
interns. **January 5** — the CRP submission needing customer traction and revenue — is the date everything
works backward from.

---

## Working agreements

1. **This workspace is the source of truth.** If it is not written here, it is not agreed.
2. **Protocols govern mechanics; experiments govern messages.** If you are changing *what we say*, that is
   `05-EXPERIMENTS.md`. If you are changing *who gets touched and when*, that is a protocol change and it
   gets logged.
3. **Conflicts get named, never silently reconciled.** When a source disagrees with the system or with
   another source, it goes in `07-` before anything changes.
4. **Decisions carry a reversal condition.** A decision you cannot revisit honestly is a belief.
5. **Findings are worth as much as conversions.** Surface breaks; never work around them silently.
6. **One clear next action per row, always.** Grazy's rule, and the one everything else serves.

---

## Relationship to the engineering docs

This workspace is the **operating layer**. The existing MedJobs documentation is the **engineering layer**.
They are peers and they must stay consistent — same vocabulary, same state names, same funnel.

| Layer | Document | Read it when |
|---|---|---|
| **Operating** | this directory | Running the business: who does what, what we measure, when we scale |
| **Engineering** | [`../OPERATIONAL_BRIEF.md`](../OPERATIONAL_BRIEF.md) | Changing code: the state machine, the outcomes map, discipline rules G1–G10, deferred registry D1–D25 |
| **Engineering** | [`../EXECUTIVE_SUMMARY.md`](../EXECUTIVE_SUMMARY.md) | Orienting on the system conceptually |
| **Engineering** | [`../PROVIDER_FUNNEL_BUILD_PLAN.md`](../PROVIDER_FUNNEL_BUILD_PLAN.md) | The provider-side product loops, placements, pricing as shipped |
| **Engineering** | [`../PARTNER_RECRUITMENT_SYSTEM.md`](../PARTNER_RECRUITMENT_SYSTEM.md) | The partner/stakeholder funnel spec |
| **Ops infra** | [`../EMAIL_LAUNCH_PLAN.md`](../EMAIL_LAUNCH_PLAN.md) | Deliverability, warmup, sending caps |

**The rule:** an operating decision that requires a code change goes to TJ with a note in `08-ITERATION-LOG.md`.
An engineering change that alters the funnel gets reflected here in the same week. Drift between the two
layers is how a team ends up with a protocol nobody can actually execute.

---

## Maintenance

| Cadence | Who | What |
|---|---|---|
| Daily | Everyone | Jank findings → `08-ITERATION-LOG.md` |
| Weekly (Tue) | Esther | Metrics pack → `03-METRICS.md`; review per `02-ROLES-AND-CADENCE.md` §5 |
| Weekly (Fri) | Esther | Weekly entry in `08-`; close or escalate items in `07-` |
| On decision | The owner | Entry in `06-DECISIONS.md`; strike the item in `07-` |
| On protocol change | Lane owner | Update the protocol; log the change and its evidence in `08-` |
| Monthly | Pod + Logan | Gate review against `04-SCALE-GATES.md` |

**A document nobody updates is worse than no document** — it silently becomes wrong while still being
believed. If a file here has not been touched in a month and the business has moved, fix it or delete it.

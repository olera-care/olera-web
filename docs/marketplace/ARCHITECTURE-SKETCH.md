# Olera Marketplace — System Architecture (v9)

One city. The profile sits between the tracks and feeds both continuously. Claiming is not a
provider stage — it is the gate inside Track B.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                                  ◆ active lever

FAMILY                                                  PROVIDER
──────────────────────────────────────────────────      ──────────────────────────────────
ORGANIC   ◆PAID ADS                                     ◆CITY DIRECTORY
  │         │                                             │
  └────┬────┘                                             ▼
       ▼                                                P1  LISTED
F1  ENTRY SURFACE                                           the available pool
    provider · editorial · benefits page                  │
    │                                                     ▼
    ▼                                                   ◆P2  OUTREACH
F2  CTA                                                     accelerates claiming
    ├─ BENEFITS CTA ──────►  A1                           │
    ├─ CONNECTION CARD ───►  B1                           │
    └─ QUESTION ──────────►  P3                           │
    │                                                     │
    └───────────────────────────┐                         │
◆REFERRAL PARTNER · flyer / QR ─┤                         │
CR-F ───────────────────────────┤                         │
                                ▼                         ▼
┌────────────────────┐  ┌───────────────────┐  ┌────────────────────────────┐
│  TRACK A           │  │  F3  PROFILE      │  │  TRACK B                   │
│  AID PROGRAM       │  │      & PLAN       │  │  PROVIDER CONNECTION       │
│                    │  │                   │  │                            │
│   A1  MATCHED      │◄─│  enriches         │─►│   B1  DELIVERED            │
│        │           │  │  continuously     │  │        │                   │
│        ▼           │  │                   │  │        ▼                   │
│   A2  FIRST STEP   │  │  deepens whatever │  │   P3  CLAIM  or  CREATE    │
│        │           │  │  is already       │  │        │       ◄── self-   │
│        ▼           │  │  running          │  │        │           serve   │
│   A3  ACTING       │◄─│                   │─►│        ├──►  CR-P          │
│        │           │  │                   │  │        ▼                   │
│        ▼           │  │                   │  │   B2  RESPONDED            │
│   A4  SECURED      │  │                   │  │        │                   │
│                    │  │                   │  │        ▼                   │
│                    │  │                   │  │   B3  TALKED               │
│                    │  │                   │  │        │                   │
│                    │  │                   │  │        ▼                   │
│                    │  │                   │  │   B4  CARE ESTABLISHED     │
└──────────┬─────────┘  └───────────────────┘  └──────┬──────────────┬──────┘
           │                                           │              │
           └───────────────────────┬───────────────────┘              ▼
                                   ▼                          PROVIDER OUTCOME
                            FAMILY OUTCOME

CR-P  - - ►  CLIENT ACQUISITION GROWTH  ·  CAREGIVER STAFFING
```

---

## What changed, and why

### The tracks start at F2, not after the plan

A CTA can start a track immediately. The profile is not upstream of the tracks — it sits **beside**
them, enriching continuously and deepening whatever is already running. That is why F3 is drawn
between Track A and Track B with arrows pointing both ways: it is a parallel process, not a stage.

Profile and plan are one box. The plan is what the profile becomes once it carries enough to act on;
splitting them added a step nobody occupies.

### Claiming is a gate inside Track B, not a provider stage

`connectionRequestEmail` carries `providerName · familyName · careType · city · viewUrl` —
**no family email, no phone.** The provider gets a teaser and a link. Full contact details are
behind the click, and the click is the claim.

So B1 lands on a **listed** provider — nothing about the provider funnel gates delivery — and the
provider must pass **P3** before B2 is possible. P3 now sits between B1 and B2, where it actually
operates.

### P4 is gone

There was no active/inactive barrier in the product. A claimed provider with an empty profile
receives and answers families exactly like any other. Removing the box removes a distinction we do
not enforce.

### The provider funnel is now two boxes

**P1 LISTED** puts a provider in the available pool that Track B draws from — that is the whole
point of being listed. **◆P2 OUTREACH** does not gate anything; it *accelerates claiming*, which is
why it is drawn as a parallel lever rather than a prerequisite.

Self-serve providers arrive straight at P3. CR-P sits immediately after P3, where a provider first
becomes reachable, with the commercial products branching off it and touching nothing on the B path.

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 profile & plan · CR-F

**Provider** — P1 listed · ◆P2 outreach · P3 claim or create (inside Track B) · CR-P

**Track A** — A1 matched · A2 first step · A3 acting · A4 secured

**Track B** — B1 delivered · P3 claim or create · B2 responded · B3 talked · B4 care established

---

## Status

**Exists** — both CTAs · continuous enrichment · the listed pool · outreach · claim-or-create · both
tracks' execution · the claim gate exactly as drawn.

**Partial** — the plan. The aid half exists; there is no provider half and no combined plan object.

**Proposed** — referral partners, CR-F, CR-P.

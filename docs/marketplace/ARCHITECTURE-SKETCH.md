# Olera Marketplace — System Architecture (v10)

One city. Everything a family gives us flows into one profile-and-plan, which feeds both tracks
continuously. Claiming is the gate inside Track B.

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
    provider · editorial ·                                │
    benefits page                                         ▼
    │                                                   ◆P2  OUTREACH
    ├─ QUESTION ───────────────────────────────────────►    accelerates claiming
    ▼                                                     │
F2  CTA                                                   │
    benefits CTA                                          │
    connection card                                       │
    │                                                     │
    └───────────────────────────┐                         │
◆REFERRAL PARTNER · flyer / QR ─┤                         │
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
│        │           │  │  ┌─────────────┐  │  │        ▼                   │
│        ▼           │  │  │    CR-F     │  │  │   B2  RESPONDED            │
│   A4  SECURED      │  │  └─────────────┘  │  │        │                   │
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

## What changed

**The question left the CTA layer.** It branches between F1 and F2 and points at **P2**. A question
is a reason to work that provider, not a family workflow — and unlike the two CTAs it can arrive
with no name and no email, so there may be no family to enrol. F2 is now reserved for the two CTAs
that produce a contactable family: **benefits CTA** and **connection card**.

**The bypass arrows are gone, and nothing was lost.** Both CTAs now flow into F3. Because F3 is not
a gate, a half-filled profile immediately yields a half plan, and that half plan starts its track.
The bypass was only ever needed to route around a gate that no longer exists.

**CR-F sits inside F3.** It is not a stage the family passes through — it is help available while
the profile and plan are being built and worked. Enrichment before, during or after the interaction
all read the same on the diagram.

**Referral partners enter directly above F3.** The partner already did the persuading; the landing
page collects the profile. No entry surface, no CTA.

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 profile & plan (contains CR-F)

**Provider** — P1 listed · ◆P2 outreach · P3 claim or create (inside Track B) · CR-P

**Track A** — A1 matched · A2 first step · A3 acting · A4 secured

**Track B** — B1 delivered · P3 claim or create · B2 responded · B3 talked · B4 care established

---

## Two mechanics the diagram compresses

**Why the tracks need different things.** Track A's eligibility engine filters on state, age, income
band, Medicaid status and veteran status. Track B matches on care type, location and contact. The
benefits CTA deposits the first set; the connection card deposits the second. So a family who
arrives through one has half a plan until the profile deepens — which is CR-F's most concrete job:
one conversation crosses both thresholds.

**Why P3 gates B2.** The lead email carries the provider's name, the family's name, care type, city
and a link — no family email, no phone. The provider cannot act without clicking, and the click is
the claim.

---

## Status

**Exists** — both CTAs · questions with optional contact · continuous enrichment · the listed pool ·
outreach · claim-or-create · both tracks' execution · the claim gate.

**Partial** — the plan. The aid half exists; there is no provider half and no combined plan object.

**Proposed** — referral partners, CR-F, CR-P.

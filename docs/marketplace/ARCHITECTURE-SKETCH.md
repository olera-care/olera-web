# Olera Marketplace — System Architecture (v11)

One city. Everything below the entry layer lives in the Portal.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                              ◆ active lever

FAMILY                                                  PROVIDER
────────────────────────────────────────────────────    ─────────────────────────────
◆REFERRAL   ORGANIC   ◆PAID ADS                         ◆CITY         PROVIDER CLAIMS
PARTNER       │         │                               DIRECTORY     THEIR OWN PAGE
  │           └────┬────┘                                 │             │
  │                ▼                                      ▼             │
  │         F1  ENTRY SURFACE                           P1  LISTED      │
  │             provider page · editorial ·               │             │
  │             benefits page                             ▼             │
  │             │                                       ◆P2  OUTREACH   │
  │             ├─ QUESTION ───────────────────────────►                │
  │             ▼                                         │             │
  │         F2  CTA                                       │             │
  │             ├─ benefits CTA                           │             │
  │             └─ connection card ────────────────┐      │             │
  │             │                                   │     │             │
  └──────┬───────┘                                  │     │             │
         └──────────────────────┐                   │     │             │
                                ▼                   ▼     ▼             ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│  PORTAL                                                                           │
│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────────────────────┐  │
│  │ TRACK A          │  │ F3  PROFILE       │  │ TRACK B                        │  │
│  │ AID PROGRAM      │  │                   │  │ PROVIDER CONNECTION            │  │
│  │                  │  │                   │  │                                │  │
│  │ A1  MATCHED      │◄─│ enriches          │─►│ B1  DELIVERED                  │  │
│  │      │           │  │ continuously      │  │      │                         │  │
│  │      ▼           │  │                   │  │      ▼                         │  │
│  │ A2  FIRST STEP   │  │ deepens whatever  │  │ P3  CLAIM  or  CREATE          │  │
│  │      │           │  │ is already        │  │      │                         │  │
│  │      ▼           │  │ running           │  │      ▼                         │  │
│  │ A3  ACTING       │◄─│                   │─►│ B2  RESPONDED                  │  │
│  │      │           │  │ ┌─────────────┐   │  │      │      ┌─────────────┐    │  │
│  │      ▼           │  │ │    CR-F     │   │  │      ▼      │    CR-P     │    │  │
│  │ A4  SECURED      │  │ └─────────────┘   │  │ B3  TALKED  │  quarterly  │    │  │
│  │                  │  │                   │  │      │      └─────────────┘    │  │
│  │                  │  │                   │  │      ▼                         │  │
│  │                  │  │                   │  │ B4  CARE ESTABLISHED           │  │
│  └────────┬─────────┘  └───────────────────┘  └────┬─────────────────┬─────────┘  │
└───────────┼────────────────────────────────────────┼─────────────────┼────────────┘
            │                                        │                 │
            └───────────────────┬────────────────────┘                 │
                                ▼                                      ▼
                         FAMILY OUTCOME                        PROVIDER OUTCOME
```

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 profile (contains CR-F)

**Provider** — P1 listed · ◆P2 outreach · P3 claim or create (inside Track B)

**Track A** — A1 matched · A2 first step · A3 acting · A4 secured

**Track B** — B1 delivered · P3 claim or create · B2 responded · B3 talked · B4 care established

---

## CR-P is a relationship, not a step

It does three things that share no position in the flow: it drives claiming out of **P2**, it is the
conversation when something lands at **B1** or **P3**, and it is a standing **quarterly** check-in
with every provider whether or not anything has landed.

So it is drawn the way CR-F is drawn — a box living inside the track rather than a stage the
provider passes through. That is the honest shape: a provider is in the CR-P relationship
continuously from the moment we start working them, and the diagram should not imply they graduate
into it or out of it.

---

## Three ways into Track B

The three arrows entering Track B come from the three labelled sources above it: the **connection
card** (straight to B1), the **listed pool** by way of outreach, and a **provider claiming their own
page** (straight to P3).

Nothing about the provider funnel gates delivery. B1 lands on a listed provider; **P3 is what
unblocks B2**, because the lead email carries a link and no family contact details.

---

## Two mechanics the diagram compresses

**Why the tracks need different facts.** Track A filters on state, age, income band, Medicaid status
and veteran status. Track B matches on care type, location and contact. The benefits CTA deposits
the first set, the connection card the second — so a family who arrives through one has half a plan
until the profile deepens. Crossing both thresholds in one conversation is CR-F's most concrete job.

**Why the profile is not a gate.** It enriches continuously and yields whatever plan it can at any
depth. A partial profile starts a track immediately; more profile deepens what is already running.

---

## Status

**Exists** — both CTAs · questions · continuous enrichment · the listed pool · outreach ·
claim-or-create · both tracks' execution · the claim gate.

**Partial** — the plan the profile produces. The aid half exists; there is no provider half and no
combined plan object.

**Proposed** — referral partners, CR-F, CR-P.

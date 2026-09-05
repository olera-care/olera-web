# Olera Marketplace — System Architecture (v7)

One city. Boxes and arrows; the notes below carry what the diagram deliberately does not.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                                ◆ active lever

FAMILY                                              PROVIDER
──────────────────────────────────────────────      ────────────────────────────────────────
ORGANIC    ◆PAID ADS                                ◆CITY DIRECTORY      PROVIDER SELF-SERVE
   │          │                                       │                       │
   └─────┬────┘                                       ▼                       │
         ▼                                          P1  LISTED                │
F1  ENTRY SURFACE                                     │                       │
    │                                                 ▼                       │
    ▼                                               ◆P2  OUTREACH             │
F2  CTA                                               │                       │
    ├─ CONNECTION CARD   - - ►  B1                    ▼                       ▼
    ├─ BENEFITS CTA      - - ►  A1                  P3  CLAIM  or  CREATE  ◄──┘
    └─ QUESTION          - - ►  P3                    │
    │                            │                    ▼
    │                            └──────►  CR-F     P4  ACTIVE
    ▼                                        │        │
F3  ENRICHMENT   ◄────  ◆REFERRAL PARTNER    │        ▼
    │                                        │      CR-P
    ▼                                        │        │
F4  PROFILE COMPLETE                         │        └ - - ►  CLIENT ACQUISITION GROWTH
    │                                        │                 CAREGIVER STAFFING
    ▼                                        │
F5  FAMILY PLAN                              │
    ├────────────────────────────────────────┘
    │
    ├───────────────────────────┐
    ▼                           ▼
┌──────────────────────┐  ┌───────────────────────────┐
│  TRACK A             │  │  TRACK B                  │
│  AID PROGRAM         │  │  PROVIDER CONNECTION      │
│                      │  │                           │
│   A1  MATCHED        │  │   B1  DELIVERED  - - ► P3 │
│        │             │  │        │                  │
│        ▼             │  │        ▼                  │
│   A2  FIRST STEP     │  │   B2  RESPONDED           │
│        │             │  │        │                  │
│        ▼             │  │        ▼                  │
│   A3  ACTING         │  │   B3  TALKED              │
│        │             │  │        │                  │
│        ▼             │  │        ▼                  │
│   A4  SECURED        │  │   B4  CARE ESTABLISHED    │
└──────────┬───────────┘  └──────┬─────────┬──────────┘
           │                     │         │
           └────────────┬────────┘         ▼
                        ▼           PROVIDER OUTCOME
                 FAMILY OUTCOME
```

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 enrichment · F4 profile complete · F5 family plan ·
CR-F consumer relations

**Provider** — P1 listed · P2 outreach · P3 claim or create · P4 active · CR-P consumer relations

**Track A** — A1 matched · A2 first step · A3 acting · A4 secured

**Track B** — B1 delivered · B2 responded · B3 talked · B4 care established

---

## The three CTAs behave differently, and the product proves it

**Connection Card** and **Benefits CTA** both capture a contactable family, so both open the normal
family workflow and can start a track from baseline.

**A question does not.** `POST /api/questions` accepts a guest with no name and no email —
*"question fires immediately, name/email optional (added via PATCH later)."* The provider is
notified and the notification carries a claim link, but we may have no way to reach the family. So a
question is drawn as a provider-side trigger, not a family-workflow entry.

*(Note: that route's own docstring says guests "must provide asker_name + asker_email." The code
says otherwise. Worth reconciling.)*

---

## Why Family Plan is its own step

F4 is **what we know**. F5 is **what we recommend** — the branch that selects Track A, Track B or
both. Different objects, and the branch is a real decision.

**Status: partial.** The aid half exists — the token-addressed guide, the action plan component, the
navigator packet that computes which program to name first. There is no combined plan covering
providers and programs together. F5 is drawn as the architecture intends it, not as shipped.

Profile complete and payload complete are one state, per the correction — F4. The payload is that
profile delivered to a provider at B1.

---

## Where consumer relations sits

**CR-F** enters from **F2**, not from F4. The families least likely to finish on their own are
exactly the ones who need help, so triggering on completion would reach the wrong people. Its output
merges into F5's outflow, which is why it supports execution of both tracks as well as enrichment.
Enrichment can therefore happen before, during or after the interaction without changing the shape.

**CR-P** enters after **P4**. Claiming is one click from an email and does not mean a provider will
answer the next family. CR-P turns a claim into participation.

**Client Acquisition Growth** and **Caregiver Staffing** branch off CR-P on a dotted line. They are
not on the path to B1, and nothing commercial gates Track B. A provider receives families through
the free product whether or not they ever buy anything.

---

## Active levers

Marked ◆: **paid ads**, **referral partners**, the **city directory** sweep, and **provider
outreach**. These are where we can push to create density in a city. Organic family arrival and
provider self-serve are inbound and are not marked.

---

## The bypasses

Five, each landing on a real indexed step: **connection card ⇢ B1**, **benefits CTA ⇢ A1**,
**question ⇢ P3**, **referral partner → F3**, and **B1 ⇢ P3**.

The last one is the reciprocal relationship worth keeping in view: delivering an opportunity to an
unclaimed provider is itself what most often activates them. Track B uses the provider funnel and
feeds it.

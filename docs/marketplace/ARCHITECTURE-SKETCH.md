# Olera Marketplace — System Architecture (v8)

One city. The profile is one continuous object; each track has its own threshold on it.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                                  ◆ active lever

FAMILY                                                  PROVIDER
────────────────────────────────────────────────────    ────────────────────────────────────
ORGANIC   ◆PAID ADS      ◆REFERRAL PARTNER              ◆CITY DIRECTORY
                          flyer / QR                                    PROVIDER SELF-SERVE
  │         │                               │             │                     │
  └────┬────┘                               │             ▼                     │
       ▼                                    │           P1  LISTED              │
F1  ENTRY SURFACE                           │             │                     │
    provider · editorial ·                  │             ▼                     │
    benefits page                           │           ◆P2  OUTREACH           │
    │                                       │             │                     │
    ▼                                       │             ▼                     ▼
F2  CTA                                     │           P3  CLAIM  or  CREATE  ◄┘
    ├─ CONNECTION CARD   - - ►  B1          │             │
    ├─ BENEFITS CTA      - - ►  A1          │             ▼
    └─ QUESTION          - - ►  P3          │           P4  ACTIVE
    │                                       │             │
    ├──────►  CR-F ─┐                       │             ▼
    ▼               │                       │           CR-P
F3  PROFILE  ◄──────┴───────────────────────┘             │
    enriches continuously                                 └ - - ►  CLIENT ACQUISITION
    │                                                              GROWTH
    ▼                                                              CAREGIVER STAFFING
F4  FAMILY PLAN
    ┌─────────────────────────────────────────────────┐
    │  PROVIDER HALF   care type · location           │──►  B1
    │  AID HALF        state · age · income ·         │──►  A1
    │                  medicaid · veteran             │
    └─────────────────────────────────────────────────┘

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

## The model that resolves partial completion

**The profile is not a gate and completion is not binary.** F3 is one object that enriches
continuously. F4 forms as soon as the profile carries what a track needs — and each track needs
something different:

| Half of the plan | Needs |
|---|---|
| **Provider half** → B1 | care type · location · contact |
| **Aid half** → A1 | state · age · income band · Medicaid status · veteran status |

Those are the real fact sets. Track B's matching runs on care type and geography. Track A's
eligibility engine filters on `min_age`, `max_income_single`, `requires_medicaid`,
`requires_veteran` against the family's stated facts.

**So arriving through one CTA does not hand you the other half.** A connection card gives care type
and location — enough to name providers, not enough to test eligibility. A benefits CTA gives state
and situation facts — enough to match programs, not necessarily enough to send a provider a lead
worth acting on. Neither is a partial version of the other; they are different questions.

This is why the dotted lines from F2 are not bypasses. **The CTA deposits exactly enough profile to
cross one threshold**, and the plan that forms is a real plan — just half of one.

**Enrichment then does two things at once:** it crosses the *other* threshold, opening the second
half of the plan, and it deepens the half already running. Better program fit, a better payload for
the provider. Nothing has to be redone.

---

## What this means for CR-F

CR-F's job is now specific rather than vague: **one conversation can cross both thresholds.** A
family who came in through a connection card is missing five facts for the aid half; a family who
came in through the benefits CTA is missing contact and care specifics for the provider half. Either
gap is a few minutes of conversation.

That is also why CR-F enters from **F2** rather than after the plan. It is not a service for
completed families — it is the fastest route from a half plan to a whole one.

---

## Entry surfaces are two kinds

**Content surfaces** — provider page, editorial article, benefits page — carry the CTAs. They lead
to F2.

**A referral flyer or QR code** leads straight to F3. There is no CTA in between because the partner
already did the persuading; the landing page's job is to collect the profile.

Both are entry surfaces. They differ in what they hand the family on arrival.

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 profile · F4 family plan · CR-F

**Provider** — P1 listed · P2 outreach · P3 claim or create · P4 active · CR-P

**Track A** — A1 matched · A2 first step · A3 acting · A4 secured

**Track B** — B1 delivered · B2 responded · B3 talked · B4 care established

F3 and the old F4 are now one box. Profile complete and payload complete were the same state; the
payload is the profile delivered to a provider at B1.

---

## Status

**Exists:** both CTAs and their fact capture · continuous profile enrichment · both tracks'
execution · the provider funnel end to end.

**Partial:** the plan. The aid half exists — the token-addressed guide, the action plan, the
navigator packet that picks which program to name first. There is no provider half and no combined
plan object. F4 is drawn as intended, not as shipped.

**Proposed:** referral partners, CR-F and CR-P as defined roles.

---

## Open

A question that later gains an email (`question_email_enriched`) turns an anonymous asker into a
contactable family. That recovery path is real and is left out of the diagram to keep it readable.

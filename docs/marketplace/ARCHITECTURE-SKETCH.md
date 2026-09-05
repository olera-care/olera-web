# Olera Marketplace — System Architecture

One city, both sides. Everything below the entry layer lives in the Portal.

**Track A = Aid Establishment. Track B = Care Establishment.**

---

```
                                       ┌────────────┐
                                       │  ONE CITY  │
                                       └──────┬─────┘
            ┌─────────────────────────────────┴──────────────────────────┐
            ▼                                                            ▼

FAMILY                                                PROVIDER
───────────────────────────────────────────────────   ─────────────────────────────────────
SOURCES                                               SOURCES
FS1 REFERRAL   FS2 ORGANIC   FS3 PAID ADS             P1  LISTED  PS1 ORGANIC  PS2 REFERRAL
  │              │             │                        │         │            │
  │              └───────┬──────┘                       ▼         └──────┬──────┘
  │                      ▼                            P2  OUTREACH       │
  │           F1  ENTRY SURFACE                         │                │
  │               provider page                         │                │
  │               editorial                             │                │
  │               benefits page                         │                │
  │               │                                     │                │
  │               ├─ FQ   QUESTION ─────────────────────►                │
  │               ▼                                     │                │
  │           F2  CTA                                   │                │
  │               ├─ F2a  BENEFITS CTA                  │                │
  │               ├─ F2b  CONNECTION CARD ──────────────►                │
  │               ├─ F2c  LIVE PROFILE ─────────────────►                │
  │               │                                     │                │
  └────────┬──────┘                                     │                │
           └─────────────────────────┐                  │                │
                                     ▼                  ▼                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  PORTAL                                                                                  │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │ TRACK A              │  │ F3  FAMILY PROFILE  │  │ TRACK B                         │  │
│  │ AID ESTABLISHMENT    │  │                     │  │ CARE ESTABLISHMENT              │  │
│  │                      │  │    ┌────────────┐   │  │          ┌────────────┐         │  │
│  │                      │  │    │    CR-F    │   │  │          │    CR-P    │         │  │
│  │                      │  │    └────────────┘   │  │          └────────────┘         │  │
│  │                      │  │                     │  │                                 │  │
│  │ A1  MATCHED          │◄─│       enriches      │  │ P3  PROVIDER PROFILE            │  │
│  │      │               │  │     continuously    │  │     CLAIM or CREATE             │  │
│  │      ▼               │  │                     │  │      │                          │  │
│  │ A2  APPLICATION      │  │                     │  │      ▼                          │  │
│  │      │               │  │                     │─►│ B1  FAMILY-PROVIDER MATCHED     │  │
│  │      ▼               │  │                     │  │      │                          │  │
│  │ A3  AID ESTABLISHED  │  │                     │  │      ▼                          │  │
│  │                      │  │                     │  │ B2  QUALIFIED                   │  │
│  │                      │  │                     │  │      │                          │  │
│  │                      │  │                     │  │      ▼                          │  │
│  │                      │  │                     │  │ B3  CARE ESTABLISHED            │  │
│  └──────────┬───────────┘  └─────────────────────┘  └─────┬────────────────┬─────────┘   │
└─────────────┼─────────────────────────────────────────────┼────────────────┼────────────┘
              │                                             │                │
              └──────────────────────┬──────────────────────┘                │
                                     ▼                                       ▼
                              FAMILY OUTCOME                         PROVIDER OUTCOME
                            FO1 aid   FO2 care                       PO  new business
```

---

## Index

**S = source.** FS is a family source, PS a provider source.

| | |
|---|---|
| **FS1 · FS2 · FS3** | referral · organic · paid ads |
| **F1** | entry surface — provider page, editorial, benefits page |
| **FQ** | question |
| **F2** | CTA — **F2a** benefits CTA · **F2b** connection card · **F2c** live profile |
| **F3** | family profile |
| **CR-F** | family consumer relations |
| **P1 · PS1 · PS2** | listed · organic · referral |
| **P2** | outreach |
| **P3** | provider profile, claim or create |
| **CR-P** | provider consumer relations |
| **A1 · A2 · A3** | matched · application · aid established |
| **B1 · B2 · B3** | family–provider matched · qualified · care established |
| **FO1 · FO2** | aid · care |
| **PO** | new business |

---

## Three family signals feed outreach

**FQ, F2b and F2c** all point at P2. Each is a family naming a specific provider, which is the reason
to work that provider — whether or not the family goes on to a full profile. **F2a** does not,
because it names no provider.

That is the reciprocal loop: family demand makes provider outreach worth doing, and provider
outreach makes the next family's match land on someone who can act.

## Both sides acquire the same way

Referral and organic on both; paid ads on the family side only. The one asymmetry is **P1**, the
listed directory — there is no family equivalent, and there should not be.

---

## One thing to decide

**P3 above B1 describes where we want to be, not where we are.** Today the match comes first: a
family inquires, the connection is created against a listed provider, and the notification email —
a link with no family contact details — is what causes the claim. Shipped order is match → claim →
respond. Drawing P3 first says something better: a pool of claimed providers receiving matches. CR-P,
PS1 and PS2 are the machines that would get us there.

---

## Two mechanics the diagram compresses

**Why the tracks need different facts.** Track A filters on state, age, income band, Medicaid status
and veteran status. Track B matches on care type, location and contact. F2a deposits the first set,
F2b the second — so a family arriving through one has half a plan until the profile deepens.
Crossing both thresholds in one conversation is CR-F's clearest job.

**Why the profile is not a gate.** It enriches continuously and yields whatever it can at any depth.
A partial profile starts a track immediately; more profile deepens what is already running.

---

## Status

**Exists** — F2a, F2b, FQ · continuous enrichment · P1 · P2 · P3 · both tracks' execution.

**Partial** — F2c live profile · the plan F3 produces (the aid half exists; there is no provider
half).

**Proposed** — FS1, PS1, PS2, CR-F, CR-P.

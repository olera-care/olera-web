# Olera Marketplace — System Architecture

One city, both sides. Everything below the entry layer lives in the Portal.

**Track A = Aid Establishment. Track B = Care Establishment. PG = the paid growth layer.**

---

```
                                       ┌────────────┐
                                       │  ONE CITY  │
                                       └──────┬─────┘
            ┌─────────────────────────────────┴──────────────────────────┐
            ▼                                                            ▼

                              PG1  DEMAND
FAMILY                             │                  PROVIDER
───────────────────────────────────┼───────────────   ─────────────────────────────────────
SOURCES                            ▼                  SOURCES
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
│  PORTAL                                                                                  │   PG
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────────┐  │   GROWTH SYSTEM
│  │ TRACK A              │  │ F3  FAMILY PROFILE  │  │ TRACK B                         │  │   ─────────────
│  │ AID ESTABLISHMENT    │  │                     │  │ CARE ESTABLISHMENT              │  │
│  │                      │  │    ┌────────────┐   │  │          ┌────────────┐         │  │
│  │                      │  │    │    CR-F    │   │  │          │    CR-P    │         │  │
│  │                      │  │    └────────────┘   │  │          └────────────┘         │  │
│  │                      │  │                     │  │                                 │  │
│  │ A1  MATCHED          │◄─│       enriches      │  │ P3  PROVIDER PROFILE            │◄─┼── PG2  PRESENCE
│  │      │               │  │     continuously    │  │     CLAIM or CREATE             │  │       profile
│  │      ▼               │  │                     │  │      │                          │  │       reviews
│  │ A2  APPLICATION      │  │                     │  │      ▼                          │  │       search & AI
│  │      │               │  │                     │─►│ B1  FAMILY-PROVIDER MATCHED     │◄─┼── PG3  RESPONSE
│  │      ▼               │  │                     │  │      │                          │  │       minutes
│  │ A3  AID ESTABLISHED  │  │                     │  │      ▼                          │  │       needs intake
│  │                      │  │                     │  │ B2  QUALIFIED                   │◄─┼── PG4  FOLLOW-UP
│  │                      │  │                     │  │      │                          │  │       re-engagement
│  │                      │  │                     │  │      ▼                          │  │       scheduling
│  │                      │  │                     │  │ B3  CARE ESTABLISHED            │  │
│  └──────────┬───────────┘  └─────────────────────┘  └─────┬────────────────┬─────────┘   │
└─────────────┼─────────────────────────────────────────────┼────────────────┼────────────┘
              │                                             │                │
              └──────────────────────┬──────────────────────┘                │
                                     ▼                                       ▼
                              FAMILY OUTCOME                         PROVIDER OUTCOME ───────► PG5  REPORTING
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
| **PG** | growth system — **PG1** demand · **PG2** presence · **PG3** response · **PG4** follow-up · **PG5** reporting |

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

## PG — the growth system

PG is not a step. It is a paid service layer over one provider's arc, and its arms act in five
different places, which is why it cannot be drawn as a box inside Track B.

**PG1 demand** funds FS3 for one provider. It is the only arm on the family side of the diagram, and
the only one that creates supply rather than working it.

**PG2 presence** brings P3 up to the standard the rest of the system already assumes: complete
profile, current photos and pricing, reviews answered, structured data an AI can read.

**PG3 response** takes over the provider's side of B1 — the inquiry is answered in the provider's
name, in minutes, nights and weekends included.

**PG4 follow-up** works B1 toward B2 for weeks, ending in a booked assessment.

**PG5 reporting** runs the other way. PO's numbers come back monthly as the provider's scorecard.

**Sold at CR-P.** Not in the portal. PG needs an onboarding month that no self-serve flow can
deliver, and the shipped ad ladder already treats anything above $600 as a conversation. The portal
holds the account and the monthly numbers; it does not hold the purchase. The free market snapshot is
what earns the CR-P call, delivered through P2.

**One boundary.** PG3 and PG4 must cover every inquiry a provider receives, including the ones that
never came from Olera. The moment they become a reason to route B1 preferentially, the network stops
being open and the paid layer starts taxing the family's match.

**Track A stays out of PG.** Screening a family for VA and Medicaid is already free and already runs
on the family side. Selling it to the provider who then gets paid by those programs is the one arm
with real legal exposure, and it would put a free-network asset behind a paywall.

---

## One package, one price

A no-brainer price can only buy work whose marginal cost is near zero. That splits PG cleanly, though
not along the line the five arms suggest.

**Near zero.** PG2 and PG5 are already automated. PG3 and PG4 are near zero too — but only on
inquiries that came through Olera, where we already hold the family and already message them. On
those, answering is a rewrite of work we do today, not new labor.

**Not near zero.** PG1 is pass-through money. So is PG3 and PG4 over a provider's *own* inbound —
their forms, their phone — which needs a tracked line and staffed hours that do not exist.

The package is the first list. The second is priced separately.

| | |
|---|---|
| **Market snapshot** | free — the artifact that earns the CR-P call |
| **Growth System · $49/mo** | PG2, PG3, PG4, PG5, scoped to Olera inquiries |
| **Ads** | optional, at cost — PG1 |
| **Full service · $749/mo** | adds the provider's own inbound and managed ad operations |

**Why $49 clears the bar.** One home-care client is worth thousands a month, so a single answered
inquiry pays for the year. The provider does not have to believe our numbers to see that. And it is
cheaper than the meeting it would take to evaluate — which is the real test of a no-brainer.

**What it costs to say this.** `lib/ad-boost/billing.server.ts` holds that plans are flat and all-in,
spend included, never itemized. Unbundling ads contradicts that rule. One of the two has to give.

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

**PG** — **PG1** exists as Ad Boost, but priced all-in rather than as fee plus spend at cost.
**PG2** is partial: completeness scoring, review requests, the Google place link and structured data
exist; managing a provider's Google Business Profile or their own website does not. **PG3** and
**PG4** are proposed — nothing today writes to a family as the provider, and there is no tracked
line. **PG5** is partial: campaign funnel and receipts exist, a booked assessment does not.

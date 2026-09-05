# Olera Marketplace — System Architecture (v14)

We pick a city, then build both sides of it. Everything below the entry layer lives in the Portal.

**Track A = Aid Establishment. Track B = Care Establishment.**

---

```
                                WE PICK A CITY
                               ┌────────────┐
                               │  ONE CITY  │
                               └──────┬─────┘
        ┌─────────────────────────────┴─────────────────────┐
        ▼                                                   ▼

FAMILY                                              PROVIDER
────────────────────────────────────────────────    ───────────────────────────
REFERRAL   ORGANIC   PAID ADS                       P1  LISTED  DIRECT MARKETING
PARTNER      │         │                              │         QR code, flyer
  │          └─────┬────┘                             ▼           │
  │                ▼                                P2  OUTREACH  ▼
  │         F1  ENTRY SURFACE                         │         provider enters
  │             provider page                         │         on their own
  │             editorial                             │           │
  │             benefits page                         │           │
  │             │                                     │           │
  │             ├─ QUESTION ─────────────────────────►            │
  │             ▼                                     │           │
  │         F2  CTA                                   │           │
  │             ├─ benefits CTA                       │           │
  │             ├─ connection card ──────────────────►            │
  │             ├─ live profile ─────────────────────►            │
  │             │                                     │           │
  └──────┬───────┘                                    │           │
         └───────────────────────┐                    │           │
                                 ▼                    ▼           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  PORTAL                                                                        │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐  │
│  │ TRACK A             │  │ F3  FAMILY PROFILE │  │ TRACK B                 │  │
│  │ AID ESTABLISHMENT   │  │                    │  │ CARE ESTABLISHMENT      │  │
│  │                     │  │   ┌────────────┐   │  │      ┌────────────┐     │  │
│  │                     │  │   │    CR-F    │   │  │      │    CR-P    │     │  │
│  │                     │  │   └────────────┘   │  │      └────────────┘     │  │
│  │                     │  │                    │  │                         │  │
│  │                     │  │                    │  │ P3  PROVIDER PROFILE    │  │
│  │                     │  │                    │  │     CLAIM or CREATE     │  │
│  │                     │  │                    │  │      │                  │  │
│  │                     │  │                    │  │      ▼                  │  │
│  │ A1  MATCHED         │◄─│      enriches      │─►│ B1  FAMILY-PROVIDER     │  │
│  │      │              │  │    continuously    │  │     MATCHED             │  │
│  │      ▼              │  │                    │  │      │                  │  │
│  │ A2  APPLICATION     │  │                    │  │      ▼                  │  │
│  │      │              │  │                    │  │ B2  QUALIFIED           │  │
│  │      ▼              │  │                    │  │      │                  │  │
│  │ A3  AID ESTABLISHED │  │                    │  │      ▼                  │  │
│  │                     │  │                    │  │ B3  CARE ESTABLISHED    │  │
│  └─────────┬───────────┘  └────────────────────┘  └────┬────────────┬───────┘  │
└────────────┼───────────────────────────────────────────┼────────────┼──────────┘
             │                                           │            │
             └─────────────────────┬─────────────────────┘            │
                                   ▼                                  ▼
                            FAMILY OUTCOME                    PROVIDER OUTCOME
                               aid or care                        new business
```

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 family profile

**Provider** — P1 listed · P2 outreach · P3 provider profile, claim or create

**Track A** — A1 matched · A2 application · A3 aid established

**Track B** — B1 family–provider matched · B2 qualified · B3 care established

**CR-F** sits at the top of the family profile: everyone who completes a CTA, and everyone from a
referral partner. **CR-P** sits at the top of Track B: every provider we have an outreach for,
claimed or not, wherever they are in B1–B3.

---

## Three family signals feed outreach

**Question**, **connection card** and **live profile** all point at P2. Each is a family telling us
a specific provider matters to them, which is the reason to work that provider — regardless of
whether the family goes on to a full profile. The benefits CTA does not, because it names no
provider.

This is the reciprocal loop: family demand is what makes provider outreach worth doing, and provider
outreach is what makes the next family's match land on someone who can act.

---

## One thing to decide

**P3 above B1 describes where we want to be, not where we are.** Today the match comes first: a
family inquires, the connection is created against a listed provider, and the notification email —
a link with no family contact details — is what causes the claim. The shipped order is match →
claim → respond.

Drawing P3 first says something better: a pool of claimed providers receiving matches. CR-P and
direct marketing are the two machines that would get us there.

---

## Two mechanics the diagram compresses

**Why the tracks need different facts.** Track A filters on state, age, income band, Medicaid status
and veteran status. Track B matches on care type, location and contact. The benefits CTA deposits
the first set, the connection card the second — so a family arriving through one has half a plan
until the profile deepens. Crossing both thresholds in one conversation is CR-F's clearest job.

**Why the profile is not a gate.** It enriches continuously and yields whatever it can at any depth.
A partial profile starts a track immediately; more profile deepens what is already running.

---

## Status

**Exists** — all CTAs · questions · continuous enrichment · the listed pool · outreach ·
claim-or-create · both tracks' execution.

**Partial** — the plan the profile produces. The aid half exists; there is no provider half.

**Proposed** — referral partners, direct marketing, CR-F, CR-P.

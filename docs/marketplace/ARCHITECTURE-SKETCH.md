# Olera Marketplace — System Architecture (v15)

One city, both sides. Everything below the entry layer lives in the Portal.

**Track A = Aid Establishment. Track B = Care Establishment.**

---

```
                                  ┌────────────┐
                                  │  ONE CITY  │
                                  └──────┬─────┘
          ┌──────────────────────────────┴───────────────────────┐
          ▼                                                      ▼

FAMILY                                              PROVIDER
─────────────────────────────────────────────────   ─────────────────────────────
FS1 REFERRAL   FS2 ORGANIC   FS3 PAID ADS           P1  LISTED    PS1 ORGANIC
  │              │             │                      │           PS2 REFERRAL
  │              └───────┬──────┘                     ▼             │
  │                      ▼                          P2  OUTREACH    │
  │           F1  ENTRY SURFACE                       │             │
  │               provider page                       │             │
  │               editorial                           │             │
  │               benefits page                       │             │
  │               │                                   │             │
  │               ├─ FQ   QUESTION ───────────────────►             │
  │               ▼                                   │             │
  │           F2  CTA                                 │             │
  │               ├─ F2a  BENEFITS CTA                │             │
  │               ├─ F2b  CONNECTION CARD ────────────►             │
  │               ├─ F2c  LIVE PROFILE ───────────────►             │
  │               │                                   │             │
  └────────┬──────┘                                   │             │
           └───────────────────────┐                  │             │
                                   ▼                  ▼             ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│  PORTAL                                                                        │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐  │
│  │ TRACK A             │  │ F3  FAMILY PROFILE │  │ TRACK B                 │  │
│  │ AID ESTABLISHMENT   │  │                    │  │ CARE ESTABLISHMENT      │  │
│  │                     │  │   ┌────────────┐   │  │      ┌────────────┐     │  │
│  │                     │  │   │    CR-F    │   │  │      │    CR-P    │     │  │
│  │                     │  │   └────────────┘   │  │      └────────────┘     │  │
│  │                     │  │                    │  │                         │  │
│  │ A1  MATCHED         │◄─│      enriches      │  │ P3  PROVIDER PROFILE    │  │
│  │      │              │  │    continuously    │  │     CLAIM or CREATE     │  │
│  │      ▼              │  │                    │  │      │                  │  │
│  │ A2  APPLICATION     │  │                    │  │      ▼                  │  │
│  │      │              │  │                    │─►│ B1  FAMILY-PROVIDER     │  │
│  │      ▼              │  │                    │  │     MATCHED             │  │
│  │ A3  AID ESTABLISHED │  │                    │  │      │                  │  │
│  │                     │  │                    │  │      ▼                  │  │
│  │                     │  │                    │  │ B2  QUALIFIED           │  │
│  │                     │  │                    │  │      │                  │  │
│  │                     │  │                    │  │      ▼                  │  │
│  │                     │  │                    │  │ B3  CARE ESTABLISHED    │  │
│  └─────────┬───────────┘  └────────────────────┘  └────┬────────────┬───────┘  │
└────────────┼───────────────────────────────────────────┼────────────┼──────────┘
             │                                           │            │
             └─────────────────────┬─────────────────────┘            │
                                   ▼                                  ▼
                          FO  FAMILY OUTCOME                PO  PROVIDER OUTCOME
                              aid or care                       new business
```

---

## Index

**Family sources** — FS1 referral · FS2 organic · FS3 paid ads

**Family** — F1 entry surface · FQ question · F2 CTA (F2a benefits CTA, F2b connection card,
F2c live profile) · F3 family profile · CR-F

**Provider sources** — PS1 organic · PS2 referral

**Provider** — P1 listed · P2 outreach · P3 provider profile, claim or create · CR-P

**Track A** — A1 matched · A2 application · A3 aid established

**Track B** — B1 family–provider matched · B2 qualified · B3 care established

**Outcomes** — FO family outcome, aid or care · PO provider outcome, new business

---

## Three family signals feed outreach

**FQ, F2b and F2c** all point at P2. Each is a family naming a specific provider, which is the reason
to work that provider — whether or not the family goes on to a full profile. **F2a** does not,
because it names no provider.

That is the reciprocal loop: family demand makes provider outreach worth doing, and provider
outreach makes the next family's match land on someone who can act.

## Both sides acquire the same three ways

Family: referral, organic, paid. Provider: organic, referral — plus P1, the listed directory, which
has no family equivalent. The symmetry is the point; the directory is the asymmetry.

---

## One thing to decide

**P3 above B1 describes where we want to be, not where we are.** Today the match comes first: a
family inquires, the connection is created against a listed provider, and the notification email —
a link with no family contact details — is what causes the claim. Shipped order is match → claim →
respond. Drawing P3 first says something better: a pool of claimed providers receiving matches. CR-P
and the PS1/PS2 sources are the machines that would get us there.

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

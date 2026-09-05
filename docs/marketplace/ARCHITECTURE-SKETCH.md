# Olera Marketplace — System Architecture (v13)

One city. Everything below the entry layer lives in the Portal.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                        ◆ active lever

FAMILY                                            PROVIDER
──────────────────────────────────────────────    ────────────────────────────
◆REFERRAL   ORGANIC   ◆PAID ADS                   P1  LISTED    ◆DIRECT
PARTNER       │         │                           │           MARKETING
  │           └────┬────┘                           ▼           QR code, flyer
  │                ▼                              ◆P2  OUTREACH   │
  │         F1  ENTRY SURFACE                       │             ▼
  │             provider page                       │           provider enters
  │             editorial                           │           on their own
  │             benefits page                       │             │
  │             │                                   │             │
  │             ├─ QUESTION ─────────────────────►                │
  │             ▼                                   │             │
  │         F2  CTA                                 │             │
  │             ├─ benefits CTA                     │             │
  │             └─ connection card ───────────────────────┐       │
  │             │                                   │     │       │
  └──────┬───────┘                                  │     │       │
         └──────────────────────┐                   │     │       │
                                 ▼                  ▼     ▼       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PORTAL                                                                     │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐  │
│  │ TRACK A          │  │ F3  FAMILY PROFILE │  │ TRACK B                 │  │
│  │ AID PROGRAM      │  │                    │  │ PROVIDER CONNECTION     │  │
│  │                  │  │   ┌────────────┐   │  │      ┌────────────┐     │  │
│  │                  │  │   │    CR-F    │   │  │      │    CR-P    │     │  │
│  │                  │  │   └────────────┘   │  │      └────────────┘     │  │
│  │                  │  │                    │  │                         │  │
│  │                  │  │                    │  │ P3  PROVIDER PROFILE    │  │
│  │                  │  │                    │  │     CLAIM or CREATE     │  │
│  │                  │  │                    │  │      │                  │  │
│  │                  │  │                    │  │      ▼                  │  │
│  │ A1  MATCHED      │◄─│       enriches     │─►│ B1  FAMILY-PROVIDER     │  │
│  │      │           │  │     continuously   │  │     MATCHED             │  │
│  │      ▼           │  │                    │  │      │                  │  │
│  │ A2  APPLICATION  │  │                    │  │      ▼                  │  │
│  │      │           │  │                    │  │ B2  QUALIFIED           │  │
│  │      ▼           │  │                    │  │      │                  │  │
│  │ A3  ESTABLISHED  │  │                    │  │      ▼                  │  │
│  │                  │  │                    │  │ B3  CARE ESTABLISHED    │  │
│  └────────┬─────────┘  └────────────────────┘  └────┬────────────┬───────┘  │
└───────────┼─────────────────────────────────────────┼────────────┼──────────┘
            │                                         │            │
            └────────────────────┬────────────────────┘            │
                                 ▼                                 ▼
                          FAMILY OUTCOME                   PROVIDER OUTCOME
```

---

## Index

**Family** — F1 entry surface · F2 CTA · F3 family profile

**Provider** — P1 listed · ◆P2 outreach · P3 provider profile, claim or create

**Track A** — A1 matched · A2 application · A3 established

**Track B** — B1 family–provider matched · B2 qualified · B3 care established

**CR-F** sits at the top of the family profile: everyone who completes a CTA, and everyone from a
referral partner. **CR-P** sits at the top of Track B: every provider we have an outreach for,
claimed or not, wherever they are in B1–B3.

---

## Two provider streams

**P1 listed → ◆P2 outreach.** Providers already in the directory. We work them.

**◆Direct marketing.** A QR code or flyer asking providers to claim or create their profile. They
enter on their own.

Both land in Track B. Neither is a prerequisite for the other.

---

## One thing to decide

**P3 above B1 describes where we want to be, not where we are.** Today the match comes first: a
family inquires, the connection is created against a listed provider, and the notification email —
a link with no family contact details — is what causes the claim. The shipped order is match →
claim → respond.

Drawing P3 first says something better: a pool of claimed providers receiving matches. CR-P and
direct marketing are exactly the machines that would get us there.

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

**Exists** — both CTAs · questions · continuous enrichment · the listed pool · outreach ·
claim-or-create · both tracks' execution.

**Partial** — the plan the profile produces. The aid half exists; there is no provider half.

**Proposed** — referral partners, direct marketing, CR-F, CR-P.

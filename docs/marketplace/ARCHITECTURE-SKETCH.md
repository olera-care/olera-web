# Olera Marketplace — System Architecture (v12)

One city. Everything below the entry layer lives in the Portal.

**Track A = Aid Program. Track B = Provider Connection.**

---

```
ONE CITY                                                              ◆ active lever

FAMILY                                                  PROVIDER
────────────────────────────────────────────────────    ─────────────────────────────
◆REFERRAL   ORGANIC   ◆PAID ADS                         ◆CITY         PROVIDER ENTERS
PARTNER       │         │                               DIRECTORY     ON THEIR OWN
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
│  │                  │  │   ┌────────────┐  │  │          ┌────────────┐        │  │
│  │                  │  │   │    CR-F    │  │  │          │    CR-P    │        │  │
│  │                  │  │   └────────────┘  │  │          └────────────┘        │  │
│  │                  │  │                   │  │                                │  │
│  │ A1  MATCHED      │  │                   │  │ P3  CLAIM  or  CREATE          │  │
│  │      │           │  │                   │  │      │                         │  │
│  │      ▼           │  │      enriches     │  │      ▼                         │  │
│  │ A2  FIRST STEP   │◄─│    continuously   │─►│ B1  MATCHED                    │  │
│  │      │           │  │                   │  │      │                         │  │
│  │      ▼           │  │                   │  │      ▼                         │  │
│  │ A3  APPLICATION  │  │                   │  │ B2  RESPONDED                  │  │
│  │      │           │  │                   │  │      │                         │  │
│  │      ▼           │  │                   │  │      ▼                         │  │
│  │ A4  ESTABLISHED  │  │                   │  │ B3  TALKED                     │  │
│  │                  │  │                   │  │      │                         │  │
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

**Family** — F1 entry surface · F2 CTA · F3 profile

**Provider** — P1 listed · ◆P2 outreach · P3 claim or create

**Track A** — A1 matched · A2 first step · A3 application · A4 established

**Track B** — B1 matched · B2 responded · B3 talked · B4 care established

**CR-F** sits at the top of the profile: everyone who completes F2, and everyone who arrives from a
referral partner, gets it. **CR-P** sits at the top of Track B: every provider we have an outreach
for is targeted, claimed or not, wherever they are in B1–B4. Both are relationships, not steps —
which is why both sit above the sequence rather than inside it.

---

## One thing to decide

**P3 above B1 describes where we want to be, not where we are.** Today the match comes first: a
family inquires, the connection is created against a listed provider, and the notification email —
which carries a link and no family contact details — is what causes the claim. So the shipped order
is match → claim → respond.

Drawing P3 first says something different and arguably better: a pool of claimed providers receiving
matches. It is a real target state, and CR-P sitting above it is exactly the machine that would get
us there. Worth naming the gap rather than letting the diagram quietly assert it is closed.

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
claim-or-create · both tracks' execution.

**Partial** — the plan the profile produces. The aid half exists; there is no provider half.

**Proposed** — referral partners, CR-F, CR-P.

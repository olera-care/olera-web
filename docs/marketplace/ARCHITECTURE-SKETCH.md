# Olera Marketplace — System Architecture (v5)

One city. Three ways a family enters, three ways a provider enters, converging on Track A. Track B
runs alongside for families. Consumer Relations sits between the technology and a successful outcome
on both sides.

This iteration is about **flows you can trace with a finger**. Roles, SOPs, instrumentation, metrics
and commercial logic come later.

---

## The architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   ONE CITY                                       │
│      enough family flow + enough provider network to make connections happen     │
└──────────────────────────┬───────────────────────────────────────────────────────┘
  ┌───────────────────────┴────────────────────┐
  ▼                                            ▼
FAMILY SIDE                                     PROVIDER SIDE
────────────────────────────────────────────    ────────────────────────────────────────────
ORGANIC     PAID ADS      REFERRAL              IN THE CITY        PROVIDER BUILDS
   │           │          PARTNER               DIRECTORY          THEIR OWN PAGE
   └─────┬─────┘             │                     │                     │
         ▼                   │                     ▼                     │
  ENTRY SURFACE              │                  LISTED                   │
  provider · city ·          │                  unclaimed                │
  editorial · program        │                     │                     │
         │                   │                     ▼                     │
    ┌────┴─────┐             │                  OUTREACH                 │
    ▼          ▼             │                  4 emails / 7 days,       │
 CONNECTION  BENEFITS        │                  then a call              │
 CARD        RESULTS CTA     │                     │                     │
    │          │             │                     ▼                     ▼
 a lead     a living         │                  CLAIMED  ◄───────────────┘
 goes out   plan is          │                     │   ▲
 NOW        created          │                     │   └── a family's inquiry,
    │          │             ▼                     │       question or review
    ▼          ▼        FAMILY PROFILE             │       reaches an UNCLAIMED
 6-STEP     3-STEP      WORKFLOW                   │       provider. The email
 ENRICH-    BENEFITS    starts here                │       carries a claim link
 MENT       ENRICHMENT       │                     ▼
    │          │             │                  ACTIVE
    └─────┬────┴─────────────┘                  profile complete, responding
          │                                        │
  ╔═══════╧══════════════╗                         │      ╔══════════════════════╗
  ║ CONSUMER RELATIONS   ║                         │      ║ CONSUMER RELATIONS   ║
  ║ helps the family     ║                         └─────►║ helps the provider   ║
  ║ finish, and work     ║                                ║ get value from the   ║
  ║ the tracks           ║                                ║ families they get    ║
  ╚═══════╤══════════════╝                                ╚═════════╤════════════╝
          ▼                                                         │
  PAYLOAD COMPLETE                                                  │
  the full family profile                                           │
          │                                                         │
  ┌───────┴─────────────────────────────┐                           │
  ▼                                     ▼                           ▼
┌──────────────────────────┐  ┌─────────────────────────────────────────────────────┐
│  TRACK B — AID PROGRAM   │  │  TRACK A — PROVIDER CONNECTION                      │
│                          │  │                                                     │
│    program matched       │  │    opportunity delivered to a provider —            │
│         │                │  │    at ANY provider state, claimed or not             │
│         ▼                │  │         │                                           │
│    first step issued     │  │         ▼                                           │
│         │                │  │    provider responds                                │
│         ▼                │  │         │                                           │
│    family acting         │  │         ▼                                           │
│         │                │  │    family and provider talk                         │
│         ▼                │  │         │                                           │
│    AID SECURED           │  │         ▼                                           │
│                          │  │    CARE ESTABLISHED                                 │
└────────────┬─────────────┘  └──────────────┬──────────────────────┬───────────────┘
             │                               │                      │
             └───────────────┬───────────────┘                      ▼
                             ▼                              PROVIDER OUTCOME
                     FAMILY OUTCOME                          ─────────────────
                     ─────────────────                       became a paying
                     care established                        client
                     and / or aid secured

The Connection Card sends an opportunity into Track A immediately, before the payload
is complete. That is the shortest path a family can take to a provider today.
```

---

## The six pathways, traced

### Family

**Organic or paid ad → provider or city page.** The family lands on a provider they were already
looking at, engages the **Connection Card**, gives who needs care, care type, urgency and contact —
**and a lead goes out to that provider immediately**. Only afterwards are they offered the six-step
enrichment that finishes the profile.

**Organic or paid ad → program or editorial page.** The family engages the **benefits results CTA**,
gives contact, and a living plan is created for them at a private link. They are then offered a
three-step benefits enrichment — recipient, timeline, payment. This path reaches Track B first.

**Referral partner *(proposed)*.** A partner hands the family off directly into the profile
workflow. No entry surface, no partial lead first. They arrive to complete their information, and
they converge on the same milestone.

All three end at **PAYLOAD COMPLETE** — the full family profile.

### Provider

**Already in the city directory.** When we open a city the providers are already there, **listed and
unclaimed**. We run outreach — four emails over seven days, then a call — until they **claim**.

**The provider builds their own page.** They arrive **claimed**. They are never listed-unclaimed and
never receive outreach.

**A family's interest reaches them.** An inquiry, question or review lands on an unclaimed provider —
the record is created on the spot if it does not exist — and the notification email carries a claim
link. The family, not our outreach, is what activates them.

All three converge on **CLAIMED → ACTIVE**.

---

## Two things the picture has to keep saying

**A provider can receive a family opportunity at any state.** Claimed or not, active or not. Track A
draws from the whole provider funnel, not from its end. The funnel describes how a relationship
deepens, not who is allowed to participate.

**Nothing commercial gates Track A.** A provider receives families through the free product whether
or not they ever pay us for anything. Paid products sit alongside the relationship, never in front
of it.

---

## Where Consumer Relations enters

The same place on both sides: **between the point where technology has got someone in, and the point
where they succeed.**

**Family side — after the CTA, before the payload is complete.** This is where families fall out. The
enrichment is optional and comes after they have already got what they came for, so a large share
simply stop. Consumer Relations helps them finish, understand their options, and then work whichever
track is relevant. Not a meeting in every journey — an intervention available where a family stalls.

**Provider side — after the claim, before they are genuinely active.** Claiming is one click from an
email; it does not mean the provider will answer the next family. Consumer Relations helps them get
value from the families they already receive. That is also the natural relationship through which
other Olera products eventually get introduced — later, and never as a condition of Track A.

**The symmetry is real, with one asymmetry worth keeping.** On the family side the human help is
needed *before* the milestone. On the provider side it is needed *after* it. In both cases the role
is the same: the human layer that turns an automated entry into a completed outcome.

---

## Outcomes

Track A produces both outcomes. Track B contributes only to the family outcome. A family may run one
track or both, and the family outcome is the composite of whichever ran.

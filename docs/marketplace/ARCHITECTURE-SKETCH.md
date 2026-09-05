# Olera Marketplace — System Architecture (v4)

Three interacting state machines drawn as two funnels and a convergence layer: **family state** (how
much we know, and what that unlocks), **provider state** (how activated the provider is), and
**match state** (what has happened between one family opportunity and one provider).

Neither funnel is linear, and the architecture says so. Every claim is grounded in the shipped
product; things that do not exist are named as such.

---

## The architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ONE MARKET — families needing care, and the providers who serve that area       │
└───────────────────────────┬──────────────────────────────────────────────────────┘
  ┌────────────────────────┴───────────────────────┐
  ▼                                                ▼
FAMILY STATE                                   PROVIDER STATE
how much we know, and what it unlocks          how activated the provider is
───────────────────────────────────────────    ───────────────────────────────────────────
F1  ARRIVED                                    P1  LISTED
    organic · paid ads ·                           in the directory, unclaimed.
    referral partners (proposed)                   Inventory, not a pipeline stage
    surfaces: provider · city ·                  │
    editorial · program · finder                 ▼
  │                                            P2  IN OUTREACH
  ├ - - ►  F3    T1 referral                       Admin Team · 4 emails / 7 days,
  │              partner                           then a call. The only path we
  ▼                                                control
F2  INTENT CAPTURED                              │
    recipient · care type ·                      │  T4  also reached directly from
    urgency · contact                            │      a lead, question or review
  │                                              │      email — family demand
  ├ - - ►  M1    T2 TODAY'S                      │      ACTIVATES the provider
  │              DEFAULT                         ▼
  ▼                                            P3  CLAIMED
F3  PAYLOAD COMPLETE                               one-click token. A provider who
    the full defined assessment:                   builds their own page starts
    who needs care · timeline ·                    here — no P1, no P2
    care need · payment ·                        │
    location · details                           ▼
  │                                            P4  ACTIVE
  │  feeds Track A and / or Track B                profile complete, responding
  │  depending on what was found
  │                                            CONTACTABLE — a flag, not a rung.
  │                                            A working email is the only real
  │                                            gate on delivery, and it applies at
  │                                            every state above.
  └───────────────────────┬────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  TRACK A — PROVIDER CONNECTION                              entity: LEAD         │
│                                                                                  │
│   M1  LEAD DELIVERED     the payload — complete or partial — reaches a provider. │
│        │                 If no provider record exists, one is CREATED,           │
│        │                 unclaimed, to receive it.  T3                           │
│        ▼                                                                         │
│   M2  PROVIDER RESPONDED accepted, or a non-auto reply in the thread             │
│        │                                                                         │
│        ▼                                                                         │
│   M3  IN CONVERSATION    inbox · phone · email. Mostly off-platform              │
│        │                                                                         │
│        ▼                                                                         │
│   M4  CARE ESTABLISHED   sensed from both sides, not observed                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│  TRACK B — AID PROGRAM                          entity: PROGRAM REFERRAL         │
│                                                                                  │
│   B1  PROGRAM MATCHED    financial · food · health · caregiver                   │
│        │                                                                         │
│        ▼                                                                         │
│   B2  FIRST STEP ISSUED  the call to make, the documents to gather               │
│        │                                                                         │
│        ▼                                                                         │
│   B3  FAMILY ACTING      called · no answer · needs docs · applied · waiting ·   │
│        │                 not eligible · stuck                                    │
│        ▼                                                                         │
│   B4  AID SECURED        NOT TRACKED TODAY — the ladder stops at 'applied'       │
└─────────────────┬──────────────────────────────────────┬─────────────────────────┘
                  ▼                                      ▼
FAMILY OUTCOME                                 PROVIDER OUTCOME
from Track A and / or Track B                  from Track A only
───────────────────────────────────────────    ───────────────────────────────────────────
  care established — with whom, of how           became a paying client
  many talked to, facility vs agency             ──────────────────────────────────
  aid secured — which programs                   COMMERCIAL RELATIONSHIP UNRESOLVED.
  neither — and why                              Ad Boost is the only money today,
  A family may use one track or both             and it is not priced per lead

LEGEND   ───►  primary workflow     - - ►  valid bypass or alternate entry
         T1–T4 are cross-funnel triggers, listed under the diagram
```

---

## Cross-funnel triggers

| | Trigger | Status |
|---|---|---|
| **T1** | **A referral partner delivers a family already fully described** — straight to a complete payload, skipping intent capture | **PROPOSED.** The referral-partner channel does not exist yet |
| **T2** | **Intent alone fires the lead.** The ConnectionCard captures recipient, care type, urgency and contact, creates the inquiry and emails the provider. The assessment runs *after*, as an optional post-submit state | **EXISTS — and it is the default, not the exception** |
| **T3** | **A lead can create the provider.** If a family inquires to a provider with no profile row, `/api/connections/request` inserts one — `type: "organization"`, `claim_state: "unclaimed"`, `source: "seeded"` — in order to deliver the lead | **EXISTS** |
| **T4** | **Family demand activates providers.** Lead, question and review emails all carry a claim token (`generateNotificationUrl`, `action: "lead" \| "question" \| "review"`). Claiming advances the outreach stage to `claimed` | **EXISTS** |
| **T5** | **A provider can create their own page** and is claimed from birth — `source: "user_created"`, never unclaimed | **EXISTS** |
| **T6** | **A complete payload feeds Track A, Track B, or both**, depending on what the assessment found | **PARTIAL.** Both tracks exist; nothing routes between them from a single assessment |

**T2 is the finding that matters most.** What reads as a bypass is the primary path today. The
payload-first route is the intent, not the practice — so the diagram marks T2 as *today's default*
rather than pretending the funnel runs in the order we would design it.

---

## The states, and why these and not others

### Family — three states

**F1 ARRIVED · F2 INTENT CAPTURED · F3 PAYLOAD COMPLETE**

Entry surface was dropped as a stage. A provider page, a city page and the Benefits Finder are
*places*, not states of the family — the same family is in the same state whichever one they land
on. Surface belongs as a **dimension** on F1 (which surfaces convert), not a box.

F3 means the full defined assessment is complete, whether or not any interface displays it back.

### Provider — four states and one flag

**P1 LISTED · P2 IN OUTREACH · P3 CLAIMED · P4 ACTIVE**, plus **CONTACTABLE**.

*Listed*, not *discovered* — the state is that a listing exists and is unclaimed, not how we came to
know about it. A provider is listed whether we scraped them, a partner named them, or a family's
inquiry caused the row to be created.

**"Eligible to receive" was wrong and is gone.** There is no eligibility gate. The only thing that
actually determines whether a lead can be delivered is **a working email address** — which is why
admin has a `needs_email` queue, an email pre-verification cron and a deliverability watch. That is
a flag that applies at every rung, not a rung of its own. A provider can be unclaimed and
contactable (gets leads), or claimed and uncontactable (bounces).

So the two things are now visibly separate: **how activated a provider is** (P1→P4, a ladder we
advance through outreach) and **whether they can receive an opportunity right now** (contactable,
orthogonal).

### Match — four states

**M1 LEAD DELIVERED · M2 PROVIDER RESPONDED · M3 IN CONVERSATION · M4 CARE ESTABLISHED**

M4 is sensed, not observed: the family is asked whether the provider got back to them, the provider
is asked whether the family became a client. No independent confirmation exists.

### Track B — four states

**B1 PROGRAM MATCHED · B2 FIRST STEP ISSUED · B3 FAMILY ACTING · B4 AID SECURED**

B3's ladder is real and reported by text. B4 does not exist — the ladder stops at *applied*.

---

## Outcomes

Track A contributes to **both** outcomes. Track B contributes only to the family outcome, because it
produces no second party with a commercial relationship. A family may run one track or both; the
family outcome is the composite of whichever ran.

---

## Open questions

1. **Should the inquiry still fire before the payload exists?** T2 is the biggest design decision on
   the family side, and everything downstream depends on it.
2. **Is there one family home, or two surfaces?** `/portal` has no aid programs; `/m/{token}` has no
   connections and no login.
3. **Should any state gate lead delivery?** Today only contactability does. That may be right.
4. **What confirms care was established** beyond two self-reports?
5. **One canonical aid-program id** — required before *secured* can be tracked.
6. **Provider type as a dimension** on the connection — facility versus home care agency.
7. **Where does revenue attach?** Detached deliberately; needs healthcare regulatory counsel.

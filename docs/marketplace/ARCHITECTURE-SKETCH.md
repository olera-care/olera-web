# Olera Marketplace — System Architecture (sketch)

How a family care need moves through Olera, meets an appropriate provider, and becomes an
established care relationship and commercial value. A sibling to the MedJobs System Architecture,
but **not** the same shape — the differences are the point, and they are set out below.

Architecture only. User journeys, SOPs, communications, instrumentation and metrics come later.

---

## The architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  MARKET 1                                                          │
│  ONE CITY / SERVICE AREA — families needing care + providers in it  │
└──────────────────────────┬─────────────────────────────────────────┘
  ┌───────────────────────┴───────────────────────┐
  ▼                                               ▼
DEMAND SIDE — inbound funnel                  SUPPLY SIDE — standing inventory
──────────────────────────────────────────    ──────────────────────────────────────────
entity: visitor → family → CARE POST          entity: LISTING → claimed provider

F1  ARRIVAL                                   P1  LISTING EXISTS
    Technology · organic, benefits,               Technology · seeded from the
    editorial, provider-funded ads                directory pipeline. Unclaimed.
  │                                             │  Providers do not sign up.
  ▼                                             ▼
F2  NEED EXPRESSED                            P2  REACHABLE
    Family · a care need, on a                    Admin Team · verified email,
    provider page or benefits page                category, service area, not on
  │                                               a do-not-contact list
  ▼                                             │
F3  INTAKE                                      │   No outbound sequence runs here.
    Portal · who needs care ·                   │   The pool waits for demand.
    timeline · care need · payment              │
    · details                                   │
  │                                             │
  ▼                                             │
F4  CARE POST LIVE                              │
    Portal · "Go Live"                          │
    An actionable opportunity:                  │
    matchable, in Find Families,                │
    counted in Demand by city                   │
  │                                             │
  └───────────────────────┬───────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CONNECTION            entity: CONNECTION  (one family ↔ one provider)           │
│                                                                                  │
│   C1  MATCH MADE                          Two directions, one entity:            │
│       Family · or Provider                  inquiry  family → provider           │
│        │                                    request  provider → family           │
│        ▼                                                                         │
│   C2  OPPORTUNITY DELIVERED  ────────────────────────► activates the provider    │
│       Technology · email + one-click token                    (P3, below)        │
│        │                                                                         │
│        ▼                                                                         │
│   C3  PROVIDER RESPONDS                   accepted, or a non-auto thread reply   │
│       Provider                            = "successful connection"              │
│        │                                                                         │
│        ├──────────── silent 7d ──────────────────┐                               │
│        ▼                                         ▼                               │
│   C4  CONVERSATION                        GUIDANCE BRANCH                        │
│       Family + Provider · mostly by            Technology · benefits cascade,    │
│       phone, off-platform                      compare, guide. TJ approves       │
│        │                                       navigator letters                 │
│        ▼                                         │                               │
│   C5  OUTCOME SENSED                             │                               │
│       Two one-tap sensors, because the truth     │                               │
│       is off-platform:                           │                               │
│         family    "did they get back to you?"    │                               │
│         provider  client · talking · no          │                               │
└────────────────────────┬─────────────────────────┼───────────────────────────────┘
                         ▼                         ▼
FAMILY OUTCOME  (per family)                  PROVIDER OUTCOME  (per connection)
──────────────────────────────────────────    ──────────────────────────────────────────
  connected  a real match formed                client    became a paying client
  active     still in the window (7d)           talking   in conversation
  guided     no match, guidance engaged         no        did not convert
  stalled    aged out, provider silent

┌──────────────────────────────────────────────────────────────────────────────────┐
│  P3  PROVIDER ACTIVATED        claimed · portal access · leads with full PII     │
│      Provider · triggered by C2, not before it                                   │
│        │                                                                         │
│        ▼                                                                         │
│  P4  COMMERCIAL — AD BOOST     Admin Team · managed lead-gen, gated on a ≥70%    │
│      profile. Provider-funded ads that drive families back into F1.              │
│      NOT priced per connection. Revenue attaches to the PROVIDER, not the match. │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Why this is not shaped like MedJobs

MedJobs is **two outbound funnels converging**. Both sides are built by the Admin Team, both run
cadences, both hand off at a booked meeting. This system is not that.

**1. One funnel meeting a stock.** The demand side is a genuine inbound funnel. The supply side is a
standing inventory: listings are seeded from the directory pipeline and sit unclaimed. *Providers do
not sign up for Olera.* There is no provider-side cadence running in parallel — the pool waits for
demand and is activated by it.

**2. Activation happens after the first connection, not before it.** The provider's acquisition
moment is the one-click token link in the lead email. So P3 sits below the connection block, and the
arrow runs backwards. Drawing the provider side as a pipeline that completes before matching would
misrepresent the system.

**3. Failure is a designed branch, not an error.** `connected · active · guided · stalled` is a clean
partition of every family that has inquired. Guidance — the benefits cascade, compare, guide — is
where a family goes when matchmaking stalls. A happy-path-only diagram would describe a system we do
not run.

**4. Connections run in both directions.** `inquiry` is family → provider; `request` is provider →
family from Find Families. One entity, two origins.

**5. Truth is off-platform and self-reported.** The real conversation happens by phone. So the
outcome layer is a **sensor** layer, not a system of record: a one-tap question to each side. In
MedJobs the operator logs what happened; here we ask, and sometimes nobody answers.

**6. Revenue does not attach to the match.** MedJobs bills a placement at six shifts — revenue sits
on the unit that moves through the funnel. Here the commercial event is Ad Boost: provider-level,
subscription-shaped, gated on profile completeness, and it *feeds families back into F1*. Revenue
attaches to the provider, not the connection. **This is the difference most likely to produce a
misleading funnel if we draw a straight line from care need to commercial outcome.**

---

## Stages, owners, and what is moving

| Stage | Name | Primary owner | Entity progressing |
|---|---|---|---|
| **F1** | Arrival | Technology | Visitor |
| **F2** | Need expressed | Family, on a Portal surface | Care need |
| **F3** | Intake | Portal | Care need |
| **F4** | Care post live | Portal · *Go Live* | **Care post** — the actionable opportunity |
| **P1** | Listing exists | Technology · directory pipeline | Listing |
| **P2** | Reachable | Admin Team | Listing |
| **P3** | Provider activated | Provider · one-click token | Claimed provider |
| **P4** | Commercial — Ad Boost | Admin Team | Provider |
| **C1** | Match made | Family or Provider | **Connection** |
| **C2** | Opportunity delivered | Technology | Connection |
| **C3** | Provider responds | Provider | Connection |
| **C4** | Conversation | Family + Provider, off-platform | Connection |
| **C5** | Outcome sensed | Family and Provider, one tap each | Connection → client relationship |
| **—** | Guidance branch | Technology · TJ approves navigator letters | Family |

### The unit of analysis changes three times

Care needs are not families. Connections are not care posts. One family can raise several care
needs; one care post can generate several connections; one connection is the only place a client
relationship can form. **F, C and P counts must never be divided into each other without saying
which entity the denominator is.** Two ratios are safe and worth having early:

- **per care post** — how many connections did it produce, and did any reach `connected`
- **per connection** — did the provider respond, and did the family become a client

Family outcome is a **per-family** partition. Provider outcome is **per-connection**. They do not
stack.

---

## Open architectural questions

1. **Is F2 before or after F4?** A family can inquire from a provider page without ever publishing a
   care post, and can publish a care post without inquiring. Drawn as a sequence it is a funnel;
   drawn honestly it may be two entry doors into the same opportunity. This decides whether F1–F4 is
   a funnel we can measure fall-off through at all.

2. **Is the benefits path the same funnel?** Benefits captures contact around eligibility, not around
   a provider, and creates a living plan rather than a care post. It may be a second demand funnel
   that merges at F3 — or its own system that occasionally donates a family.

3. **What is P2 actually gated on?** "Reachable" currently means a verified email, a category and a
   service area. Whether that is the real eligibility bar for receiving an opportunity — or whether
   quality, responsiveness or recency belong in it — is undecided, and it determines who gets sent
   families.

4. **Should provider responsiveness feed matching?** A provider who has never answered a lead still
   receives leads. This is the supply-side analogue of qualification.

5. **Where does Ad Boost sit?** It is drawn as an outcome, but it is also an F1 source. It may
   deserve to be drawn as a loop rather than a terminus.

6. **Is a market the right frame?** MedJobs has Site 1 = one university plus its catchment. The
   equivalent here is a city or service area — but families and providers are matched by area
   independently of any market definition. If we want per-market health, the market has to become a
   real object.

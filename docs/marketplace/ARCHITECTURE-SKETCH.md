# Olera Marketplace — System Architecture (v3)

Two funnels — family and provider — built independently, converging at the lead. Track B, aid
programs, branches off the family funnel rather than forming a third.

Written from an investigation of the shipped product. Every claim below is marked **EXISTS**,
**PARTIAL**, or **PROPOSED**, and nothing proposed is described as though we have it.

---

## The architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ONE MARKET — families needing care, and the providers who serve that area       │
└───────────────────────────┬──────────────────────────────────────────────────────┘
  ┌────────────────────────┴──────────────────────┐
  ▼                                               ▼
FAMILY FUNNEL                                 PROVIDER FUNNEL
entity: FAMILY → CARE NEED → PAYLOAD          entity: LISTING → CLAIMED PROVIDER
──────────────────────────────────────────    ──────────────────────────────────────────
F1  ACQUISITION                               P1  DISCOVERED
    organic · paid ads ·                          in the directory, unclaimed,
    referral partners (proposed)                  built from the data pipeline
  │                                             │
  ▼                                             ▼
F2  ENTRY SURFACE                             P2  IN SEQUENCE
    provider page · city page ·                   Admin Team · 4 emails / 7 days
    editorial · program page ·                    intro · family confidence ·
    benefits finder · ad landing                  why it's free · get verified
  │                                             │
  ▼                                             ▼
F3  CTA — INTENT CAPTURED                     P3  FOLLOW UP
    who needs care · care type ·                  Admin Team · call, broadcast,
    urgency · contact                             or re-engage. Outcome recorded
  │                                             │
  │ ◄── TODAY THE INQUIRY FIRES                 ▼
  │     HERE, BEFORE THE PAYLOAD              P4  CLAIMED
  │     EXISTS                                    Provider · one-click token in
  ▼                                               the lead email is the whole
F4  FAMILY PAYLOAD                                acquisition moment
    needs assessment (6 steps) →                │
    care profile, published live                ▼
    THIN TODAY — see findings                 P5  ELIGIBLE TO RECEIVE
  │                                               category · service area ·
  ├───────────► TRACK B (below)                   verified email · not blocked
  │                                             │
  └────────────────────────┬──────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  TRACK A — MATCH AND FULFILLMENT              entity: CONNECTION → LEAD          │
│                                                                                  │
│   M1  LEAD DELIVERED         the payload reaches a provider as a commercial      │
│       Technology             opportunity. inquiry (family→provider) or           │
│        │                     request (provider→family, from Find Families)       │
│        ▼                                                                         │
│   M2  PROVIDER RESPONDS      accepted, or a non-auto reply in the thread          │
│       Provider                                                                   │
│        │                                                                         │
│        ▼                                                                         │
│   M3  CONVERSATION           inbox · phone · email. Mostly off-platform.          │
│       Family + Provider                                                          │
│        │                                                                         │
│        ▼                                                                         │
│   M4  CARE ESTABLISHED       self-reported from both sides, and only that:        │
│       sensors only           family  "did they get back to you?"                  │
│                              provider  client · talking · no                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
FAMILY OUTCOME                                PROVIDER OUTCOME
──────────────────────────────────────────    ──────────────────────────────────────────
  care established, with whom, of               became a paying client
  how many talked to — facility                 ─────────────────────────────
  vs home care agency                           COMMERCIAL RELATIONSHIP
  aid secured, which programs                   UNRESOLVED — Ad Boost is the
  fall-off and reason at each step              only money today, not per-lead

┌──────────────────────────────────────────────────────────────────────────────────┐
│  TRACK B — AID PROGRAM        a branch of the family funnel, not a third funnel  │
│                                                                                  │
│   from F4 ──►  program matched      by state, eligibility, and category:         │
│                                     financial · food · health · caregiver        │
│                     │                                                            │
│                     ▼                                                            │
│                first step issued    the call to make, the documents to gather.   │
│                     │               TJ approves each letter                      │
│                     ▼                                                            │
│                family acts          called · no answer · needs docs · applied ·  │
│                     │               waiting · not eligible · stuck               │
│                     ▼                                                            │
│                AID SECURED    ◄──   NOT TRACKED. The ladder stops at 'applied'.  │
│                                                                                  │
│   Lives on /m/{token} — no login. The family portal does not show programs.      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Current-state findings

### The finding that matters most

**The inquiry fires before the payload exists.** On a provider page the ConnectionCard captures
*care recipient, care type, urgency* and contact details, creates the inquiry, emails the provider —
**and only then** offers the six-step needs assessment. The assessment is a post-submit enrichment
state, not a gate.

So the first provider to receive a family gets three fields and a message. The care profile, the
timeline, the payment situation and the details are built afterwards, if the family continues. The
mental model of *assess → payload → match* is inverted in the product.

This is not a bug — it is a deliberate friction trade, the same trade made on the provider side by
the one-click claim. But it means **"family payload" is not a thing the system produces before
matching**, and any architecture that assumes it is will describe a product we do not have.

### Family-facing

| | Status | Evidence |
|---|---|---|
| Entry surfaces | **EXISTS** | Provider page, city page (`/[category]/[state]/[city]`), editorial (`/caregiver-support/*`, `/aging-in-america/*`), program pages (`/benefits/*`, `/senior-benefits/*`), Benefits Finder (`/benefits/finder`), browse (`/browse/providers`) |
| The CTA | **EXISTS** | `components/providers/connection-card/` — states: default → intent → email_capture (guest) → enrichment → connected. Guests need only name + email |
| Intent captured | **EXISTS** | `careRecipient` (self/parent/spouse/other) · `careType` (assisted_living/home_care/memory_care/home_health) · `urgency` (asap/within_month/few_months/researching) |
| Needs assessment | **EXISTS, but post-submit** | `EnrichmentState.tsx` — who needs care · timeline · care type · care need · payment · details · Go Live. Admin tracks step-by-step completion and skips |
| Where it is stored | **EXISTS** | `business_profiles` with `type = "family"`; the care need is `metadata.care_post` |
| A structured family payload | **PARTIAL** | No single object. Facts are split across the connection's intent, `metadata.care_post`, and `metadata.benefits_results`. Nothing assembles them into one deliverable thing |
| Family account | **EXISTS** | Supabase auth; guests can inquire without one |
| Family portal | **PARTIAL** | `/portal` → `/portal/inbox`. Also `/portal/profile`, `/portal/discover/providers`, `/portal/settings`. A family can return and see their messages, their profile and their care post |
| Aid programs in the portal | **DOES NOT EXIST** | Saved programs appear nowhere under `/portal`. The aid track lives on `/m/{token}` — *"the token IS the auth… no login wall"* |
| A single place showing everything | **DOES NOT EXIST** | Two surfaces, two auth models, no shared home. This is the gap most likely to be imagined into the architecture |
| Next steps / a care plan | **PROPOSED** | The `/m/{token}` guide is the nearest thing, and it is aid-only |

### Provider-facing

The provider funnel is the most complete part of the system — closer to MedJobs PR-OUT than
anything on the family side.

| | Status | Evidence |
|---|---|---|
| Acquisition funnel | **EXISTS** | `OUTREACH_STAGES`: not_contacted → in_sequence → needs_call (UI "Follow Up") → broadcast_ready → re_engage → call_exhausted → **claimed** / not_interested / archived |
| Cold cadence | **EXISTS** | 4 emails over 7 days: Day 0 introduction · Day 3 family confidence · Day 5 why it's free · Day 7 get verified. Then `needs_call` for manual follow-up |
| Terminal semantics | **EXISTS** | `claimed`, `not_interested` (soft — questions and connections still flow), `archived` (hard — system-wide block) |
| Claiming | **EXISTS** | `ClaimState`: unclaimed / pending / claimed / rejected / archived. One-click signed token in the lead email, 72-hour expiry — *"the email IS the verification"* |
| Trust tiers | **EXISTS** | Full access by token; **Trusted** (destructive actions) only by phone call from the team |
| Activation | **PARTIAL** | A 3-step wizard — profile, matches, engage — but nothing gates receiving leads on completing it |
| Eligible to receive | **EXISTS** | Category, service area, verified email, not on do-not-contact / removal-blocklist |
| Seeing opportunities | **EXISTS** | `/provider/connections`, `/provider/outreach`, `/provider/matches` (Find Families), `/provider/inbox` |
| Delivery | **EXISTS** | Email with a one-click lead link; `lead_received` / `lead_opened` events |
| Responding | **EXISTS** | Accept, decline, message in-thread; `respond-interest` for provider-initiated requests |
| Did the provider contact the family? | **PARTIAL** | On-platform replies are known. Off-platform is inferred from a one-tap sensor |
| Was care established? | **PARTIAL — sensors only** | Family: *"did they get back to you?"* Provider: `client · talking · no`. No independent confirmation exists, and none is possible without asking |

### Internal operations

| | Status | Evidence |
|---|---|---|
| Provider pipeline | **EXISTS** | `/admin/provider-outreach` with stage tabs, follow-up, outcome recording and not-interested reasons |
| Alternative channels | **EXISTS** | `/admin/city-broadcasts` — broadcast pool, who received, who claimed |
| Family submissions | **EXISTS** | `/admin/care-seekers` with the enrichment funnel and per-step drop-off |
| Leads and connections | **EXISTS** | `/admin/leads` (inquiry / application / invitation / needs_email / archived), `/admin/connections` |
| Demand by geography | **EXISTS** | `/admin/demand` — published care posts per city |
| Comms | **EXISTS** | `/admin/family-comms`, `/admin/automations`, `/admin/emails`, ~40 crons |
| Event history | **EXISTS** | Two spines — `provider_activity` and `seeker_activity` |
| Manual work outside the app | **EXISTS** | Provider follow-up calls, Trusted-tier verification, TJ approving navigator letters, Ad Boost campaign setup |

---

## 2. Vocabulary

Grounded in the code, with the conflicts named rather than resolved silently.

| Term | Definition | In the code |
|---|---|---|
| **Family** | The account and profile of the person seeking care | `business_profiles.type = "family"` |
| **Care need** | What the family needs — type, timeline, recipient, payment | `metadata.care_post` |
| **Care post** | The care need, published so providers can find it | `metadata.care_post.status = "active"` |
| **Needs assessment** | The workflow that collects the care need | code says **"enrichment"** |
| **Family payload** | The structured facts we can deliver to a provider | **no term exists** — this is a gap, not a synonym |
| **Inquiry** | A family reaching a provider | `connections.type = "inquiry"` |
| **Request** | A provider reaching a family | `connections.type = "request"` |
| **Connection** | The row linking one family to one provider, with the thread in `metadata.thread` | `connections` |
| **Lead** | The payload delivered to a provider as a commercial opportunity | `lead_received`, `lead_opened`, `generateLeadClaimUrl` — **provider-side only, exactly as proposed** |
| **Provider claim** | The provider proving the listing is theirs | `ClaimState = "claimed"` |
| **Provider activation** | Two meanings today — see conflict below | outreach `stage = "claimed"`; onboarding wizard completion |
| **Successful connection** | Provider posted a non-auto reply, OR status accepted | `lib/connection-temperature` |
| **Care established** | Not modelled. Inferred from two self-report sensors | `metadata.outcome`, `metadata.provider_outcome` |
| **Aid program** | A benefit or assistance program we match and refer | code says **"benefits"** / `WaiverProgram` |

**Conflict 1 — "match" means three different things.** The Find Families feed (`/provider/matches`),
the family's activated matching profile (`matches_activated`), and aid-program matching. Pick one
and rename the others.

**Conflict 2 — "activation" means two things.** A provider is `claimed` in the outreach pipeline, and
separately completes an onboarding wizard. Neither gates receiving leads.

**Conflict 3 — "benefits" versus "aid program."** `/benefits/*` URLs are earned SEO assets and should
not move. Recommend keeping *benefits* as the consumer word and adopting **aid program** as the
internal operating noun. Decide it once.

**Recommended addition — "family payload."** The proposed vocabulary is right and the code agrees:
a family has a *care need*; the *needs assessment* collects it; the structured result is the
*payload*; delivered to a provider it becomes a *lead*. Only the payload has no home in the code.

---

## 3–6. The funnels

Drawn above. Three design decisions worth stating:

**The family funnel ends at the payload, not at the match.** F1–F4 is one entity becoming
understood. Everything after is Track A.

**The provider funnel ends at eligibility, not at the match.** P1–P5 is a listing becoming a
provider who can receive a family. It runs on its own clock, driven by our outreach, not by demand.

**Track B branches from F4 and returns to the family, never to a provider.** It needs no separate
funnel because it produces no second party to acquire — the programs already exist and no one has to
claim them. That is the real reason providers get their own side and aid programs do not.

---

## 7. Open questions

1. **Should the inquiry still fire before the payload exists?** Today's order optimises for
   friction; it means the first provider gets almost nothing. Changing it is the single biggest
   design decision on the family side.
2. **Is there one family home, or two surfaces?** `/portal` has no aid programs; `/m/{token}` has no
   connections. Merging them means giving the token-auth guide an account, or giving the portal the
   aid track.
3. **Should activation gate lead delivery?** A claimed provider with an empty profile receives
   families today.
4. **What confirms care was established?** Both sensors are self-report. There may be no better
   instrument — but we should decide that deliberately.
5. **One canonical aid-program id** — required before *secured* can be tracked at all.
6. **Provider type as a dimension** — facility versus home care agency needs to be on the
   connection, not derived at read time.
7. **What is a market?** Families and providers match by area with no market object between them.
8. **Where does revenue attach?** Unresolved, and deliberately detached from the match. See v2 notes
   on placement-fee exposure — this needs healthcare regulatory counsel, not an architecture
   decision.

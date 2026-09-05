# Olera Marketplace — System Architecture (sketch, v2)

How a family's care need moves through Olera, becomes a plan, and gets executed against **two**
tracks — providers and aid programs — until care is established and aid is secured.

Architecture only. Still a sketch; several things below are deliberately unresolved.

---

## The architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  D1  DEMAND SOURCES                                        entity: VISITOR       │
│                                                                                  │
│   ORGANIC                  PROVIDER-FUNDED ADS         REFERRAL PARTNERS         │
│   Technology               Admin Team · Ad Boost        Admin Team · NEW         │
│   provider pages, city     managed campaigns to a       AAAs, ADRCs, churches,   │
│   pages, editorial,        provider's Olera page        discharge planners,      │
│   program pages            (their spend, our funnel)    senior centers, VSOs     │
│        │                            │                      │  cards + collateral │
│        └────────────────────────────┴──────────────────────┘                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  D2  ENTRY SIGNAL          three weights, one door — all must be accounted for   │
│                                                                                  │
│    QUESTION                    LEAD                     CARE NEED                │
│    public Q&A on a             an inquiry with          the family says what     │
│    provider page, guests       contact details          they need                │
│    allowed (name + email)                                                        │
│    intent inferred:                                                              │
│    cost · care-type · fit                                                        │
│         └──────────────────────────┴────────────────────────┘                    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  D3  NEEDS ASSESSMENT                                    entity: CARE NEED       │
│      Portal · ONE assessment, not three steps                                    │
│      who needs care · timeline · care need · payment · location · details        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  D4  THE PLAN                                            entity: CARE PLAN       │
│      Portal · what we hand the family, and what we execute against               │
│                                                                                  │
│        a care profile      ·   matched PROVIDERS   ·   matched AID PROGRAMS      │
│        posted live for providers to find                                         │
└──────────────────────┬──────────────────────────┬────────────────────────────────┘
                       ▼                          ▼
TRACK A — PROVIDER CONNECTION                 TRACK B — AID PROGRAM
entity: CONNECTION                            entity: PROGRAM REFERRAL
──────────────────────────────────────────    ──────────────────────────────────────────
A1  MATCH                                     B1  MATCH
    by care type, area, availability              by state, eligibility, category:
    inquiry  family → provider                    financial · food · health ·
    request  provider → family                    caregiver
  │                                             │
  ▼                                             ▼
A2  PAYLOAD DELIVERED                         B2  FIRST STEP ISSUED
    Technology · care profile +                   Technology · the call to make,
    needs assessment, by email                    the documents to gather.
    with a one-click link                         TJ approves each letter
  │                                             │
  ▼                                             ▼
A3  PROVIDER RESPONDS                         B3  FAMILY ACTS
    Provider                                      Family · status ladder:
  │                                               called · no answer · needs docs
  ▼                                               · applied · waiting · stuck ·
A4  CONVERSATION                                  not eligible
    inbox · phone · email · a                   │
    scheduled call or meeting                   ▼
  │                                           B4  SECURED   ◄── NOT TRACKED TODAY
  ▼                                               the ladder stops at 'applied'.
A5  CONNECTION CONFIRMED                          Nothing records approval.
    both sides say they talked                  │
  │                                             │
  └───────────────────────┬───────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  FAMILY OUTCOME                                          entity: FAMILY          │
│                                                                                  │
│    CARE ESTABLISHED                       AID SECURED                            │
│    with which provider, of how many       which programs, of how many referred   │
│    talked to — split by provider type:    — split by category                    │
│    facility vs home care agency                                                  │
│                                                                                  │
│    fall-off and reason, at every step above                                      │
└──────────────────────────────────────────────────────────────────────────────────┘

PROVIDER STATE  —  a ladder, not a funnel. No stage owns it; it is the listing's state.
──────────────────────────────────────────────────────────────────────────────────────
  unclaimed ──► reachable ──► activated ──► responsive ──► ??? 
  seeded from   verified      clicked the   answers        COMMERCIAL RELATIONSHIP
  the directory email, area,  lead email    leads          UNRESOLVED — see notes.
  pipeline      category      (claimed)                    Ad Boost is the only
                                                           money that exists today,
                                                           and it is not per-referral.
```

---

## What changed from v1, and why

**The aid track is a parallel deliverable, not a failure branch.** v1 drew guidance as where a family
goes when matchmaking stalls. That was wrong. A family can need a provider, an aid program, or both,
and the aid track has its own match, its own execution and its own outcome. It runs from the same
plan, at the same time.

**One needs assessment, not three stages.** v1 split *need expressed → intake → care post live*. They
are one act with several outputs: a care profile, matched providers, matched aid programs, and a post
that providers can find.

**A plan is the deliverable.** The thing we hand the family — and the thing we execute against — is a
plan, not a post. The post is one of its outputs.

**Three entry weights, not one.** A question (public Q&A, guests allowed, intent already inferred as
cost / care-type / fit), a lead, and a stated care need are different commitments through the same
door. All three have to be accounted for; only the third produces a care post today.

**The provider side is a state ladder, not a funnel.** v1's P3/P4 tried to make provider activation a
stage. It is not — it is the listing's state, and it changes as a side effect of demand.
`unclaimed → reachable → activated → responsive → ?`

---

## Aid programs — what exists

**Recommended noun: aid program.** Not *public aid* — the catalogue is already broader than public
programs (SHIP/HICAP counselling, ombudsman, legal aid, nonprofit meal programs), so *public* would
be wrong for part of the list and would make the taxonomy argue with itself.

**But note the vocabulary split.** The product says **benefits** everywhere — `/benefits/*` routes,
`benefits_cascade`, `WaiverProgram`, the SEO surface. Recommendation: leave that alone (those URLs
are earned assets) and adopt **aid program** as the internal operating noun for the thing we match,
refer, and track. Decide it once and write it down, or the two will drift.

**The categories already exist** — `lib/waiver-category.ts` sorts every program into one of four:

| Category | Examples in the keyword map |
|---|---|
| **financial** | SSI/SSP, LIHEAP, weatherization, property tax relief, Medicare Savings Programs, legal aid |
| **food** | SNAP/CalFresh, congregate and home-delivered meals, senior nutrition |
| **health** | Medicaid, Medicare, HCBS waivers, PACE, SHIP/HICAP |
| **caregiver** | Family caregiver support, respite, ombudsman |

**Two program universes that share no key.** The scored engine holds structured eligibility
(`min_age`, `max_income_single`, `requires_medicaid`, `requires_veteran`) on `sbf_*` tables. Every
family-facing surface runs on pipeline draft programs with slug ids and prose eligibility.
`waiver_library_url` joins only ~530 of 1,629 state rows; `lib/benefits/eligibility.server.ts`
bridges the rest by canonical name. **To track "did they secure the program we referred," we need one
canonical program id.** That is the first real dependency on this track.

**The execution ladder exists; the finish line does not.**
`called · no_answer · needs_docs · applied · waiting · not_eligible · stuck` — reported by text and
shown back on the living plan. There is no `secured` / `approved` / `enrolled` state. The ladder
stops at *applied*, so today we can say a family applied and never that they got it.

---

## Demand sources — the referral-partner channel

The third lane of D1 is new work, and it is structurally identical to the MedJobs university side: an
office, a named contact, a permission, collateral, and a relationship maintained over time. **The
ST1–ST7 machinery already built for universities is the same machine pointed at aging services.**
Cards and collateral are the flyer. That reuse is the strongest argument for building this lane next.

Grouped by who holds the family's trust at the moment of need:

**Clinical — at discharge or diagnosis.** Hospital discharge planners and case managers · SNF
discharge planners · home health agencies · primary care and geriatrics practices · neurology and
memory clinics · palliative care and hospice teams · dialysis centers · rehab facilities · health
system community-benefit and population-health teams.

**Aging-services infrastructure — the highest-leverage lane, and already partly in the code
(`lib/benefits/local-aaa.ts`).** Area Agencies on Aging · Aging & Disability Resource Centers ·
SHIP/HICAP counsellors · long-term care ombudsmen · senior centers and congregate meal sites · Meals
on Wheels routes · adult day programs · PACE programs.

**Faith and community.** Churches, synagogues and mosques — specifically their parish-nurse and
health-ministry programs · community centers and YMCAs · public libraries, which field more
"help me find" questions than anyone expects · cultural associations.

**Financial, legal and benefits touchpoints.** Elder law attorneys · financial advisors and estate
planners · Medicaid eligibility offices · county veteran service officers, VSOs, VFW and American
Legion posts · Social Security field offices.

**Employer and membership.** HR benefits teams and EAPs with caregiver benefits · unions and retiree
associations · AARP chapters.

**Housing.** Independent living communities whose residents now need care · senior housing and HUD
202 property managers · home-modification contractors.

---

## The commercial question — unresolved on purpose

The diagram ends the provider ladder at `?` deliberately. Today the only money is **Ad Boost**:
provider-funded managed advertising, gated on a ≥70% profile, priced as a campaign and **not per
referral**. It is also a demand source, so it is a loop, not a terminus.

Charging a provider when a family becomes their client is a **placement-fee** model, and that is the
model that attracts scrutiny in healthcare referral. The federal Anti-Kickback Statute reaches
remuneration for referrals of items or services payable by a federal healthcare program; many states
add patient-brokering statutes that are broader still. Senior-living referral agencies do commonly
operate placement-fee models, typically confined to private-pay placements — which is exactly the
distinction that has to be got right rather than assumed.

**This needs healthcare regulatory counsel before anything is designed against it.** What the
architecture should do meanwhile is refuse to presuppose an answer: keep the commercial box detached
from the match, so a decision either way does not require redrawing the funnel. Three candidates
worth pricing out for that conversation:

1. **Provider-funded marketing** (Ad Boost today) — no payment per referral.
2. **Subscription or listing enhancement** — flat fee, not contingent on a placement.
3. **Placement fee** — contingent on the family becoming a client; the highest-scrutiny option, and
   the one most likely to need to be confined by payer type.

---

## Open questions

1. **Does a question or a lead produce a plan?** Today only a stated care need does. If a question is
   a real entry signal, something has to carry it forward.
2. **One canonical aid-program id** — a hard prerequisite for tracking *secured*.
3. **What counts as secured?** Approved, enrolled, first benefit received? Each is a different
   sensor, and the family is the only one who can tell us.
4. **Who owns Track B execution?** Today it is a cron plus TJ approving letters. Step-by-step help
   applying is a human job at some volume.
5. **Provider-type reporting** — facility versus home care agency needs to be a real dimension on the
   connection, not derived at read time.
6. **Does responsiveness feed matching?** A provider who never answers still receives families.
7. **What is a market?** Families and providers match by area independently of any market object.

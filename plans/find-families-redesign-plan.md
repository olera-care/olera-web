# Find Families redesign — build plan

> Locked 2026-06-05 with TJ. Mockup: `mockups/find-families-v2.html`. Context:
> `project_market_diagnostic` memory + SCRATCHPAD. Replaces the national-families
> browse with **intelligence-as-baseline + a pinned local seeker as the scarce cherry.**

## Principle
- **"Your Market" (the diagnostic) is the product** — the baseline experience for ~99% of providers.
- **A published care-seeker within 50 mi is the scarce cherry** — pins on top when one exists, opens the existing reach-out flow. Both coexist; the lead just leads when present.
- Grounded in reality: **52 published seekers, 1 per city, nationwide.** "Nearby" is rare, so the diagnostic must carry the page and browsing is the wrong primitive (no national list, no browse-all).

## The two states (from the mock)
1. **No seeker ≤50 mi** → honest one-liner + pure "Your Market" (competition · referral graph · playbook).
2. **Seeker ≤50 mi** → pinned `FamilyMatchCard` on top ("first to reach out 3×" lives here) → "Your Market" below.

## What's REUSED (most of it already exists)
- **`components/provider/market/*`** — the live "Your Market" diagnostic (competition SoV w/ "You" highlight, referral graph, catchment map, playbook) already ships from PR #916. Keep as-is.
- **`components/provider/matches/FamilyMatchCard.tsx`** — Esther's card, used verbatim as the pin.
- **`components/provider/matches/ReachOutDrawer.tsx`** — Esther's reach-out + AI compose + connection-send. The pin's "Reach out" opens this unchanged ("connect the pipes, make it flush").

## What's NEW (small, focused)
1. **Nearby-seeker compute** in `app/provider/matches/page.tsx`:
   - Reuse the already-loaded `families` (published = `is_active` + active `care_post`) + existing `haversineDistance(providerProfile.lat, providerProfile.lng, f.lat, f.lng)`.
   - `nearbySeekers = families within 50 mi`, sorted by distance then recency, **cap ~3**.
   - Replaces the exact-city `localLeadCount` gate (the blind spot that hid Austin families from a Round Rock provider).
2. **Compose the page**: pinned `FamilyMatchCard`(s) above `FindFamiliesMarketView` when `nearbySeekers.length > 0`; pure diagnostic otherwise. Honest one-liner in the empty case.
3. **Move "First to reach out is 3×"** onto the pinned card (off the retired hero).
4. **Trim the diagnostic's demand section** → one honest stakes line ("~N seniors 65+"); **drop the families-looking count**. Fold the old "grow your presence" actions (reviews, community) into the **playbook** (no separate stack).

## What's RETIRED (from the default path)
- The "52 families are looking" hero banner + "At a glance" families count.
- Tabs (Best Matches / Near You), the 8-dim filter modal, sort options, pagination, filter chips, "Interested providers: N", the national list.
- **Decision: leave the code dormant, don't delete now** (don't gold-plate cleanup; revisit deletion later). Remove only from the rendered default.

## The Esther seam (the one shared-flow touch)
- We **reuse** `ReachOutDrawer` as-is; we only build the *surfacing* (pin + wiring its open handler). The connection-send, AI compose, and outreach tracking stay hers/untouched.
- **No** provider-facing push notification (TJ: avoid recreating the Place-for-Mom spray; leave notify/connection dynamics to Esther). Pull only.

## Sequencing
- This must ride **with the gate flip (PR #935)** — flipping the gate without this ships the exact-city blind spot to everyone. Options: (a) fold this into the #935 branch, or (b) land this first, then flip. Lean (a).
- The `market_diagnostic_viewed_no_leads` event + Slack/Activity (PR #936) still fits — fires when the diagnostic shows with no nearby seeker.

## Locked micro-decisions
- Keep the honest empty line · keep the un-ranked **"You"** SoV row · keep one stakes number. (All easily dialed later.)

## Out of scope (Esther's lane)
- Connection mechanics, outreach pipeline, any notification/matching beyond surfacing the pin.

## Open before build
- #935 fold-in vs. land-first (lean fold-in).
- 50 mi confirmed; cap of 3 pinned confirmed-default.

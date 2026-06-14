# Plan: Provider IA rework — Find Families vs Your Market

Created: 2026-06-14
Status: Not Started (supersedes the placement parts of provider-paid-ad-boost-plan.md)

## Problem
`/provider/matches` ("Find Families") secretly renders two unrelated experiences via a hidden feature flag (`marketGateOn`): a families marketplace OR the Market Intelligence diagnostic. Managed ads is a third surface (`/provider/boost`) with its pitch scattered across both. No coherent mental model.

## Goal
Reorganize by concept, not flag, so each surface has one job:
- **Find Families** = the provider's leads (or, when none, how to get them).
- **Your Market** = the provider's market intelligence + plan.

## Decisions (locked with TJ, 2026-06-14)
1. **No-leads Find Families = the managed-ads pitch** (not a bounce, not a teaser).
2. **Managed ads lives in Find Families**; `/provider/boost` becomes the deeper picker/apply page the pitch links to.
3. **Has-leads Find Families = lead cards (emphasized) + a slim "get even more families" banner** (secondary, below the cards). Every provider sees managed ads somewhere.
4. **Ship to everyone; retire the `marketGateOn` per-URL fork.** The new "Your Market" tab is visible to all.
5. **"Has leads" = nearby published families (~50 mi)** — today's `nearbySeekers`/pinned logic.
6. **Tab name = "Your Market"** (matches the diagnostic's existing kicker); city stays dynamic in the page header ("Your Market · {City}").

## Target structure

### Find Families — `/provider/matches`
```
nearbySeekers.length > 0 ?
  → FamilyMatchCard list (emphasized)  +  <ManagedAdsCTA variant="banner" tone="more" />  (below cards)
:
  → <ManagedAdsPitch />  (full pitch: headline + PlatformMarquee + ValuePillars + "Set up my campaign" → /provider/boost)
```
- Remove the `marketGateOn` branch and the `FindFamiliesMarketView` render from this route.
- Retire/absorb the old `MatchesEmptyState` / `NearYouEmptyState` (the no-leads pitch replaces them).
- Keep `MyOutreach` / `ActivitySummary` sidebar only meaningful in has-leads; decide whether to keep in no-leads (lean: hide in no-leads — nothing to track yet).

### Your Market — new route `/provider/market`
- Move `FindFamiliesMarketView` here as the whole page (it already self-fetches the diagnostic + handles loading/uncovered states).
- Page header leads with city ("Your Market · {City}").
- The diagnostic's playbook "ads" item → links to `/provider/boost` (already changed in paused work).

### Managed ads
- `/provider/boost` keeps the gate / week-picker / apply / in-motion flow.
- Extract the **pitch** (hero headline + `PlatformMarquee` + `ValuePillars`) into a shared `ManagedAdsPitch` component used by BOTH the boost page top and the no-leads Find Families state. Single source of truth for the pitch.

### Nav
- Add **"Your Market"** to the global provider nav (both arrays in `Navbar.tsx`), alongside Find Families / Hire Caregivers.
- Keep the dashboard `BoostCard` as-is (third managed-ads touchpoint).

## Tasks

### Phase 1: Your Market as its own route
- [ ] 1. Create `app/provider/market/page.tsx` rendering `FindFamiliesMarketView` (lift the gated-branch render + its props: city/state/category/providerName/providerPlaceId/providerSourceId). Resolve those from `useProviderProfile` like matches does.
      - Verify: `/provider/market` shows the diagnostic for a profile with a covered city.
- [ ] 2. Add `/provider/market` to `app/provider/layout.tsx` HUB_ROUTES + isPublicRoute exclusion (auth-gated).
- [ ] 3. Add "Your Market" nav item to `Navbar.tsx` (mobile + desktop provider arrays).

### Phase 2: Simplify Find Families to leads-only, two states
- [ ] 4. Extract `ManagedAdsPitch` (shared) from the boost page hero (`PlatformMarquee` + `ValuePillars` + headline + a "Set up my campaign" CTA → `/provider/boost`). Use it on the boost page (above the gate/picker) and as the no-leads Find Families state.
- [ ] 5. Rewrite the matches page render: drop the `marketGateOn` branch entirely; `nearbySeekers.length > 0` → cards + slim banner; else → `ManagedAdsPitch`. Keep `reachOutDrawer` + verification modal for the cards path.
- [ ] 6. `ManagedAdsCTA`: add a `tone?: "more" | "default"` (or copy prop) so the has-leads banner reads "Get even more families" vs the no-leads "we'll go get them." Place the banner below the card list.

### Phase 3: Retire the flag + cleanup
- [ ] 7. Remove `marketGateEnabled` usage from matches; delete/deprecate `lib/market-gate` if unused elsewhere (grep first). Remove now-dead empty-state components (`MatchesEmptyState`, `NearYouEmptyState`) if fully replaced.
- [ ] 8. Fold in the paused gated-CTA work correctly: the standalone `components/provider/ManagedAdsCTA.tsx` stays (shared); the banner I added inside `FindFamiliesMarketView` is no longer needed there (ads pitch now lives in Find Families, not the market view) — remove it; keep the MarketDiagnostic playbook→/provider/boost wiring.

## Risks / watch
- **The default landing for 99.9% becomes the managed-ads pitch.** That's the intended bet (managed ads = the revenue play), but it means the pitch quality on no-leads Find Families is high-stakes — it's what almost everyone sees. Lean on the hero we built.
- **`marketGateEnabled` may gate things beyond matches** — grep before deleting; it might guard the weekly digest market-rank email or other surfaces. Retire only the matches fork; leave other consumers intact unless confirmed dead.
- **`/provider/market` data coverage:** `FindFamiliesMarketView` already handles uncovered/building/loading honestly — preserve those states; don't show a broken empty tab for uncovered cities.
- **Nav crowding:** provider nav already has Profile / Find Families / Hire Caregivers (+ more in the menu). Adding "Your Market" is one more — confirm it fits the bar layout on mobile.
- **`pinned` behavior change:** today the gated view shows nearby families *on top of* the diagnostic. After this, families live only in Find Families and the diagnostic only in Your Market — they're separated. Intended, but a behavior change.

## Notes
- Reuses, not rebuilds: `FamilyMatchCard`, `PinnedSeekerCard`, `ReachOutDrawer`, `FindFamiliesMarketView`, `MarketDiagnostic`, `PlatformMarquee`/`ValuePillars` (from boost), `ManagedAdsCTA`.
- The paused gated-CTA edits (uncommitted) get reconciled in task 8 rather than committed as their own thing.

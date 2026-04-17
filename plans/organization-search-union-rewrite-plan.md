# Plan: Organization Search Union Rewrite

Created: 2026-04-17
Status: Not Started
Branch: `clever-mirzakhani`
Notion: [Fix provider onboarding search dropping unclaimed franchise locations (MedJobs partial results)](https://www.notion.so/Fix-provider-onboarding-search-dropping-unclaimed-franchise-locations-MedJobs-partial-results-3445903a0ffe8168a144d0cdd164be2c)
Companion task: [Fix admin directory search hiding orphan business_profiles](https://www.notion.so/3455903a0ffe81b49d43c73058359bbe)

## Goal

Rewrite `/api/organization-search` to return a true union of `olera-providers` and `business_profiles`, so franchise locations (OP-only) and orphan claims (BP-only) are both findable — without regressing consumers that branch on the `SelectedOrg.source` field.

## Success Criteria

- [ ] "Home Instead Houston" search returns the `olera-providers` row (currently returns zero)
- [ ] "Aggie Assisted Living" search returns the `business_profiles` row (BP-only orphan, currently not findable via the recommended Option A)
- [ ] "Home Instead" broad query returns multiple sibling locations; no silent drops
- [ ] Small-business and single-location queries still work
- [ ] Claimed provider present in both tables renders as ONE result with `claimState: "claimed"`
- [ ] Partial query failures log but don't 500
- [ ] All 5 consumers render without visual regression (MedJobs modal + 3 /for-providers entry points + /provider/onboarding)
- [ ] Build passes; no TypeScript errors

## Design Summary

Replace the existing 4-query + `.or()`-concat + BP-first-merge approach with a **two-source union**:

1. Query `olera-providers` (primary display source) — full-phrase + multi-word strategies, separate `.ilike()` calls
2. Query `business_profiles` (claim overlay + orphan source) — same strategies, `type IN ('organization','caregiver')`
3. Build two index maps, walk OPs first (layering BP claim state where linked), then walk BPs second (emit only if not already merged via `source_provider_id`)
4. Sort alphabetically by name, cap final output at 100, return `total` as full merged count

## Tasks

### Phase 1: Route rewrite

- [ ] **1. Extract helper module** `lib/organization-search.ts`
  - Files: `lib/organization-search.ts` (new)
  - Exports:
    - `SearchStrategy` type + `buildStrategies(query: string)` → `{ fullPhrase: string; nameWords: string | null; lastWord: string | null }`
    - `pickStrongestClaimState(states: Array<string | null>)` — returns `claimed > pending > unclaimed > null`
    - `SearchResult` interface (existing shape, exported)
  - Verify: `npm run type-check` passes

- [ ] **2. Rewrite route — OP query**
  - Files: `app/api/organization-search/route.ts`
  - Replace lines 47-89 (4 parallel queries) with two query helpers:
    - `queryOleraProviders(db, strategies, limit)` → runs full-phrase `.or("provider_name.ilike,city.ilike")` AND multi-word (`.ilike("provider_name", ...).ilike("city", ...)`) in parallel, merges by `provider_id`, returns deduped array
    - Uses `.not("deleted", "is", true)`
    - Limit: 500 per strategy (1000 max pre-dedup)
    - Select: same fields as today (`provider_id, provider_name, slug, city, state, email, hero_image_url, provider_images`)
  - Verify: unit-test mentally with `query = "Home Instead Houston"` — verify both strategies fire
  - Depends on: 1

- [ ] **3. Rewrite route — BP query**
  - Files: `app/api/organization-search/route.ts`
  - Add `queryBusinessProfiles(db, strategies, limit)` mirroring helper #2:
    - `.in("type", ["organization", "caregiver"])`
    - Full-phrase `.or("display_name.ilike,city.ilike")` + multi-word variant
    - Limit: 500 per strategy
    - Select: `id, display_name, slug, city, state, email, claim_state, source_provider_id, image_url`
  - Verify: type-check; visually compare query shape to OP helper for symmetry
  - Depends on: 1

- [ ] **4. Implement merge-by-canonical-identity**
  - Files: `app/api/organization-search/route.ts`
  - Pseudocode:
    ```
    bpsByOpId = new Map<string, BusinessProfile[]>();  // provider_id -> all linked BPs
    for bp in bpResults:
      if bp.source_provider_id:
        bpsByOpId.get(bp.source_provider_id).push(bp)

    merged: SearchResult[] = []
    emittedOpIds = new Set<string>()

    // Pass 1: OPs first (canonical display source)
    for op in opResults:
      linkedBps = bpsByOpId.get(op.provider_id) ?? []
      claimState = pickStrongestClaimState(linkedBps.map(b => b.claim_state))
      // Prefer BP email when claimed (provider-owned), else fall back to OP email
      bpWithEmail = linkedBps.find(b => b.claim_state === "claimed" && b.email) ?? linkedBps[0]
      merged.push({
        id: op.provider_id,
        name: op.provider_name,
        slug: op.slug || op.provider_id,
        city: op.city, state: op.state,
        email: bpWithEmail?.email ?? op.email,
        claimState,
        source: "olera-providers",
        providerId: op.provider_id,
        imageUrl: op.hero_image_url || firstImageFromPipeList(op.provider_images),
      })
      emittedOpIds.add(op.provider_id)

    // Pass 2: BP-only orphans (no matching OP already emitted)
    for bp in bpResults:
      if bp.source_provider_id && emittedOpIds.has(bp.source_provider_id): continue
      if seen(bp.id): continue
      merged.push({
        id: bp.id,
        name: bp.display_name,
        slug: bp.slug || bp.id,
        city: bp.city, state: bp.state,
        email: bp.email,
        claimState: bp.claim_state,
        source: "business_profiles",
        providerId: bp.source_provider_id ?? bp.id,
        imageUrl: bp.image_url,
      })
    ```
  - Verify: unit-test mentally:
    - OP-only (Home Instead Houston): emits once, source=olera-providers, claimState=null
    - OP+BP claimed (Home Instead Austin): emits once, source=olera-providers, claimState=claimed
    - BP-only (Aggie): emits once, source=business_profiles, claimState=claimed
    - BP linked to OP but OP didn't match query: skipped in pass 1, emitted in pass 2 under BP source (rare)
  - Depends on: 2, 3

- [ ] **5. Final sort + cap**
  - Files: `app/api/organization-search/route.ts`
  - `merged.sort((a, b) => a.name.localeCompare(b.name))`
  - `const capped = merged.slice(0, 100)`
  - Return `{ results: capped, total: merged.length }` (keep `total` as full count for potential pagination)
  - Verify: response shape unchanged; UI reads `data.results` and ignores `total`
  - Depends on: 4

- [ ] **6. Partial-failure error handling**
  - Files: `app/api/organization-search/route.ts`
  - Wrap the two primary queries in a `Promise.allSettled`; if one rejects, log + proceed with the other; only 500 if BOTH fail
  - Add structured console logs: `[organization-search] op=N bp=M merged=K capped=C query="..."`
  - Verify: temporarily throw in one query path in dev, confirm endpoint still returns results from the other
  - Depends on: 4

### Phase 2: Manual verification

- [ ] **7. Build + type-check**
  - Files: (none)
  - Run: `npm run build` (or `npm run type-check` if available)
  - Verify: no TypeScript errors, no lint errors
  - Depends on: 6

- [ ] **8. Local smoke test**
  - Files: (none)
  - `npm run dev`, hit the endpoint directly in browser:
    - `/api/organization-search?q=Home+Instead+Houston` → expect Home Instead Houston row
    - `/api/organization-search?q=Aggie+Assisted+Living` → expect Aggie row
    - `/api/organization-search?q=Home+Instead` → expect 10+ sibling locations
    - `/api/organization-search?q=a` → expect `{results:[], total:0}`, no 500
  - Verify: JSON responses match expectations; inspect structured logs in terminal
  - Depends on: 7

- [ ] **9. UI smoke test (MedJobs modal)**
  - Files: (none)
  - Reproduce the exact screenshot flow: `/medjobs/candidates/[slug]` → "Schedule interview" → "Your organization" modal → type "Home Instead Houston" → expect result in dropdown. Repeat for "Aggie Assisted Living".
  - Verify: rows appear, clicking populates the input with correct name/city
  - Depends on: 7

- [ ] **10. UI smoke test (provider onboarding)**
  - Files: (none)
  - `/provider/onboarding` search for the same three queries. Verify:
    - OP-source row (Home Instead Houston, unclaimed) → flows to verify/claim screen
    - OP+BP claimed row → shows "Claimed" badge, branches to correct "already claimed" screen
    - BP-only row (Aggie) → flows through `source === "business_profiles"` branches without crashing
  - Verify: no console errors, all three branches route to valid next screens
  - Depends on: 7

### Phase 3: PR

- [ ] **11. Commit + push**
  - Files: `app/api/organization-search/route.ts`, `lib/organization-search.ts`
  - Commit message: `Fix organization search: union across olera-providers and business_profiles`
  - Depends on: 10

- [ ] **12. Open PR to staging**
  - Title: `Fix organization search: union across olera-providers and business_profiles`
  - Body template below
  - Verify: Vercel preview builds; re-run tests 8–10 against preview URL
  - Depends on: 11

## PR Description Template

```markdown
## Summary
- Rewrite `/api/organization-search` as a true union across `olera-providers` and `business_profiles`
- Fixes MedJobs "Your organization" modal dropping franchise locations (Home Instead Houston reproduced)
- Also fixes BP-orphan providers becoming invisible to search (Aggie Assisted Living reproduced)

## Why
Prior incremental patches to the merge/dedup logic (aba9f23a, 28aefbbd) kept tweaking symptoms without resolving the structure. The existing `.or()` with comma-concatenated patterns + 200-row limit + BP-first prioritization is fragile — results get silently truncated before dedup and some providers never surface.

Esther's `docs/provider-data-mismatch-analysis.md` documents the two-table reality: `olera-providers` holds scraped/seeded listings, `business_profiles` holds user accounts. Both are real sources of truth. Search must union them, not pick a winner.

## How
1. Two independent primary queries (OP + BP), each running full-phrase + multi-word strategies
2. Limits bumped to 500 per strategy
3. Merge by canonical identity: `bp.source_provider_id === op.provider_id` collapses to one row
4. Claim state precedence (`claimed > pending > unclaimed > null`) when 1-to-many
5. Partial-failure tolerance via `Promise.allSettled`

## Test plan
- [ ] "Home Instead Houston" returns the row (olera-providers source)
- [ ] "Aggie Assisted Living" returns the row (business_profiles source)
- [ ] "Home Instead" (broad) returns multiple siblings
- [ ] Claimed franchise (Home Instead Austin or similar) returns ONE result with claimState=claimed
- [ ] Small business single-location query still works
- [ ] Empty query returns `{results:[], total:0}`, no 500
- [ ] MedJobs modal renders results (screenshot)
- [ ] /provider/onboarding branches through both source values without crash
- [ ] All 3 /for-providers entry points still work

## Out of scope / follow-ups
- Admin directory has the same bug for BP-only orphans — [separate Notion task filed](https://www.notion.so/3455903a0ffe81b49d43c73058359bbe)
- Backfilling ~110 existing orphan BPs with `source_provider_id` (separate P2)
- Structural two-table unification (separate P1)

## Related
- Notion ticket: Fix provider onboarding search dropping unclaimed franchise locations
- Prior attempts: aba9f23a (dedup key), 28aefbbd (multi-word + limit bump)
- Esther's analysis: `git show 1e233e08:docs/provider-data-mismatch-analysis.md`
```

## Risks

- **Consumer regression in `/provider/onboarding` branching on `source` field.** The page has 10+ references to `source === "olera-providers"` vs `"business_profiles"`. By still producing both values where accurate, we preserve those code paths. Risk is that some OP+BP-claimed pair that previously surfaced as `source: "business_profiles"` will now surface as `source: "olera-providers"`, routing through a different screen. Mitigation: manual test #10 exercises both branches. If a screen is reachable only via the BP branch for a claimed-with-OP provider, we'll see it break in smoke test.
- **Limit-of-500-per-strategy may truncate very broad queries.** For `q="home"` (5000+ rows), results will be truncated. Current behavior already truncates at 200, so this is an improvement, not a regression. Final cap at 100 stays UI-reasonable.
- **PostgREST `.or()` with commas in input query.** If user types a comma (`"foo, bar"`), `.or()` string concat breaks. Mitigation: escape the pattern or switch to pure `.ilike()` — verify during implementation.
- **OP slug vs BP slug divergence.** Prefer OP slug when merging (OP slug is canonical, used in review storage per Esther's doc). Risk: if BP slug was the one stored in a review, linking by OP slug could miss that review downstream — but that's a Provider Hub problem, not a search problem, and out of scope here.
- **Partial-failure masking.** If OP query fails but BP query succeeds, user sees only BP results — may be missing important data. Mitigation: structured log + Vercel logs review during rollout.

## Rollback

Single-file route revert is a no-risk rollback:
```bash
git revert <merge-commit>
```
Or, fallback-first strategy: keep the old code in a git branch for 1-2 days post-merge, revert if conversion drops on provider onboarding.

## Notes for future sessions

- If this lands cleanly, the companion admin-directory fix (Notion P2) should use the same union pattern + `lib/organization-search.ts` helpers. Don't re-implement.
- The `source` field is load-bearing in `/provider/onboarding/page.tsx`. If we ever deprecate it, that 2000-line page needs a dedicated refactor first.
- After merge, monitor Slack for `[organization-search]` log volume to catch partial-failure cases in prod.

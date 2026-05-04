# Plan: Mount SBF V3 (BenefitsDiscoveryModule) on /caregiver-support/[slug]

Created: 2026-05-04
Status: Not Started
Notion: https://www.notion.so/Mount-SBF-V3-Benefits-Discovery-on-caregiver-support-article-template-3495903a0ffe81f085fdde9b8dc149ac

## Goal
Replace the dead-end `/browse?type=X` CTA on every `/caregiver-support/[slug]` article with the BenefitsDiscoveryModule, instrumented so we can answer "conversion by entry page" 4-6 weeks after ship. Single-variant on editorial — no 4-arm A/B replication.

## Success Criteria
- [ ] Every `/caregiver-support/[slug]` article renders BenefitsDiscoveryModule in place of the `/browse` CTA, above the Recommended grid.
- [ ] Submitting the form persists `signup_source = '/caregiver-support/{slug}'` on the resulting `accounts` row.
- [ ] `benefits_step_*` activity events from editorial pages carry an entry-source property.
- [ ] BenefitsArmGate / AgentOutreachSlot are NOT wrapping the editorial mount (single-variant).
- [ ] Provider-page SBF behavior is unchanged (regression check).
- [ ] No CLS regression on the article body for typical viewports.

## Decisions to confirm with TJ before implementation

### D1 — Persistence target for entry source
**Recommend:** add `signup_source TEXT NULL` column on `accounts` (the row written by `/api/benefits/save-results`). Indexed if we expect to filter by source frequently.
- Pro: clean JOIN target for "conversion to provider sign-in segmented by entry page" later. Single source of truth on the family-profile row.
- Con: DB migration + one column we can't easily drop later.
- Alternative: stash in `seeker_activity` event properties only. Cheaper but harder to JOIN to downstream sign-ins.

### D2 — State inference for editorial visitors
SBF expects `providerState`, `stateId`, `stateName`. Editorial articles are not state-anchored. Three options:
- **A — Client-side geo (recommend).** Editorial wrapper hits a lightweight `/api/geo` (Vercel geo headers → 2-letter region) on mount. Falls back to a state-less "your area" copy variant when geo is unavailable. Preserves ISR on the article body.
- **B — Server-side geo + drop ISR.** Cleanest UX, hurts TTFB on SEO pages. Reject.
- **C — Article-state metadata.** Use the article's title/tags to detect a state (e.g., "Texas how-to-get-paid"). Covers ~10-20% of articles. Layer on top of A as a v1.5 nicety.

### D3 — State-less copy
`BenefitsDiscoveryModule`'s three H2 variants all interpolate `${stateName}`. For null-state visitors, render fallback copy (e.g., availability arm: `"Care benefits for families like yours."`). Two ways:
- **Accept null state in the module (recommend).** One small change inside the module's VARIANT_COPY interpolation. Doesn't change provider-page behavior because providers always have state.
- **Force a state default like "your area".** Reads weirdly ("your area care benefits…"). Reject.

### D4 — Admin analytics breakdown by entry source
**Recommend:** defer to v2. The leading metric (count of submissions with `entry_source = '/caregiver-support/'`) is answerable from raw `seeker_activity` queries. Full UI breakdown can wait until we have data worth segmenting.

## Tasks

### Phase 1 — Plumbing (no UI changes)

1. **Add `entrySource` prop to BenefitsDiscoveryModule.**
   - Files: `components/providers/BenefitsDiscoveryModule.tsx`
   - Add optional `entrySource?: string` to `BenefitsDiscoveryModuleProps`.
   - Thread into `fireFunnelEvent` (pass via `extras`) AND into the `/api/benefits/save-results` POST body.
   - On provider pages this stays undefined; existing behavior unchanged.
   - Verify: typecheck passes, provider-page module still renders + submits.

2. **Accept null state in BenefitsDiscoveryModule copy variants.**
   - Files: `components/providers/BenefitsDiscoveryModule.tsx`
   - Make `providerState` / `stateId` / `stateName` props optional. Change `VARIANT_COPY` H2/sub builders to accept `state: string | null` and render state-less fallbacks when null.
   - Locations to audit for state-dependent rendering: relationship step copy, contact step copy, ResultsSheet handoff (the `/m/{token}` page already handles missing state — verify).
   - Verify: provider page (state always present) renders identically; manual call with `stateName={null}` renders sensible copy.

3. **Add `signup_source` field to save-results payload + persist.**
   - Files: `app/api/benefits/save-results/route.ts`, new migration `supabase/migrations/065_accounts_signup_source.sql`
   - Migration: `ALTER TABLE accounts ADD COLUMN signup_source TEXT NULL;` + index if we're going to filter by it.
   - Route: extract `entrySource` from payload, pass to the `accounts` insert/update.
   - Verify: insert a row via curl, confirm column populated. Confirm provider-page submits still write the row (with `signup_source = NULL`).

4. **Decide entry-source schema for `seeker_activity`.**
   - Files: `app/api/activity/track/route.ts`, `lib/analytics/track-step.ts`
   - The existing `trackBenefitsEvent` already accepts arbitrary properties in `extras`. Confirm `entrySource` rides through to the JSON properties column without an allowlist gate. If event-property allowlisting exists, add `entry_source` per the lesson in `feedback_event_allowlist_needs_db_migration.md`.
   - Verify: fire a test event, confirm property persists.

### Phase 2 — Editorial wrapper

5. **Create `EditorialBenefitsModule` client wrapper.**
   - Files: `components/article/EditorialBenefitsModule.tsx` (new)
   - Props: `articleSlug: string`, `articleCareTypes?: string[]`, `articleTags?: string[]`.
   - On mount:
     - Resolve state via `/api/geo` (or equivalent — see task 6).
     - Fetch program library for resolved state via existing helper or new `/api/benefits/programs?state=XX`.
     - Render `BenefitsDiscoveryModule` with resolved state + `entrySource={'/caregiver-support/' + articleSlug}`.
   - During resolution: render a fixed-height skeleton that matches the module's vertical footprint (CLS guard).
   - Verify: typecheck, mount on a test page, observe skeleton → module transition.

6. **Geo + program-data endpoints (only if absent).**
   - Files: search for existing `/api/geo`, `getStateFromHeaders`, `getProgramsForState` helpers first; reuse if present.
   - If absent: add minimal `app/api/geo/route.ts` returning `{ state: string | null }` from Vercel geo headers (`x-vercel-ip-country-region`). No DB call.
   - For programs: provider page server component pre-fetches `topPrograms` + `allPrograms` and passes them as props. We need an equivalent client-callable. Likely `/api/benefits/programs?state=XX` or hydrate from a static `data/waiver-library` import (if the dataset is small enough to ship in JS).
   - Verify: each endpoint returns expected shape; client wrapper consumes successfully.

### Phase 3 — Editorial mount

7. **Replace `/browse` CTA on the article template.**
   - Files: `app/caregiver-support/[slug]/page.tsx`
   - Remove the `Link` block at lines 395-410 (the `Looking for {careType} providers? Browse verified options` CTA).
   - Replace with `<EditorialBenefitsModule articleSlug={slug} articleCareTypes={careTypes} articleTags={tags} />`.
   - Confirm placement: directly after article body content, before the "Author + Tags" / Recommended grid (matches the original task's "above Recommended" intent).
   - Do NOT wrap in `BenefitsArmGate`. Single-variant on editorial.
   - Verify: visit a few article slugs locally, see the module render after geo resolves.

8. **Free-services article path check.**
   - The Apr 24 commit `fe2059ad` moved the free-services article into `/caregiver-support/`. Confirm it now uses the same `[slug]` template (not a one-off page) and inherits the new module automatically.
   - Files: spot-check `app/caregiver-support/free-services-for-seniors/page.tsx` if it exists as a one-off; otherwise no-op.

### Phase 4 — Verification

9. **Manual end-to-end test.**
   - Local dev: visit `/caregiver-support/what-is-the-va-caregiver-functional-assessment` (the article TJ verified in the original task).
   - Submit a test entry through the module.
   - Confirm:
     - `accounts.signup_source = '/caregiver-support/what-is-the-va-caregiver-functional-assessment'`
     - `seeker_activity` rows for `benefits_step_started`, `benefits_step_completed` carry the source property
     - ResultsSheet overlay opens with matched programs
     - No console errors
     - Provider page (e.g., `/provider/some-slug`) still works identically
   - Verify on a slug WITHOUT geo (simulate by overriding geo response to null): module renders with state-less copy, submission still works.

10. **Typecheck + lint.**
    - `npm run typecheck` (or `pnpm tsc --noEmit`)
    - Resolve any drift introduced by the prop additions.

11. **Regression sweep on /provider/.**
    - Verify provider pages still pass `providerState/stateId/stateName` (we made them optional but not removed). Step-1 pickup % should be unchanged in admin analytics ~24h after ship.

## Risks

- **State resolution latency (200-400ms typical).** Skeleton placeholder mitigates visual jank; needs to match real module's footprint to keep CLS clean. Mobile viewport is the tightest case.
- **`accounts.signup_source` on provider rows is NULL by design.** Downstream analytics queries must `IS NOT NULL` filter when segmenting by editorial sources, or `COALESCE(signup_source, 'provider_page')` for honest comparison.
- **Module's `question-submitted` listener (line 241).** Listens for an event that won't fire on editorial. Benign no-op; no action needed but worth a comment note in the wrapper.
- **No-state fallback copy may underperform.** If editorial conversion is materially below provider conversion, we won't know whether it's the visitor population or the state-less copy. v2 can add per-article state pre-fill to isolate.
- **CLS / Core Web Vitals.** SEO traffic is the entire reason these articles exist. Skeleton must be height-stable; module hydration must not push article body content. Audit Lighthouse on a cached article before/after.
- **ISR cache + per-visitor geo.** Article body stays ISR-cached (`revalidate = 60`); module hydration is per-visitor. This is the intended split — flag if a future change tries to move state resolution server-side, it'll either force dynamic rendering (perf loss) or break geo personalization.
- **Allowlist drift.** Per `feedback_event_allowlist_needs_db_migration.md`, any new `event_type` value needs both app + DB migration. We're adding a property to existing events, not new event types — should be safe, but verify the activity insert doesn't reject unknown property keys.

## Notes
- Original Notion task framed this as "topic-seeded question funnel." See the RETARGETED block on the Notion page for why that mechanism doesn't exist (Q&A funnel is provider-specific) and why SBF V3 is the correct mechanism instead.
- v2 candidates (deferred): article-aware H2 copy, pre-selected care-need card by article topic, editorial-specific A/B variants, inline mid-article placement, admin analytics breakdown by entry source.
- Logan's VA caregiver refresh (Apr 24) shipped into the old CTA. That's fine — refresh is about position recovery, not conversion. BCBS / Social Security refreshes (per original task) should land AFTER this ships so we get clean signal.
- Chantel's financial-topic framework will inherit the new template automatically. Worth a heads-up so she knows editorial articles now end with a benefits-discovery module, not a browse CTA.

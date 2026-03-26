# Plan: SBF Phase 2 — Unify Chantel's Waiver Library with Benefits Finder

Created: 2026-03-22
Status: Not Started
Branch: bright-nobel (from staging)

## Goal

Make the Benefits Finder questionnaire recommend from Chantel's 528-program waiver library and link results to the rich detail pages, replacing the disconnected iOS seed data.

## Success Criteria

- [ ] Benefits Finder matches against Chantel's 528 programs (not old iOS data)
- [ ] Each result card links to the waiver library detail page (`/waiver-library/[state]/[slug]`)
- [ ] Results show savings range from Chantel's data (e.g., "$10,000 – $30,000/year")
- [ ] Old iOS data preserved but inactive (reversible)
- [ ] No regressions — federal programs and AAA matching still work

## Context

**Current state:**
- `sbf_state_programs`: 1,100 rows (iOS seed, UUID IDs, no link to waiver library)
- `sbf_federal_programs`: 76 rows (keep as-is)
- `sbf_area_agencies`: exists (keep as-is)
- `data/waiver-library.ts`: 528 programs with rich data (forms, FAQs, savings, service areas)
- Seed script exists at `/api/admin/seed-sbf-programs` but has never been run

**Key insight:** The seed script already creates rows with slug-based IDs that match waiver library URLs. We just need to: deactivate old data → seed new data → add links in results UI.

## Tasks

### Phase 1: Seed Script Enhancement (backend)

- [ ] 1. Add deactivation step to seed script
      - Files: `app/api/admin/seed-sbf-programs/route.ts`
      - What: Before upserting Chantel's data, run `UPDATE sbf_state_programs SET is_active = false` to deactivate all existing iOS rows
      - Also add `savings_range` field to the seeded data (pull from `program.savingsRange`)
      - Verify: Hit `?dry_run=true` — should show 528 programs with savings_range populated

- [ ] 2. Add a state-code-to-slug mapping utility
      - Files: new `lib/benefits/state-utils.ts`
      - What: Map state abbreviation (TX) → state slug (texas) for building waiver library URLs. Use `allStates` from waiver-library.ts to build the map.
      - Verify: `stateCodeToSlug("TX")` returns `"texas"`, `stateCodeToSlug("NY")` returns `"new-york"`

- [ ] 3. Add `waiver_library_url` to seeded data
      - Files: `app/api/admin/seed-sbf-programs/route.ts`
      - What: For each program, compute `/waiver-library/[state-slug]/[program-id]` and store as a field. This way the URL is available in match results without extra lookups.
      - Verify: Dry run sample shows correct URLs

### Phase 2: Results UI (frontend)

- [ ] 4. Add "Learn more" link to ProgramCard
      - Files: `components/benefits/ProgramCard.tsx`
      - What: If `program.waiver_library_url` exists, show a "View full details →" link below the action buttons. Links to the waiver library detail page (forms, FAQs, application steps).
      - Verify: Result cards show clickable link that opens the correct waiver library page

- [ ] 5. Show savings range on result cards
      - Files: `components/benefits/ProgramCard.tsx`
      - What: If `program.savings_range` exists, show it as a badge/line near the program name (e.g., "Save $10,000 – $30,000/year"). This gives users a compelling reason to click through.
      - Verify: Cards show savings range where available

- [ ] 6. Update BenefitProgram type
      - Files: `lib/types/benefits.ts`
      - What: Add optional `savings_range?: string` and `waiver_library_url?: string` fields to BenefitProgram interface
      - Depends on: none (do first, before tasks 4-5)
      - Verify: TypeScript compiles clean

### Phase 3: Execute & Verify

- [ ] 7. Run the seed on staging
      - What: TJ hits `staging-olera2-web.vercel.app/api/admin/seed-sbf-programs?confirm=true`
      - Verify: Check Supabase — old rows have `is_active = false`, 528 new rows have `is_active = true` with slug IDs
      - Rollback: If something goes wrong, run `UPDATE sbf_state_programs SET is_active = true WHERE id LIKE '%-%-%-%-%'` (UUIDs) and `SET is_active = false WHERE id NOT LIKE '%-%-%-%-%'` (slugs)

- [ ] 8. End-to-end test on staging
      - What: Complete the Benefits Finder questionnaire for a Texas ZIP code (e.g., 77840). Check that:
        - Results show Chantel's programs (STAR+PLUS, SNAP Food Benefits, etc.)
        - "View full details" links go to correct waiver library pages
        - Savings ranges appear on cards
        - Federal programs still appear
        - AAA still matches correctly
      - Verify: Manual walkthrough by TJ

## Risks

- **Schema mismatch**: The Supabase `sbf_state_programs` table may not have `savings_range` or `waiver_library_url` columns yet. We'll need to add these columns — either via Supabase dashboard (fastest) or a migration. Low risk since these are nullable text columns.
- **Duplicate federal+state overlap**: Some of Chantel's state programs may overlap with the 76 federal programs (e.g., state-level SNAP vs federal SNAP). The existing deduplication (by `program.name.toLowerCase()`) handles this, but we should verify.
- **Program ID mismatches**: The seed script generates IDs from `program.id` in waiver-library.ts. These must exactly match the `[benefit]` param in `/waiver-library/[state]/[benefit]` routes. They should — they come from the same source — but we'll verify in dry run.

## Notes

- The 528 vs 1,195 discrepancy: waiver-library.ts has 1,195 entries but the seed script `allStates` export may filter differently. The dry run showed 528 — that's the number that will be seeded.
- Federal programs stay untouched. They're in a separate table and the matching engine queries both.
- After this ships, the waiver library pages still read from the TypeScript file (no change needed). Supabase is only used by the matching engine.

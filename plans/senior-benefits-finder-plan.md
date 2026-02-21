# Plan: Senior Benefits Finder

Created: 2026-02-12
Status: Not Started

## Goal

Port the iOS Senior Benefits Finder to the web — a 6-step intake form that matches families to federal/state benefit programs and their local Area Agency on Aging, using the existing Supabase `sbf_*` tables.

## Success Criteria

- [ ] User can navigate to `/benefits/finder` and complete a 6-step intake
- [ ] Matching engine returns scored, ranked programs from Supabase
- [ ] Results page shows programs grouped by category with AAA featured first
- [ ] Program detail view shows description, eligibility, "what to say" script, and contact links
- [ ] Works on mobile and desktop
- [ ] Build passes (`npm run build`)

## Architecture

```
/benefits/finder (page)
    ├── BenefitsIntakeForm (client component — 6 steps)
    │   ├── StepIndicator (reuse existing)
    │   ├── Pill (reuse existing)
    │   └── ZipLookup (new — ZIP → state/county)
    │
    ├── POST /api/benefits/match (API route — matching engine)
    │   ├── Queries sbf_federal_programs
    │   ├── Queries sbf_state_programs
    │   ├── Queries sbf_area_agencies
    │   └── Returns scored BenefitMatch[]
    │
    └── BenefitsResults (client component — results display)
        ├── AAACard (featured)
        ├── ProgramCard (per program)
        └── ProgramDetailModal (expanded view)
```

## Tasks

### Phase 1: Types & Data Layer

- [ ] 1. Create TypeScript types mirroring iOS models
      - Files: `lib/types/benefits.ts` (new)
      - Types: BenefitProgram, BenefitMatch, AreaAgency, BenefitsIntakeAnswers, BenefitCategory, CarePreference, PrimaryNeed, IncomeRange, MedicaidStatus, IntakeStep
      - Port from: `oleraclean/.../BenefitsModels.swift`
      - Verify: File compiles, types are importable

- [ ] 2. Create ZIP code → state/county lookup utility
      - Files: `lib/benefits/zip-lookup.ts` (new)
      - Approach: Static mapping of ZIP prefix ranges → state codes (same as iOS fallback logic). For county lookup, query Supabase `sbf_area_agencies` by ZIP.
      - Port from: `oleraclean/.../BenefitsFinderViewModel.swift` (ZIP prefix mapping)
      - Verify: `zipToState("78701")` returns `"TX"`, `zipToState("10001")` returns `"NY"`

- [ ] 3. Build the matching engine API route
      - Files: `app/api/benefits/match/route.ts` (new)
      - Logic: Accepts POST with BenefitsIntakeAnswers, queries `sbf_federal_programs` + `sbf_state_programs` + `sbf_area_agencies`, runs scoring algorithm (age, income, medicaid, needs, veteran status), returns sorted BenefitMatch[] + AreaAgency
      - Port from: `oleraclean/.../BenefitsService.swift` (matchPrograms, evaluateEligibility)
      - Scoring: base priorityScore + age(+10) + income(+15) + veteran(+20) + disability(+15) + medicaid(+10) + medicare(+10) + category match(+25), cap at 100
      - Depends on: Task 1
      - Verify: `curl -X POST /api/benefits/match` with test payload returns programs

### Phase 2: Intake Form UI

- [ ] 4. Create the 6-step intake form component
      - Files: `components/benefits/BenefitsIntakeForm.tsx` (new)
      - Steps:
        1. ZIP code (text input, 5 digits, auto-lookup state/county)
        2. Age (number input, 18-120)
        3. Care preference (3 pills: "Stay at home", "Exploring facilities", "Not sure yet")
        4. Primary needs (multi-select pills: Personal care, Household tasks, Health management, Companionship, Financial help, Memory care, Mobility help)
        5. Income range (6 pills: Under $1,500, Under $2,500, Under $4,000, Under $6,000, Over $6,000, Prefer not to say)
        6. Medicaid status (4 pills: Already have it, Applying, Not sure, Don't have it)
      - Reuse: `StepIndicator`, `Pill` from connection-card
      - Pattern: Follow `IntentCapture.tsx` state management style
      - Port from: `oleraclean/.../BenefitsIntakeFlow.swift`
      - Depends on: Task 1
      - Verify: Can step through all 6 screens, back/forward works, validation prevents empty progression

- [ ] 5. Create the finder page
      - Files: `app/benefits/finder/page.tsx` (new)
      - Layout: Hero header, centered form card (max-w-lg), progress indicator
      - States: intake → loading → results
      - On submit: POST to `/api/benefits/match`, transition to results
      - SEO: metadata with title "Senior Benefits Finder | Olera"
      - Depends on: Task 4
      - Verify: Page loads at `/benefits/finder`, form renders

### Phase 3: Results Display

- [ ] 6. Create the AAA card component
      - Files: `components/benefits/AAACard.tsx` (new)
      - Content: Agency name, region, "Talk to a real person" message, services offered (badge chips), phone (click-to-call), website link, "What to say" script in blockquote
      - Styling: Highlighted card (primary border, subtle bg tint) — stands out above program list
      - Port from: `oleraclean/.../BenefitsAAADetailView.swift`
      - Depends on: Task 1
      - Verify: Renders with mock AAA data

- [ ] 7. Create the program card and detail modal
      - Files: `components/benefits/ProgramCard.tsx` (new), `components/benefits/ProgramDetailModal.tsx` (new)
      - Card: Category badge (color-coded), program name, match tier label ("Top Match"/"Good Fit"/"Worth Exploring"), 1-line match reason, expand button
      - Detail modal: Full description, eligibility requirements, "What to say" script, action buttons (Call, Visit Website, Apply)
      - Reuse: `Modal.tsx`, `Badge.tsx` from existing UI components
      - Port from: `oleraclean/.../BenefitsProgramDetailView.swift`
      - Depends on: Task 1
      - Verify: Card renders, clicking opens detail modal with all sections

- [ ] 8. Create the results view component
      - Files: `components/benefits/BenefitsResults.tsx` (new)
      - Layout: Personalized header ("Based on your answers, here are programs you may qualify for"), AAA card first, then programs grouped by category (healthcare, income, housing, food, utilities, caregiver), collapsible category sections, category filter chips at top
      - Sorting: By match score within each category
      - Tier labels: score >= 80 → "Top Match", >= 60 → "Good Fit", < 60 → "Worth Exploring"
      - Port from: `oleraclean/.../BenefitsResultsView.swift`
      - Depends on: Tasks 6, 7
      - Verify: Results display grouped, AAA on top, filters work

### Phase 4: Integration & Polish

- [ ] 9. Wire intake → API → results end-to-end
      - Files: `app/benefits/finder/page.tsx` (modify)
      - Flow: Form submit → loading spinner → API call → render results
      - Error handling: Network error → friendly retry message, no results → "We couldn't find matching programs" with AAA fallback
      - Depends on: Tasks 3, 5, 8
      - Verify: Full flow works: enter ZIP 78701, age 75, stay home, personal care + financial help, under $2,500, already has Medicaid → see TX programs + federal programs + local AAA

- [ ] 10. Add entry points and navigation
      - Files: `app/benefits/page.tsx` (modify — add CTA to finder), `app/page.tsx` (modify — add benefits finder CTA to homepage), `components/shared/Navbar.tsx` (optional — add to nav)
      - Add "Find Benefits You Qualify For" CTA button on existing `/benefits` page linking to `/benefits/finder`
      - Add benefits finder card/CTA on homepage
      - Depends on: Task 9
      - Verify: Can navigate to finder from homepage and benefits page

- [ ] 11. Update SCRATCHPAD.md with session log
      - Files: `SCRATCHPAD.md`
      - Depends on: Task 10
      - Verify: Entry exists

## Risks

- **Supabase table schema mismatch**: Web queries might use slightly different column names than iOS. Mitigation: Test API route against real Supabase data early (Task 3).
- **Large result sets**: Some states may have many programs. Mitigation: Limit to top 20 per category, sorted by score.
- **ZIP code edge cases**: Some ZIPs span multiple counties/states. Mitigation: Use ZIP prefix fallback (same as iOS), show state-level results if county match fails.
- **Existing `/benefits` page**: We're adding `/benefits/finder` alongside it, not replacing it. The existing page becomes a "learn about benefits" overview, the finder is the interactive tool.

## Notes

- iOS reference code at `/Users/tfalohun/Desktop/oleraclean/`
- Supabase tables already seeded: `sbf_federal_programs`, `sbf_state_programs`, `sbf_area_agencies`
- No voice assistant on web (iOS-only feature) — form-based flow only
- No bookmark/save feature in v1 — can add later behind auth
- Scoring algorithm must match iOS exactly for consistency
- The existing `/benefits` page has static benefit info (Medicare, Medicaid, etc.) — keep it as educational content, the finder is the dynamic tool

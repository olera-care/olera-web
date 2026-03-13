# Plan: Senior Benefits Finder — Results Page Redesign

Created: 2026-03-13
Status: Not Started
Branch: TBD (from `staging`)
Inspired by: Chantel's Lovable prototype (personalized report with financial impact, action plan, print optimization)

## Goal

Transform the SBF results page from a flat program list into a personalized, action-oriented benefits report that creates urgency, reduces overwhelm, and guides users to take immediate action.

## Success Criteria

- [ ] Personalized header with name (if authed) or profile summary
- [ ] Financial impact section with estimated savings + cost of inaction
- [ ] Match confidence bars replacing plain tier labels
- [ ] Prioritized action plan with "Start Here" badge
- [ ] Master document checklist (print-ready)
- [ ] Expanded program cards with step-by-step "How to Apply"
- [ ] Print/PDF layout optimization
- [ ] No regressions: bookmark, share, category filters, AAA card all still work

## Architecture Notes

### Data constraints
- **No savings data in Supabase** — `sbf_federal_programs` / `sbf_state_programs` have no `estimated_monthly_savings` column
- Options: (a) add column + seed data, (b) compute client-side estimates from program metadata, (c) use hardcoded lookup table by program name
- **Recommendation**: Option (c) for MVP — a static `PROGRAM_SAVINGS_ESTIMATES` map in `lib/types/benefits.ts`. Fast to ship, easy to refine later. Accuracy isn't critical — these are estimates.

### Component structure (proposed)
```
BenefitsResults.tsx (orchestrator — already exists, will be extended)
├── BenefitsReportHeader.tsx      (NEW — personalized greeting + profile summary)
├── FinancialImpactDashboard.tsx  (NEW — savings cards + cost of inaction)
├── MatchConfidenceBar.tsx        (NEW — colored progress bar for each program)
├── ActionPlan.tsx                (NEW — prioritized steps with "Start Here")
├── DocumentChecklist.tsx         (NEW — unified checklist across all programs)
├── ProgramCard.tsx               (MODIFY — add "How to Apply" steps, expand details)
├── AAACard.tsx                   (KEEP — already good)
└── AccountNudge                  (KEEP — inline in BenefitsResults, already done)
```

### Print strategy
- Use Tailwind `print:` variants for hiding interactive elements (filters, buttons)
- Add `@media print` styles for page breaks between sections
- "Print" and "Download PDF" buttons in header (PDF = window.print() with print styles)

---

## Tasks

### Phase 1: Data Foundation + Personalized Header
> Get the data layer right and the emotional hook in place

- [ ] 1. **Add savings estimates lookup table**
      - Files: `lib/types/benefits.ts`
      - Add `PROGRAM_SAVINGS_ESTIMATES: Record<string, { monthlyLow: number; monthlyHigh: number }>` for the ~30 most common programs (Medicaid, SNAP, LIHEAP, SSI, QMB, etc.)
      - Add helper: `getEstimatedSavings(programName: string) → { monthly: number; annual: number } | null`
      - Verify: unit-testable pure function, import in BenefitsResults

- [ ] 2. **Create BenefitsReportHeader component**
      - Files: `components/benefits/BenefitsReportHeader.tsx`
      - Personalized: "Your Benefits Package for [name]" (authed) or "Your Benefits Package" (anon)
      - Summary sentence: "Based on your care profile — age [X], [location], [care setting] — you may qualify for [N] programs."
      - Print + Share buttons (Print = `window.print()`, Share = existing `handleShare`)
      - Verify: renders correctly for both authed and anon users

- [ ] 3. **Create FinancialImpactDashboard component**
      - Files: `components/benefits/FinancialImpactDashboard.tsx`
      - Two stat cards: "Estimated Monthly Savings" + "Estimated Annual Savings"
      - Sum savings from all matched programs using the lookup table
      - "Cost of Inaction" callout: project 5-year loss if user doesn't apply (annual × 5)
      - Programs matched count badge
      - Verify: renders with realistic numbers, handles 0-savings gracefully

### Phase 2: Program Cards + Confidence Bars
> Make individual program results more informative and action-oriented

- [ ] 4. **Create MatchConfidenceBar component**
      - Files: `components/benefits/MatchConfidenceBar.tsx`
      - Colored progress bar: green (80%+), amber (60-79%), gray (<60%)
      - Label: "Strong Match" / "Good Fit" / "Worth Exploring"
      - Percentage text right-aligned
      - Verify: visual correctness across score ranges

- [ ] 5. **Add "How to Apply" steps to ProgramCard**
      - Files: `components/benefits/ProgramCard.tsx`, `lib/types/benefits.ts`
      - Add `how_to_apply_steps: string[] | null` field to `BenefitProgram` type
      - For MVP: generate steps from existing data (phone → "Call [number]", website → "Visit [url]", application_url → "Apply online at [url]")
      - Later: add `how_to_apply_steps` column to Supabase for custom per-program steps
      - Numbered list in expanded card section
      - Verify: steps render, graceful fallback when no data

- [ ] 6. **Add estimated savings to ProgramCard**
      - Files: `components/benefits/ProgramCard.tsx`
      - Show "Est. $X–$Y/mo" badge next to program name (from savings lookup)
      - Only show when savings data exists for that program
      - Verify: badge appears for known programs, hidden for unknowns

- [ ] 7. **Replace tier labels with MatchConfidenceBar**
      - Files: `components/benefits/ProgramCard.tsx`
      - Replace `{tierLabel} · {matchScore}% match` text with the new confidence bar
      - Keep bookmark + chevron positioning
      - Verify: visual consistency, no layout shift

### Phase 3: Action Plan + Document Checklist
> Reduce overwhelm — tell the user exactly what to do

- [ ] 8. **Create ActionPlan component**
      - Files: `components/benefits/ActionPlan.tsx`
      - Take top 3–5 programs sorted by score
      - Each step: number, program name, estimated time to apply, one-line instruction, contact info
      - First step gets "Start Here" badge (green)
      - Verify: renders correct order, Start Here on first item

- [ ] 9. **Create DocumentChecklist component**
      - Files: `components/benefits/DocumentChecklist.tsx`
      - Static list of common documents needed: government ID, proof of income, Social Security card, medical records, proof of residence, insurance cards
      - Checkbox squares (styled as empty for print, interactive on screen)
      - Section header: "Documents You'll Need"
      - Verify: renders cleanly, checkboxes toggle on screen

### Phase 4: Layout Assembly + Print Optimization
> Wire everything together and make it print-ready

- [ ] 10. **Assemble new results layout in BenefitsResults**
       - Files: `components/benefits/BenefitsResults.tsx`
       - Order: Header → Financial Dashboard → Account Nudge (if anon) → Action Plan → Document Checklist → AAA Card → Category filters → Program cards
       - Keep existing filter/group logic
       - Verify: full page renders correctly, all sections visible

- [ ] 11. **Add print styles**
       - Files: `app/globals.css` or Tailwind `print:` variants inline
       - Hide: nav, sidebar, category filter buttons, bookmark buttons, share button, account nudge
       - Show: all program cards expanded (no accordion)
       - Page break before: Action Plan, Document Checklist, each category group
       - Footer: "Generated by Olera Benefits Finder — olera.care/benefits/finder — [date]"
       - Verify: `Cmd+P` produces clean, readable printout

- [ ] 12. **Add Print + Download PDF buttons to header**
       - Files: `components/benefits/BenefitsReportHeader.tsx`
       - Print = `window.print()`
       - Download PDF = same `window.print()` (browser's Save as PDF)
       - Hide buttons in print view (`print:hidden`)
       - Verify: buttons work, hidden when printing

### Phase 5: Polish + Edge Cases
> QA and refinement

- [ ] 13. **Handle edge cases**
       - 0 programs matched: keep existing empty state, skip dashboard/action plan
       - 1 program matched: skip action plan section (not useful for 1 program)
       - No savings data for any program: hide Financial Impact Dashboard entirely
       - Anonymous user: hide personalized name, show "Your Benefits Package"
       - Verify: test each edge case manually

- [ ] 14. **Responsive polish**
       - Financial dashboard: 2-col on desktop, stack on mobile
       - Action plan: full-width on all sizes
       - Document checklist: 2-col grid on desktop, single on mobile
       - Verify: check 375px, 768px, 1280px breakpoints

## Risks

- **Savings estimates are approximations** — mitigate with disclaimer: "Estimates based on typical program values. Actual amounts depend on individual circumstances."
- **Print layout across browsers** — Safari/Firefox print differently than Chrome. Test all three.
- **Page load size** — adding 5 new components. Mitigate: keep them simple, no heavy dependencies.
- **Supabase schema changes needed later** — the `how_to_apply_steps` and `estimated_monthly_savings` columns should be added to Supabase for real data, but MVP uses client-side lookups.

## Out of Scope (for now)

- **Spend-Down Calculator** — Complex interactive feature. Save for a follow-up PR.
- **Email PDF delivery** — Requires backend email integration. Defer.
- **Per-program application worksheet** — Print-ready form with blank fields for notes. Nice-to-have, defer.
- **Over-limit programs section** — Showing programs where user exceeds income. Needs spend-down calc to be useful. Defer.

## Notes

- Chantel's Lovable prototype is the UX north star but we're rebuilding in our stack, not porting her code
- The current `BenefitsResults.tsx` (320 lines) is manageable — new components keep it from bloating
- The matching API (`/api/benefits/match`) doesn't need changes — all new features are client-side presentation
- Keep the warm, reassuring tone: "You may qualify" not "You qualify"

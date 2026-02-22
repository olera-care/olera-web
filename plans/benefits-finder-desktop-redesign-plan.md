# Plan: Senior Benefits Finder — Desktop Care Planning Console

Created: 2026-02-22
Status: Not Started
Notion Task: Senior Benefits Finder Improvements & Optimizations (P1)

## Goal

Transform the Senior Benefits Finder from a narrow mobile-style wizard into a desktop-native Care Planning Console with a persistent Care Profile sidebar, real-time eligibility preview, non-linear navigation, and transparent rule resolution.

## Success Criteria

- [ ] Desktop layout fills horizontal space with two-panel architecture (sidebar + workspace)
- [ ] Persistent Care Profile sidebar shows filled answers, progress milestones, and edit affordances
- [ ] Users can jump to any section from the sidebar (non-linear navigation)
- [ ] Real-time eligibility preview in sidebar updates as answers change
- [ ] Results workspace uses full desktop width with transparent scoring ("why you qualify")
- [ ] Mobile gracefully collapses to single-column flow (no regression)
- [ ] Form state persists in URL params + localStorage (survives refresh)
- [ ] `/benefits` redirects to `/benefits/finder` (consolidate duplicate routes)
- [ ] Builds successfully with `npm run build` and no TypeScript errors

## Architecture Overview

```
Desktop (lg+):
┌──────────────────────────────────────────────────────┐
│  Navbar                                               │
├──────────────┬───────────────────────────────────────┤
│              │                                        │
│  Care Profile│  Active Workspace                      │
│  Sidebar     │                                        │
│  (~340px)    │  During intake: Current question        │
│              │  with focused interaction               │
│  - Progress  │                                        │
│  - Answers   │  After completion: Results dashboard   │
│  - Edit any  │  with programs, AAA, scoring           │
│  - Live      │                                        │
│    preview   │                                        │
│              │                                        │
├──────────────┴───────────────────────────────────────┤
│  Footer                                               │
└──────────────────────────────────────────────────────┘

Mobile (<lg):
┌────────────────────┐
│  Navbar             │
├────────────────────┤
│  Progress bar       │
├────────────────────┤
│                    │
│  Current question  │
│  (full width)      │
│                    │
├────────────────────┤
│  Footer             │
└────────────────────┘
```

### State Management

```
CareProfileContext (React Context)
├── answers: BenefitsIntakeAnswers
├── currentStep: IntakeStep
├── pageState: "intake" | "loading" | "results" | "error"
├── result: BenefitsSearchResult | null
├── previewCount: number | null (live eligible program count)
├── updateAnswer(field, value) → triggers debounced preview
├── goToStep(step) → non-linear navigation
├── submit() → full matching request
├── reset() → clear all state
└── Syncs to: URL params (step, zipCode) + localStorage (full answers)
```

---

## Tasks

### Phase 1: Foundation — Layout + State Architecture
> Goal: Break out of max-w-lg, establish two-panel layout, centralize state

- [ ] **1. Create CareProfileContext and useBenefitsState hook**
      - New files: `lib/benefits/care-profile-context.tsx`, `hooks/use-benefits-state.ts`
      - Lift all state from `page.tsx` and `BenefitsIntakeForm.tsx` into context
      - Add localStorage persistence (save answers on change, restore on mount)
      - Add URL param sync (step number, zipCode for shareability)
      - Depends on: none
      - Verify: Context provides answers, step, pageState. Refresh preserves answers.

- [ ] **2. Create desktop two-panel layout**
      - New file: `app/benefits/finder/layout.tsx`
      - Desktop (lg+): `flex` with 340px sticky sidebar + flex-1 main content
      - Mobile (<lg): Single column, no sidebar
      - Wrap children in CareProfileContext provider
      - Pattern: Follow `app/portal/layout.tsx` sidebar approach
      - Depends on: Task 1
      - Verify: `/benefits/finder` shows two-panel on desktop, single-column on mobile

- [ ] **3. Build CareProfileSidebar component (shell)**
      - New file: `components/benefits/CareProfileSidebar.tsx`
      - Shows: milestone progress (6 steps with labels), filled answers summary, edit buttons per section
      - Reads from CareProfileContext
      - Click on any completed section → `goToStep(n)`
      - Desktop only: `hidden lg:block`
      - Depends on: Tasks 1, 2
      - Verify: Sidebar renders, shows progress, clicking a section changes step

- [ ] **4. Refactor BenefitsIntakeForm to use context**
      - Modify: `components/benefits/BenefitsIntakeForm.tsx`
      - Remove internal state (step, answers) — read from context instead
      - Remove `onSubmit` prop — call `context.submit()` directly
      - Keep all step UI logic (pills, location search, validation)
      - Adapt container: remove `max-w-lg`, use `max-w-xl` for comfortable desktop reading width
      - Depends on: Task 1
      - Verify: Form works identically to before but state comes from context

- [ ] **5. Refactor page.tsx to use context**
      - Modify: `app/benefits/finder/page.tsx`
      - Remove local state (pageState, result, errorMsg) — read from context
      - Simplify to: render BenefitsIntakeForm or BenefitsResults based on context.pageState
      - Depends on: Tasks 1, 4
      - Verify: Full intake → results flow works end-to-end

- [ ] **6. Consolidate duplicate routes**
      - Modify: `app/benefits/page.tsx` → replace with redirect to `/benefits/finder`
      - Use Next.js `redirect()` from `next/navigation`
      - Depends on: none
      - Verify: Visiting `/benefits` redirects to `/benefits/finder`

### Phase 2: Sidebar Intelligence — Live Preview + Non-linear Nav
> Goal: Make the sidebar the command center with real-time feedback

- [ ] **7. Add real-time eligibility preview**
      - Modify: `hooks/use-benefits-state.ts`
      - After enough answers are filled (zipCode + age + at least one need), debounce (800ms) a call to `/api/benefits/match`
      - Store preview count in context: "X programs may match so far"
      - Don't block UI — preview is async background update
      - Depends on: Task 1
      - Verify: Fill location + age + needs → sidebar shows "12 programs may match"

- [ ] **8. Enhance CareProfileSidebar with live preview + polish**
      - Modify: `components/benefits/CareProfileSidebar.tsx`
      - Add: eligibility preview section ("12 programs may match" with subtle animation on count change)
      - Add: visual distinction for completed vs current vs upcoming steps
      - Add: answer summary with edit affordance (pencil icon → jumps to that step)
      - Styling: warm vanilla background, card container, Olera design values
      - Depends on: Tasks 3, 7
      - Verify: Sidebar updates live as answers change, edit buttons work

- [ ] **9. Add milestone progress visualization**
      - New file: `components/benefits/MilestoneProgress.tsx`
      - Replace linear step indicator with milestone-based vertical progress
      - Shows: step label + completion state (empty circle → filled → checkmark)
      - Current step highlighted with primary color
      - Completed steps show brief answer summary inline
      - Depends on: Task 1
      - Verify: Progress visualization renders correctly for all step combinations

### Phase 3: Results Workspace Redesign
> Goal: Full-width, transparent, structured results experience

- [ ] **10. Redesign BenefitsResults for desktop workspace**
      - Modify: `components/benefits/BenefitsResults.tsx`
      - Desktop layout: remove max-w-lg constraint
      - Top section: summary stats (X programs matched, top category, your state)
      - Main area: program cards in responsive grid (1 col mobile, 2 col desktop)
      - Category filter: horizontal chip bar (sticky on scroll)
      - Depends on: Task 5
      - Verify: Results fill desktop width, grid layout works, filters work

- [ ] **11. Redesign ProgramCard with transparent scoring**
      - Modify: `components/benefits/ProgramCard.tsx`
      - Always show: program name, tier badge, match score bar, top 2 match reasons
      - Expand to show: full description, all reasons, "what to say" script, action buttons
      - Add: "Why you qualify" section with checkmarks for each met criteria
      - Desktop: card can be wider, use horizontal space for score + reasons
      - Depends on: Task 10
      - Verify: Cards show scoring transparency, expand/collapse works

- [ ] **12. Promote AAACard to prominent workspace position**
      - Modify: `components/benefits/AAACard.tsx`
      - Desktop: render as a highlighted banner/card at top of results (full width)
      - Add: "This is your #1 recommended first step" messaging
      - Visually distinct from program cards (primary border, warm background)
      - Depends on: Task 10
      - Verify: AAA card renders prominently, action buttons work

- [ ] **13. Add results sidebar with Care Profile summary**
      - Modify: `components/benefits/CareProfileSidebar.tsx`
      - In results state: sidebar shows completed Care Profile + "Edit answers" CTA
      - Clicking "Edit answers" returns to intake with all answers preserved
      - Shows: location, age, care preference, needs, income, medicaid status
      - Depends on: Tasks 8, 10
      - Verify: Sidebar persists during results, edit returns to form with answers intact

### Phase 4: Polish + Mobile QA
> Goal: Animations, accessibility, mobile regression testing

- [ ] **14. Add transitions and micro-interactions**
      - Modify: Various components
      - Step transitions: subtle fade/slide when changing steps
      - Sidebar preview count: animate number changes
      - Results load: staggered card entrance animation
      - Depends on: All prior phases
      - Verify: Transitions feel smooth, no layout shifts

- [ ] **15. Accessibility audit and fixes**
      - Modify: All new/changed components
      - Focus management: sidebar nav items, step transitions
      - ARIA: landmarks (aside, main, nav), live regions for preview updates
      - Keyboard: all sidebar actions keyboard-navigable
      - Touch targets: 44px minimum on all interactive elements
      - Depends on: All prior phases
      - Verify: Tab through entire flow, screen reader announces updates

- [ ] **16. Mobile regression testing and responsive polish**
      - Modify: Layout and components as needed
      - Verify: mobile flow unchanged (single column, step-by-step)
      - Verify: tablet breakpoint (md) works reasonably
      - Verify: no horizontal scroll on any viewport
      - Fix any responsive issues found
      - Depends on: All prior phases
      - Verify: Test at 375px, 768px, 1024px, 1440px, 1920px viewports

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real-time API calls increase Supabase load | Medium | Debounce at 800ms, only call when minimum fields filled, cache results |
| Breaking mobile layout during desktop redesign | High | Mobile uses `hidden lg:block` / `lg:hidden` — desktop changes isolated. Test mobile at each phase. |
| localStorage conflicts across tabs | Low | Use namespaced key (`olera-benefits-draft`), add timestamp, clear on submit |
| Large refactor of BenefitsIntakeForm (459 lines) | Medium | Refactor state first (Task 4), keep all UI logic intact, test step-by-step |
| Supabase schema is shared with iOS | Low | Read-only usage — no schema changes needed. Same tables, same queries. |
| Context re-renders causing performance issues | Low | Memoize context value, split into separate contexts if needed (answers vs UI state) |

## File Impact Summary

### New Files (7)
- `app/benefits/finder/layout.tsx` — Desktop two-panel layout
- `lib/benefits/care-profile-context.tsx` — React context for state
- `hooks/use-benefits-state.ts` — State management + persistence + preview
- `components/benefits/CareProfileSidebar.tsx` — Persistent sidebar
- `components/benefits/MilestoneProgress.tsx` — Vertical milestone progress

### Modified Files (7)
- `app/benefits/finder/page.tsx` (104 lines) — Simplify to context consumer
- `app/benefits/page.tsx` (104 lines) — Replace with redirect
- `components/benefits/BenefitsIntakeForm.tsx` (459 lines) — Remove internal state, use context
- `components/benefits/BenefitsResults.tsx` (146 lines) — Desktop workspace layout
- `components/benefits/ProgramCard.tsx` (143 lines) — Transparent scoring
- `components/benefits/AAACard.tsx` (78 lines) — Prominent banner layout

### Untouched
- `app/api/benefits/match/route.ts` — No changes to matching engine
- `lib/types/benefits.ts` — No schema changes
- `lib/benefits/zip-lookup.ts` — No changes
- `hooks/use-city-search.ts` — No changes
- All Supabase tables — Read-only, no migrations

## Implementation Order

```
Phase 1 (Foundation):  Tasks 1→2→3→4→5→6  (can parallelize 4+6, 3 waits on 1+2)
Phase 2 (Sidebar):     Tasks 7→8→9         (7 can start with 1, 8+9 wait on 3+7)
Phase 3 (Results):     Tasks 10→11→12→13   (sequential, each builds on prior)
Phase 4 (Polish):      Tasks 14→15→16      (can parallelize 14+15, 16 is final)
```

## Notes

- The Notion spec emphasizes this should feel like a "Care Planning Console" — serious, structured, trustworthy. Avoid survey/marketing aesthetics.
- The eligibility engine is deterministic — lean into transparency. Show exactly which rules match, don't simulate AI scoring.
- Care Profile must remain compatible with the iOS app's shared schema. Desktop is an expanded interface to the same underlying profile, not a separate system.
- Voice mode is out of scope for this plan (iOS-only feature, web doesn't have it yet).
- Consider adding analytics events in a future pass (form completion rates, CTA clicks, drop-off points).

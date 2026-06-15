# Next Session Brief: Provider Page Benefits Module

> Copy this into a new Claude Code session to start the work. Branch from `staging`.

---

## What We're Building

A benefits discovery module on provider pages that bridges two currently disconnected parts of Olera: provider discovery and benefits discovery. The module sits below the Q&A section on provider detail pages and helps care seekers discover state benefits programs they may qualify for.

## Why This Matters

**The insight:** Care seekers find Olera through long-tail keywords and land on provider pages. Their most-interacted-with section is the Q&A (where they can ask providers questions without providing email — very low friction). The actual CTA (name + email + care needs) gets less engagement. Users are in **research mode**, not decision mode.

**The opportunity:** A family asking "Does this provider accept Medicaid?" on a Q&A section is one click away from "You may qualify for STAR+PLUS, which would cover this provider's services." That's not a cross-sell — it's answering the question they're actually asking. This module creates a natural value exchange: "we'll show you programs that could save you money" → "save this to your account."

**The conversion goal:** Get care seekers to save benefits results to their Olera profile (lightweight account creation), giving them a reason to come back and deepening the relationship beyond a single provider page visit.

## The Design Flow (agreed with TJ)

### Step 1 — The Hook (zero questions)
Below the Q&A section, show 2-3 top benefits for that provider's state with their savings potential. No form, no screener. Just: "Texas families save up to $20,000/year on care through programs like STAR+PLUS." The data is already there — we have savings ranges for every program. This costs the user nothing and plants the seed.

### Step 2 — The Screener (2 fields, same pattern as eligibility check)
"See which programs your family qualifies for." Age + income, or age + Medicaid status. Instant results. We already built this logic — just needs to be extracted into a shared component.

### Step 3 — The Results (the value delivery)
Show matching programs with savings, one-line descriptions, and a link to each program page. This is the moment where Olera goes from "provider directory" to "someone who actually helps my family navigate the system."

### Step 4 — The Save Moment (the conversion)
"Save these results to your account." Not a gate — they've already seen the value. The save is a gift: "Come back to this anytime, get updates when programs change, track your applications." Email-only, magic link. Same low-friction philosophy as the Q&A section.

## Design Principles

This module should follow the `/punch` design principles (see `.claude/commands/punch.md`):
- **Lead with VALUE, not forms.** Show savings before asking questions.
- **Low friction.** The Q&A works because it doesn't require email. This module should feel equally effortless.
- **Wispr Flow restraint.** One thing at a time. Don't show the screener AND the results AND the save prompt all at once.
- **The module is a billboard, not a page.** Keep it compact on the provider page — it teases and links to the full experience, not replicate it inline.
- **Warm, not salesy.** "You might qualify for help" not "SAVE $20,000 NOW." Olera's voice is a thoughtful guide, not a lead gen form.

## Technical Context

### What already exists (reuse these):
- **Eligibility check logic**: `QuickEligibilityCheck` in `components/waiver-library/ProgramPageV3.tsx` — age + income matching against `structuredEligibility` data. Extract into shared component.
- **State page eligibility check**: `InlineBenefitsCheck` in `components/waiver-library/StatePageV3.tsx` — age + Medicaid matching. Similar pattern.
- **Per-state program data**: `data/waiver-library.ts` (base) + `data/pipeline-drafts.ts` (enriched content). Use `getEnrichedProgram` from `lib/program-data.ts` for merged data.
- **Saved programs system**: `hooks/use-saved-programs.ts` + `SavedProgramsProvider` in layout + Supabase `saved_programs` table. Already wired up globally.
- **Provider data**: Provider pages get state from provider record. Use this to determine which state's benefits to show.
- **Auth system**: `components/auth/UnifiedAuthModal.tsx` — handles email OTP + Google OAuth. Already used for save/bookmark features.

### Key files to read first:
1. `app/provider/[slug]/page.tsx` — the provider detail page (where the module goes)
2. `components/providers/QASectionV2.tsx` — the Q&A section (module goes below this)
3. `components/waiver-library/ProgramPageV3.tsx` — has `QuickEligibilityCheck` to extract
4. `components/waiver-library/StatePageV3.tsx` — has `InlineBenefitsCheck` to reference
5. `lib/program-data.ts` — the data merge layer
6. `hooks/use-saved-programs.ts` — save/bookmark functionality
7. `.claude/commands/punch.md` — design principles for this module

### Branch strategy:
- Branch from `staging` (PR #535 just merged — staging has all benefits work)
- `git checkout -b feature/provider-benefits-module origin/staging`

### Database:
- Provider records have `state` field — use this to determine benefits state
- `saved_programs` table already exists (migration 035)
- No new migrations expected unless we add a "benefits check results" table

## What NOT to Do

- **Don't make it a full page experience inline.** The provider page is already long. This is a teaser module — compact, enticing, links to the full benefits page for deep engagement.
- **Don't require email upfront.** Match the Q&A section's low-friction philosophy. Email comes at the save moment, after value has been delivered.
- **Don't hardcode per-state content.** Use the existing pipeline data — `waiver-library.ts` has savings ranges and program data for all 50 states.
- **Don't put the screener as the first thing the user sees.** Lead with value (savings potential, program count) first. Screener is step 2.
- **Don't forget Texas has parallel routes.** Texas providers will link to `/texas/benefits/` not `/senior-benefits/texas/`. See CLAUDE.md "Parallel Routes (Texas)" section.

## Open Questions for the Session

1. **Module placement**: Below Q&A section is the plan. But should it be a distinct card/section, or integrated more subtly (like a contextual suggestion within the Q&A flow)?
2. **State detection**: Provider `state` field should work for most cases. What about multi-state providers or providers without a state field?
3. **Which programs to feature**: Top 3 by savings? Most popular? Most broadly eligible? The pipeline has `complexity` and `programType` fields to help filter.
4. **Save-to-profile flow**: Use existing `saved_programs` or create a new "benefits check results" concept? The existing save is per-program; this might be a "your family's benefits profile" which is broader.

---

*Brief prepared Apr 11, 2026 — Session 73 on branch `eager-ride` (now merged to staging via PR #535)*

# /m/{token} redesign — results page that grows into the benefits home

Locked with TJ 2026-07-28. Branch: `benefits-results-home` (off staging, this worktree).

## Decisions (TJ)

- Build the PAGE now, with structure that grows into the persistent benefits HOME later.
- Reference quality bar: the provider "Your profile" page (screenshot in session 263c4d61):
  personal greeting, ONE warm hero card with one CTA, visible progress ring,
  sequenced opportunity cards, identity confirmation. NOT a directory.
- Kill the SEO discovery-zone footer on /m/ and /benefits-outcome (noindex pages;
  add to ConditionalFooter's SimpleFooter list).
- "What we know" panel MAY ask (one-tap chips for gaps — absorbs enrichment for
  the 27% who skip it). Uses same PATCH /api/benefits/update-enrichment.
- The problem being solved: page answers "what exists" instead of "what should I
  do"; zero recognition of the person; 11 equal-weight cards = decision tax at
  the highest-attention moment (91% of views <1h post-intake; SMS now links here).

## Page structure (top to bottom)

1. **Recognition header** — "Hi {firstName}" + what-we-know chips (state, care
   need, relationship, timeline, payment). Gap chips are tappable asks (same
   enrichment PATCH, tell-back on answer). Copy: "Based on what you shared" made
   REAL. No re-asking what's known.
2. **Start here hero card** (warm dark card like provider launch-plan card) —
   ONE program via selectFirstStepProgram (entry-source → simplest saved →
   state startHere) + buildCallScript from lib/family-comms/benefits-cascade.server:
   program name, typical savings, CALL button (tel:), 2-line script, top 3 docs,
   "why this one first" line. Mirrors B1 email (arrives 2 days earlier).
3. **Cascade progress strip** (v1 minimal) — matched → first step → moving.
   Reads metadata.benefits_cascade. Grows into the home's spine later.
4. **"Your other N matches"** — grouped by job (pay for care / food & bills /
   home & energy / health coverage), one-line rows, collapsed by default,
   count badges. Existing match list, no new data.
5. **Quiet human line** — "Want a person to walk you through it? Reply to our
   email or ask for help" → wants_help capture deferred to check-in email for
   v1 (TJ hasn't approved day-one escalation; keep mailto support@).
6. **No SEO footer** (ConditionalFooter: add /m/ + /benefits-outcome to
   SimpleFooter branch).

## Implementation notes

- Server component app/m/[token]/page.tsx already loads bundle + profile;
  extend to run selectFirstStepProgram (needs account_id via profile) and read
  benefits_cascade meta. ResultsSheet (components/benefits/ResultsSheet.tsx,
  358 lines) currently renders the flat list in mode="page"; either add a new
  mode or build a new BenefitsHome component and keep ResultsSheet for the
  in-session overlay (PREFER new component; overlay keeps old behavior).
- Program grouping: category/program_type + name keywords (reuse paysForCare-
  style keyword approach from benefits-guidance.server if needed).
- Phone capture tie-in: if profile has no phone, recognition panel includes the
  "Want this by text?" chip (same capture API, source benefits_results_home).
- Render/design bar: fb:design_taste (Perena/Airbnb, warm, restrained),
  fb:mobile_no_containers (whitespace + hairlines, ONE hero card max),
  no em dashes in copy.
- Validate: tsc, mobile screenshot via headless Chrome, dry-run nothing needed
  (read-only page), preview e2e with a real token.

## Status

- [x] Branch created
- [ ] ConditionalFooter fix
- [ ] BenefitsHome component + page wiring
- [ ] Grouping + recognition chips
- [ ] Validation + PR

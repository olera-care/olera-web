# Senior Benefits Expansion Pipeline

You are helping expand Olera's senior benefits coverage to new states. The pipeline explores benefit programs, verifies data against official sources, flags errors in our existing data, and updates the site.

This skill supports two modes:
- **New state mode**: Run the full pipeline on a state
- **Apply mode**: Ingest pipeline findings into the codebase after review

Always start with Step 0 to understand the current state before doing any work.

## Environment Setup

**API keys live in `~/Desktop/olera-web/.env.local`** (gitignored, pulled from Vercel). NEVER ask for API keys. If the file doesn't exist, tell the user to run:
```bash
cd ~/Desktop/olera-web && npx vercel env pull .env.local
```

**Node scripts must run from `~/Desktop/olera-web`** (has node_modules). Worktrees don't have node_modules installed. The pipeline script handles worktree env loading automatically.

## Step 0: Understand Current State

Check what's already been explored:

```bash
ls data/pipeline/
```

Each directory is a state that's been explored. For each, check if it has:
- `explore.json` — landscape survey done
- `dive.json` — deep dives done
- `compare.json` — comparison done
- `exploration_report.md` — report generated

Also check the admin dashboard data:
```bash
cat data/pipeline-summary.ts | head -40
```

Check which states have verified programs in `waiver-library.ts`:
```bash
node scripts/benefits-pipeline.js --state TX
```

Present a summary: which states have been explored, which have verified data, what's the next state to tackle. Ask what the user wants to do.

## Pipeline Script Reference

```bash
# Dry run (preview what would happen)
node scripts/benefits-pipeline.js --state MI

# Full exploration (~4 min, ~$0.09)
node scripts/benefits-pipeline.js --state MI --run

# Single phase only
node scripts/benefits-pipeline.js --state MI --phase explore --run
node scripts/benefits-pipeline.js --state MI --phase dive --run
node scripts/benefits-pipeline.js --state MI --phase compare --run
node scripts/benefits-pipeline.js --state MI --phase report --run
```

**Phases run in order. Each phase reads the previous phase's output:**
- `explore` → finds all programs (2 Perplexity queries: federal + state-unique)
- `dive` → deep dives each program (1 Perplexity query per program, open-ended)
- `compare` → cross-references against `waiver-library.ts`, surfaces diffs and novel fields
- `report` → generates markdown report + auto-updates `data/pipeline-summary.ts`

**Resumable:** If a phase was already run, its output file exists and later phases can read it. You can re-run just one phase without re-running the rest.

## Step 1: Explore a State

Run the full pipeline:

```bash
node scripts/benefits-pipeline.js --state XX --run
```

This takes ~4 minutes and costs ~$0.09. It will:
1. Discover all programs in the state
2. Deep dive each one (eligibility, benefits, application, gotchas)
3. Compare against our existing data
4. Generate a markdown report
5. Auto-update `data/pipeline-summary.ts` (admin dashboard picks this up)

**After it finishes:**

1. Read the exploration report:
```bash
cat data/pipeline/XX/exploration_report.md
```

2. Summarize for the user:
   - How many programs found
   - How many data discrepancies (our data vs official sources)
   - How many new programs not in our data
   - What data fields our model can't capture yet
   - Any gotchas or surprises

3. Post the summary to Notion under the Benefits Data page:
   - Parent page ID: `3345903a-0ffe-8185-8b5b-d3dbdccd683f`
   - Title: `{State Name} Pipeline Exploration — {date}`
   - Include: summary stats, data discrepancies, new programs, questions for review

4. Ask if the user wants to apply the findings now or review first.

## Step 2: Apply Findings

After the user reviews the report (or immediately if they want to move fast), apply the pipeline's findings to the codebase.

### Fix Data Errors

Read the compare data:
```bash
cat data/pipeline/XX/compare.json
```

For each diff where the pipeline found our data is wrong:
1. Read the relevant program in `data/waiver-library.ts`
2. Update the incorrect field with the pipeline's finding
3. Add verification metadata:
   - `sourceUrl` — the official .gov URL from the pipeline
   - `lastVerifiedDate` — today's date
   - `verifiedBy` — "pipeline"
   - `savingsSource` — where the savings number came from
   - `savingsVerified` — true if the pipeline found a real number

**Important checks when applying:**
- If the pipeline says savings should be "Free service", set `savingsRange` to `""` (empty string, not "Free service" — the UI renders "Save {savingsRange}" so non-empty strings display wrong)
- Update ALL references to changed numbers — eligibility highlights AND FAQ text AND application steps. They must be consistent within the same program.
- For free services (ombudsman, legal aid, companion), also check that `savingsSource` says "Free service" or similar

### Add New Programs

For new programs the pipeline discovered that should be added:
1. Read the dive data for the program from `data/pipeline/XX/dive.json`
2. Create a new entry in `waiver-library.ts` following the existing format
3. Include all verification metadata from the pipeline
4. Generate FAQs if the dive data has enough info (or leave faqs empty for now)

### Seed Supabase

After updating `waiver-library.ts`:

```bash
# Dry run first
curl "https://staging-olera2-web.vercel.app/api/admin/seed-sbf-programs?state=XX&dry_run=true"

# If dry run looks good
curl "https://staging-olera2-web.vercel.app/api/admin/seed-sbf-programs?state=XX&confirm=true"
```

**Important:** The seed endpoint must be called on the deployed version (staging or production), not localhost, because it needs admin auth. The user must be logged in as admin in their browser. Alternative: have the user visit the URL directly in their browser.

## Step 3: Build and Verify

1. Run `npx next build` to verify no errors
2. Check the admin dashboard: does the state show as partially/fully verified?
3. Check a sample program page: `/waiver-library/{state-id}/{program-id}`

## Step 4: Commit and PR

Commit changes and create PR to staging:

```bash
git add data/waiver-library.ts data/pipeline-summary.ts
git commit -m "Verify {State} benefits: {N} programs verified, {N} errors fixed

- Pipeline exploration found {findings summary}
- Fixed: {list key corrections}
- Added: {list new programs if any}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git push origin {branch}
gh pr create --base staging --title "Verify {State} benefits data" --body "..."
```

## Key Files

| What | Where |
|------|-------|
| Pipeline script | `scripts/benefits-pipeline.js` |
| Pipeline output | `data/pipeline/{STATE}/` |
| Dashboard summary (auto-generated) | `data/pipeline-summary.ts` |
| Source of truth for programs | `data/waiver-library.ts` |
| Admin dashboard | `app/admin/benefits/page.tsx` |
| Seed endpoint | `app/api/admin/seed-sbf-programs/route.ts` |
| Program types | `lib/types/benefits.ts` |
| SQL migration | `supabase/migrations/034_sbf_verification_metadata.sql` |
| Notion: Benefits Data page | `3345903a-0ffe-8185-8b5b-d3dbdccd683f` |
| Notion: Product Development | `5d14b458-594c-4031-b671-81a0fc612644` |

## Waiver Library Data Shape

Each program in `waiver-library.ts` looks like:
```typescript
{
  id: "state-program-name-slug",
  name: "Official Program Name",
  shortName: "Abbreviation",
  tagline: "One-line description",
  savingsRange: "$X – $Y/year in 2026",  // or "" for free services
  description: "Full description",
  eligibilityHighlights: ["Age 65 or older", "Income below $X/month"],
  applicationSteps: [{ step: 1, title: "...", description: "..." }],
  forms: [{ id: "...", name: "...", description: "...", url: "..." }],
  // Optional
  intro: "Detailed intro paragraph",
  faqs: [{ question: "...", answer: "..." }],
  serviceAreas: [{ name: "City", description: "Counties" }],
  phone: "1-800-XXX-XXXX",
  // Verification metadata
  sourceUrl: "https://state.gov/program",
  lastVerifiedDate: "2026-04-07",
  verifiedBy: "pipeline",
  savingsSource: "Description of where savings number came from",
  savingsVerified: true,
}
```

## Known Issues and Learnings

### From Texas (Chantel's manual audit, March 2026)
- SNAP income limit was wrong ($1,729 → $2,152)
- MEPD income limit was wrong ($994 → $967)
- Three free services (Ombudsman, Legal, Companion) had fake savings ranges ($10K–$30K)
- FAQ text and eligibility highlights had inconsistent numbers — always update ALL references
- "Save Free service" renders wrong in the UI — use empty string for savingsRange

### From Michigan (first pipeline run, April 2026)
- PACE age was wrong (65 → 55)
- SNAP age was wrong (65 → 60)
- Ombudsman had fake savings again (different state, same pattern)
- Pipeline found 5 data field types our model can't capture yet: asset_limits, regional_variations, waitlist, documents_required, household_size_table
- Dedup catches most duplicates but "MI Choice Medicaid Waiver" vs "MI Choice Waiver Program" still sometimes both survive

### General
- Programs don't all have the same shape. Some need household-size income tables, some have asset limits, some are free services. The data model will evolve — don't force it.
- Perplexity sometimes refuses overly specific prompts. The pipeline uses open-ended questions instead of predetermined forms.
- Government websites often block HEAD requests. URL checking may show false "broken" results for valid .gov URLs.
- Always verify the pipeline's findings — it's a research tool, not an oracle. It flags issues for review.
- The pipeline auto-updates `data/pipeline-summary.ts` so the admin dashboard immediately shows findings. No manual step needed.
- Pages auto-generate from `waiver-library.ts` via `generateStaticParams`. Adding programs = pages on next deploy.

## Cost Per State

| Item | Cost |
|------|------|
| Explore (2 Perplexity queries) | ~$0.01 |
| Deep dive (1 query per program, ~15 programs) | ~$0.08 |
| Compare + Report | $0 (local processing) |
| **Total** | **~$0.09** |

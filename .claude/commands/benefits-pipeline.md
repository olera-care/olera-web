# Senior Benefits Pipeline — Content Production System

You are helping expand Olera's senior benefits coverage. The pipeline discovers programs, researches them, classifies their type and complexity, generates page content drafts, and produces reports. Run it autonomously end-to-end without pausing for approval.

## Environment Setup

**API keys live in `~/Desktop/olera-web/.env.local`** (gitignored, pulled from Vercel). NEVER ask for API keys. If the file doesn't exist, tell the user to run:
```bash
cd ~/Desktop/olera-web && npx vercel env pull .env.local
```

Required keys:
- `PERPLEXITY_API_KEY` — for explore + dive phases (research)
- `ANTHROPIC_API_KEY` — for draft phase (content generation)

**Node scripts must run from `~/Desktop/olera-web`** (has node_modules). Worktrees don't have node_modules installed. The pipeline script handles worktree env loading automatically.

## Step 0: Understand Current State

**First, check for approved drafts ready to publish.** Query the draft reviews API:

```bash
curl -s "https://staging-olera2-web.vercel.app/api/admin/draft-reviews" \
  -H "Cookie: $(cat ~/.olera-session 2>/dev/null || echo '')" | head -200
```

If that fails (auth required), check the local pipeline data instead:

```bash
ls data/pipeline/
```

Each directory is a state. Check for:
- `explore.json` — landscape survey done
- `dive.json` — deep dives done
- `compare.json` — comparison done
- `classify.json` — classification done (program types, geo scopes, complexity)
- `drafts.json` — content drafts generated
- `exploration_report.md` — report generated

Also check the admin dashboard data:
```bash
cat data/pipeline-summary.ts | head -50
```

**Present a summary to the user:**
1. **Approved drafts** — If any programs across any states have been marked "approved" in the review workflow, list them prominently: "{N} programs approved and ready to publish: {list}. Apply all?"
2. **State overview status** — Check if any state overviews have been approved (review with `programId: "state-overview"`). List: "{State} state page: approved/pending/needs-changes"
3. **Pipeline status** — Which states have been explored, classified, drafted
4. **Needs attention** — Any programs or state overviews marked "needs-changes" with reviewer comments
5. **Next states** — Suggest the next high-population states to explore

If approved drafts exist, offer to apply them first before doing any new exploration. Applying means: read the draft from `data/pipeline/{STATE}/drafts.json`, write the v2 fields into the matching program in `data/waiver-library.ts`, commit, and push.

If an approved state overview exists, the state page is already rendering from `pipeline-drafts.ts` — no separate apply step needed. Just confirm the v2 state page looks good at `/waiver-library/{state-id}` (compare with old page at `/current`).

## Pipeline Script Reference

```bash
# Seed mode (default) — full pipeline: explore → dive → compare → classify → draft → report
node scripts/benefits-pipeline.js --state MI              # dry-run
node scripts/benefits-pipeline.js --state MI --run        # full pipeline
node scripts/benefits-pipeline.js --state MI --phase explore --run

# Refine mode — re-draft weak programs (thin FAQs, missing documents, no contacts)
node scripts/benefits-pipeline.js --state MI --mode refine --run

# Update mode — re-explore + patch changed data (income limits, URLs, phones) without full re-draft
node scripts/benefits-pipeline.js --state MI --mode update --run

# Region (any geographic entity)
node scripts/benefits-pipeline.js --region "Miami-Dade County, FL" --parent-state FL --run
node scripts/benefits-pipeline.js --region "Greater Houston" --parent-state TX --run
node scripts/benefits-pipeline.js --region "DMV" --run
```

### Pipeline Modes

| Mode | What it does | When to use |
|------|-------------|-------------|
| `seed` (default) | Full 6-phase pipeline | First run on a new state |
| `refine` | Re-draft programs with weak content | After seed, to improve quality |
| `update` | Re-explore + patch changed fields | Periodic refresh of data |

`--state XX` is shorthand for `--region "{state name}"`. `--parent-state` links a region to a state for comparison data.

**Six phases run in order. Each reads the previous phase's output:**
1. `explore` — finds all programs (2 Perplexity queries adapted to entity type)
2. `dive` — deep dives each program (1 Perplexity query per program)
3. `compare` — cross-references against `waiver-library.ts` (uses parent state data for regions)
4. `classify` — determines program type, geographic scope, complexity ($0, local processing)
5. `draft` — generates structured page content via Claude API (1 call per program)
6. `report` — generates markdown report + auto-updates `data/pipeline-summary.ts` and `data/pipeline-drafts.ts`

**Output:** State data goes to `data/pipeline/{STATE_CODE}/`, region data to `data/pipeline/{slug}/` (e.g., `data/pipeline/miami-dade-county-fl/`).

**Resumable:** If a phase was already run, its output file exists and later phases can read it.

**Pages:** States render at `/waiver-library/{state-id}` (existing). All entities also render at `/benefits/{slug}` (flat routing — "michigan" and "miami-dade-county-fl" are peers).

## Step 1: Explore a State

Run the full pipeline:

```bash
node scripts/benefits-pipeline.js --state XX --run
```

**After it finishes:**

1. Read the exploration report:
```bash
cat data/pipeline/XX/exploration_report.md
```

2. Read the classification:
```bash
cat data/pipeline/XX/classify.json | head -40
```

3. Read the drafts (if generated):
```bash
cat data/pipeline/XX/drafts.json | head -100
```

4. Summarize for the user:
   - How many programs found and their types (benefit/resource/navigator/employment)
   - Data discrepancies (our data vs official sources)
   - New programs not in our data
   - Classification breakdown (types, scopes, complexity)
   - How many content drafts generated
   - Any gotchas or surprises

5. Post the summary to Notion under the Benefits Data page:
   - Parent page ID: `3345903a-0ffe-8185-8b5b-d3dbdccd683f`
   - Title: `{State Name} Pipeline Exploration — {date}`
   - Include: summary stats, classification, draft count, questions for review

## Step 2: Apply Findings

### Fix Data Errors

For each diff where the pipeline found our data is wrong:
1. Read the relevant program in `data/waiver-library.ts`
2. Update the incorrect field with the pipeline's finding
3. Add verification metadata:
   - `sourceUrl`, `lastVerifiedDate`, `verifiedBy: "pipeline"`
   - `savingsSource`, `savingsVerified`

**Important:** If savings should be "Free service", set `savingsRange` to `""` (empty string). Update ALL references to changed numbers — eligibility highlights AND FAQ text AND application steps.

### Apply Drafts to New Programs

For new programs with drafts in `data/pipeline/XX/drafts.json`:
1. Read the draft — it's already structured as a WaiverProgram-compatible object
2. Add to `waiver-library.ts` following existing format
3. Include the pipeline v2 fields: `programType`, `geographicScope`, `complexity`, `applicationGuide`, `structuredEligibility`, `contentSections`, `contentStatus`
4. Set `contentStatus: "pipeline-draft"` until human review

### Seed Supabase (after verification)

```bash
# Dry run first
curl "https://staging-olera2-web.vercel.app/api/admin/seed-sbf-programs?state=XX&dry_run=true"

# If dry run looks good
curl "https://staging-olera2-web.vercel.app/api/admin/seed-sbf-programs?state=XX&confirm=true"
```

## Step 3: Build and Verify

1. Run `./node_modules/.bin/next build` to verify no errors
2. Check the admin dashboard: does the state show updated readiness?
3. Check the v2 state page: `/waiver-library/{state-id}` — verify overview, start-here picks, need groups render correctly
4. Compare with old page: `/waiver-library/{state-id}/current` — the `/current` route always renders the legacy page
5. Check a sample program page: `/waiver-library/{state-id}/{program-id}`

## Step 4: Commit and PR

```bash
git add data/waiver-library.ts data/pipeline-summary.ts data/pipeline/
git commit -m "Run benefits pipeline on {State}: {N} programs, {N} drafts

- {N} benefit, {N} resource, {N} navigator, {N} employment
- {N} data discrepancies found and fixed
- {N} new programs added with content drafts
- Classification and draft data in data/pipeline/{STATE}/

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

git push origin {branch}
gh pr create --base staging --title "Benefits pipeline: {State}" --body "..."
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
| Program types (Supabase) | `lib/types/benefits.ts` |
| Notion: Benefits Data page | `3345903a-0ffe-8185-8b5b-d3dbdccd683f` |
| Notion: Pipeline v2 spec | `33c5903a-0ffe-81f9-8ab9-f5f40c10dc2b` |

## Data Model (Pipeline v2)

Programs now have optional classification and rich content fields:

```typescript
{
  // Existing flat fields (backwards-compatible)
  id, name, shortName, tagline, savingsRange, description,
  eligibilityHighlights, applicationSteps, forms,
  intro, faqs, phone, sourceUrl, lastVerifiedDate, verifiedBy,
  savingsSource, savingsVerified,

  // Pipeline v2: Classification
  programType: "benefit" | "resource" | "navigator" | "employment",
  geographicScope: { type: "federal" | "state" | "local", localEntities?: [...] },
  complexity: "deep" | "medium" | "simple",

  // Pipeline v2: Rich content
  applicationGuide: { method, summary, steps, processingTime, waitlist, tip, urls },
  structuredEligibility: { summary, incomeTable, assetLimits, functionalRequirement, ... },
  contentSections: [
    { type: "income-table", rows: [...] },
    { type: "what-counts", included: [...], excluded: [...] },
    { type: "tier-comparison", tiers: [...] },
    { type: "county-directory", offices: [...] },
    { type: "documents", categories: [...] },
    { type: "callout", tone: "warning", text: "..." },
  ],

  // Pipeline v3: Editorial depth (from Chantel's Texas audit)
  documentsNeeded: ["Social Security award letter", ...],  // 6-15 program-specific items
  contacts: [{ label: "Texas 2-1-1", phone: "2-1-1", hours: "24/7", description: "..." }],
  regionalApplications: [{ region: "Coastal Bend", counties: [...], url: "...", isPdf: true }],
  applicationNotes: ["Crisis cases get expedited processing", ...],
  relatedPrograms: ["SNAP", "LIHEAP", ...],

  // Lifecycle
  contentStatus: "pipeline-draft" | "under-review" | "approved" | "published",
  draftedAt, reviewedBy, reviewedAt,
}
```

## Program Type Classification

| Type | What it is | Page shape |
|------|-----------|------------|
| **benefit** | Qualification-gated, has savings | Full: eligibility, savings, application, documents, FAQs |
| **resource** | Available to all, free | Contact-focused: what it is, how to reach them |
| **navigator** | Helps access other programs | Gateway: what programs they connect you to |
| **employment** | Paid work/training | Opportunity: requirements, what the work is |

## Content Voice (enforced in draft phase)

1. Lead with caregiver's need, not the definition
2. Causal chains: "Because X, your parent won't need to Y"
3. Specific evidence immediately after claims
4. Clarify jargon inline in parentheses
5. End sections with the next step
6. No hedging, no filler, no bureaucratic language
7. Honest about unknowns — fewer facts > more filler

## Known Learnings

### Texas (Chantel's audit, March 2026)
- SNAP income $1,729 → $2,152. MEPD income $994 → $967
- Free services had fake savings ranges — use `savingsRange: ""`
- FAQ text and eligibility highlights must stay consistent

### Michigan (first pipeline run, April 2026)
- PACE age 65 → 55. SNAP age 65 → 60
- 16 programs found: 9 benefit, 4 resource, 2 navigator, 1 employment
- 5 novel field types: asset_limits, regional_variations, waitlist, documents_required, household_size_table
- Pipeline v2 model now captures all of these

### General
- Programs don't all have the same shape. The classification system handles this.
- Perplexity for research, Claude for content generation — different tools for different strengths.
- Always verify pipeline findings. It flags issues for review, it's not an oracle.
- Run end-to-end without pausing. TJ prefers autonomous execution.
- Pipeline generates both program-level drafts AND state-level overview (intro, start-here, by-need, quick facts). Both need team review before going live.
- State overview review uses `programId: "state-overview"` in the same review API.
- The v2 state page renders automatically from `pipeline-drafts.ts` when overview exists. Force old page with `/current`.

## Cost Per State

| Item | Cost |
|------|------|
| Explore (2 Perplexity queries) | ~$0.01 |
| Deep dive (~15 programs × 1 query) | ~$0.08 |
| Compare + Classify | $0 (local) |
| Draft (~15 programs × 1 Claude call, v3 fields) | ~$0.50 |
| Report | $0 (local) |
| **Seed total** | **~$0.60** |
| **Refine (weak programs only)** | **~$0.10-0.30** |
| **Update (re-explore + patch)** | **~$0.09** |

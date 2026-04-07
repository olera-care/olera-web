# Benefits Expansion Workflow

> How we expand to a new state, end to end.
> For the Apr 7 meeting with Chantel + Logan.

---

## The City Pipeline Comparison

The city pipeline is one command: `node scripts/pipeline-batch.js --cities "Austin, TX" --run`. When it finishes, providers are in Supabase, pages are live, Notion is updated, images are uploaded. Nobody has to do anything else.

Benefits can't work that way. The content is YMYL (Your Money or Your Life) — publishing wrong income limits or eligibility requirements can suppress our domain on Google and mislead vulnerable families. Every claim needs human verification before it goes live.

But it should still feel seamless. The pipeline does the heavy lifting. Humans review and approve. Then the pages go live.

---

## The Workflow

```
┌──────────────────────────────────────────────────────────────┐
│  Step 1: EXPLORE                                    ~4 min  │
│  Claude runs: benefits-pipeline.js --state MI --run         │
│                                                              │
│  What happens:                                               │
│  • Discovers all programs in the state (federal + unique)    │
│  • Deep dives each program (eligibility, benefits, gotchas)  │
│  • Compares against our existing data (surfaces diffs)       │
│  • Generates markdown report                                 │
│  • Posts summary to Notion ← NEW                            │
│  • Updates admin dashboard automatically                     │
│                                                              │
│  Output:                                                     │
│  • data/pipeline/MI/exploration_report.md                    │
│  • Notion page: "Michigan Exploration — Apr 7"               │
│  • /admin/benefits shows MI with pipeline findings           │
├──────────────────────────────────────────────────────────────┤
│  Step 2: REVIEW                                   ~30 min   │
│  Chantel + TJ review the findings                           │
│                                                              │
│  Chantel:                                                    │
│  • Reads the Notion summary (or exploration_report.md)       │
│  • Spot-checks 3-5 programs against michigan.gov             │
│  • Marks each program: ✅ Verified | ⚠️ Needs Fix | ❌ Skip │
│  • Adds corrections directly in Notion comments              │
│                                                              │
│  TJ:                                                         │
│  • Reviews at /admin/benefits → Michigan                     │
│  • Sees pipeline diffs inline on each program                │
│  • Clicks through to live waiver library pages               │
│  • Decides: ready to update, or needs more work?             │
├──────────────────────────────────────────────────────────────┤
│  Step 3: APPLY                                     ~10 min  │
│  Claude ingests approved changes                             │
│                                                              │
│  What happens:                                               │
│  • Reads Chantel's review + pipeline findings                │
│  • Updates waiver-library.ts with corrected data             │
│  • Adds new programs discovered by pipeline                  │
│  • Adds verification metadata (source URLs, dates)           │
│  • Seeds Supabase via admin endpoint                         │
│  • Pages auto-generate on next build                         │
│                                                              │
│  This is a Claude session, not an automated script —         │
│  because each program may need different handling.           │
├──────────────────────────────────────────────────────────────┤
│  Step 4: PREVIEW                                    ~5 min  │
│  TJ reviews on staging                                       │
│                                                              │
│  • PR created to staging                                     │
│  • Vercel preview deploys automatically                      │
│  • TJ visits /admin/benefits → MI → click programs           │
│  • Checks rendered pages look correct                        │
│  • Approves or requests changes                              │
├──────────────────────────────────────────────────────────────┤
│  Step 5: PUBLISH                                    ~1 min  │
│  TJ merges                                                   │
│                                                              │
│  • PR merged to staging → pages live on staging              │
│  • When ready: promote staging → main → production           │
│  • Dashboard shows MI as verified                            │
└──────────────────────────────────────────────────────────────┘
```

**Total time per state: ~50 minutes**
- 4 min automated (pipeline)
- 30 min Chantel review
- 10 min Claude apply
- 5 min TJ preview
- 1 min merge

**Cost per state: ~$0.09** (Perplexity API calls)

---

## What's Built vs What's Needed

| Component | Status | What it does |
|-----------|--------|-------------|
| Pipeline script | ✅ Built | Explore → dive → compare → report |
| Admin dashboard | ✅ Built | State grid, program preview, pipeline diffs inline |
| Deep links | ✅ Built | Dashboard → live waiver library pages |
| Auto-summary | ✅ Built | Pipeline → dashboard data (no manual step) |
| Page generation | ✅ Existing | waiver-library.ts → pages via generateStaticParams |
| Seed endpoint | ✅ Updated | Passes verification metadata to Supabase |
| SQL migration | ✅ Run | Verification columns on sbf_state/federal_programs |
| **Notion integration** | **🔨 Building** | Pipeline posts summary to Notion after each run |
| **Review tracking** | **📋 Design** | Notion database for Chantel's per-program review |
| Apply step | ✅ Works | Claude session with TJ (proven with TX audit) |
| PR workflow | ✅ Existing | Branch → staging → preview → merge |

---

## Roles

### Claude (AI)
- Runs the pipeline
- Ingests Chantel's corrections into codebase
- Creates PRs
- Does NOT publish without human approval

### Chantel (Research)
- Reviews pipeline exploration reports
- Spot-checks programs against official sources
- Marks programs as verified / needs fix / skip
- Provides corrections with source URLs
- Does NOT touch code

### TJ (Decision-maker)
- Reviews at /admin/benefits dashboard
- Approves state for launch
- Merges PRs
- Final quality gate

### Logan (Strategy)
- Prioritizes which states to expand next
- Reviews expansion roadmap
- Connects benefits to broader product strategy

---

## Expansion Roadmap

| Priority | State | Programs | Status | Why |
|----------|-------|----------|--------|-----|
| 1 | **Texas** | 15 | 12 verified | Highest traffic, Chantel audited |
| 2 | **Michigan** | 13 | Pipeline explored, 4 diffs found | GSC impressions, Chantel has data |
| 3 | **Florida** | ~12 | Not explored | Largest senior population |
| 4 | **California** | ~15 | Not explored | Largest state, complex programs |
| 5+ | 46 states | ~10 each | Not explored | Prioritize by GSC impressions |

**Pace: 1 state per week** once the workflow is proven on Michigan.

---

## What We Learned from Michigan (First Pipeline Run)

The pipeline found real problems:
- **PACE age requirement wrong**: We say 65+ → actually 55+
- **SNAP age requirement wrong**: We say 65+ → actually 60+
- **Ombudsman has fake savings**: We say "$10K–$30K/yr" → it's a free advocacy service
- **4 source URLs missing**: Pipeline found the official michigan.gov pages
- **5 data fields our model can't capture**: asset limits, regional variations, waitlist info, document checklists, household-size tables

These are exactly the kind of issues that would hurt us under Google's YMYL evaluation. The pipeline caught them in 4 minutes for $0.09.

---

## How This Connects to the Product

Benefits pages → organic traffic (already happening in Texas).
Verified data → user trust → longer sessions.
Longer sessions → provider connections (the conversion path from the Notion strategy doc).

The pipeline isn't just a data tool. It's the quality foundation that makes the benefits-to-provider conversion path trustworthy.

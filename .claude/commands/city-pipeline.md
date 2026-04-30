# Olera City Expansion Pipeline

You are helping TJ expand Olera's senior care provider directory to new cities. The pipeline discovers providers via Google Places API, cleans and enriches the data, imports to Supabase, and tracks progress in Notion.

This skill supports three modes:
- **Resume mode** (default): Query Notion for cities already in progress, pick up where they left off
- **New city mode**: Start a fresh expansion for a city TJ specifies
- **Batch mode**: Process multiple cities from a `.md` file exported by the expansion map tool

Always start with Step 0 to understand the current state before doing any work.

## Environment Setup

**API keys live in `~/Desktop/olera-web/.env.local`** (gitignored, pulled from Vercel). NEVER ask TJ for API keys. If the file doesn't exist, tell TJ to run:
```bash
cd ~/Desktop/olera-web && npx vercel env pull .env.local
```

For worktrees, symlink it:
```bash
ln -sf ~/Desktop/olera-web/.env.local <worktree>/.env.local
```

**Node scripts must run from `~/Desktop/olera-web`** (has node_modules). Worktrees don't have node_modules installed. Load env with:
```javascript
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

## Step 0: Read the Notion Board

Query the **Provider Listings Expansion Workflow** database to understand what's in flight.

- Database ID: `4cf471e5-0d7e-43a5-a793-a87410e2ae24`
- Data Source ID: `2fc0de38-fc21-4970-86ea-ca21c0cf565a`

The "City Status" property is a Notion **`status` type** (not `select`). The status values are pipeline stage names, not Kanban column labels. The Kanban groups them like this:

| Kanban Column | Status Values |
|---------------|---------------|
| **To-do** | Planning |
| **In progress** | Discovery, Merge, Verify if Senior Care Business, QC Category, Write Description, Fetch Images, Add Provider ID, Upload to Backend |
| **Complete** | Complete |

To find in-progress cities, use an `or` compound filter matching all in-progress statuses:

```json
{
  "or": [
    {"property": "City Status", "status": {"equals": "Discovery"}},
    {"property": "City Status", "status": {"equals": "Merge"}},
    {"property": "City Status", "status": {"equals": "Verify if Senior Care Business"}},
    {"property": "City Status", "status": {"equals": "QC Category"}},
    {"property": "City Status", "status": {"equals": "Write Description"}},
    {"property": "City Status", "status": {"equals": "Fetch Images"}},
    {"property": "City Status", "status": {"equals": "Add Provider ID"}},
    {"property": "City Status", "status": {"equals": "Upload to Backend"}}
  ]
}
```

For each in-progress city, read which checkboxes are checked and which are unchecked. The unchecked boxes are the remaining task list. Only work on unchecked steps. Never redo checked steps.

Present TJ with a summary: which cities are in progress, what status each is at, and what remains. Ask which city to work on (or if TJ already specified one, confirm it).

### Notion Checkbox Properties (Exact Names)

These are the pipeline checkboxes on each city page, in order:

1. "Done: Discovery"
2. "Done: Verify if Senior Care Business"
3. "Done: Check Business Status (Open/Closed)"
4. "Done: Verify Category"
5. "Done: Check Provider Category Spelling & Capitalization"
6. "Done: Name Check (Remove \"LLC\" or \"Inc\" from provider names)"
7. "Done: Add Provider ID"
8. "Done: Upload to Supabase"
9. "Done: Rich Description"
10. "Done: Hydrate Google Reviews Data"
11. "Done: Verify Trust Signals (Non-CMS)"
12. "Done: Ensure Review Snippets Are Active"
13. "Done: Fetch Unique Images"
14. "Done: Fetch Email & Contact Info"

**Legacy checkbox (ignore):** "Done: Add Score" — this was the old Olera Score system (Perplexity AI-derived ratings). It was killed in March 2026 (commit 302a4e5). The `olera_score`, `community_Score`, `value_score`, and `information_availability_score` columns are dead. Do NOT populate them. Check the box if unchecked and move on.

To check a box via the Notion MCP, set the property value to `"__YES__"`.

**Update Notion progressively** as you complete each step. Do not batch updates to the end.

## Actual Supabase Column Names

**IMPORTANT:** The column names in the database do NOT match what you'd guess. These are the real ones:

| What | Actual Column Name |
|------|-------------------|
| Provider name | `provider_name` (NOT `name`) |
| Category | `provider_category` (NOT `provider_type`) |
| Description | `provider_description` (NOT `description`) |
| ZIP code | `zipcode` (NOT `zip_code`) |
| Google reviews JSONB | `google_reviews_data` |
| CMS Medicare JSONB | `cms_data` |
| AI trust signals JSONB | `ai_trust_signals` |
| Images | `provider_images` |
| Logo | `provider_logo` |
| Score (DEAD) | `olera_score` — do NOT use |
| Slug | `slug` |
| Email | `email` |

Other columns: `provider_id`, `place_id`, `phone`, `google_rating`, `address`, `city`, `state`, `lat`, `lon`, `website`, `deleted`, `deleted_at`, `main_category`, `cleansed_at`, `google_reviews_data`, `last_viewed_at`, `cms_data`, `ai_trust_signals`

- Table: `olera-providers` (hyphen, not underscore)
- Provider ID pattern: `{city}-{state}-NNNN` (all lowercase, zero-padded to 4 digits), e.g., `bellevue-ne-0001`
- Query providers for a city: `provider_id LIKE '{city}-{state}-%'`

## File Organization

All working files go to:
```
~/Desktop/TJ-hq/Olera/Provider Database/Expansion/{City}-{State}/
```

Create this directory if it doesn't exist. The full provider DB export (for dedup) is at:
```
~/Desktop/TJ-hq/Olera/Provider Database/olera-providers_rows.csv
```

## Parallelization Strategy

**IMPORTANT:** Run independent steps in parallel using background tasks. This dramatically speeds up the pipeline. The post-upload enrichment steps are all independent and should run concurrently:

```
Sequential (must be in order):
  Discovery → Keyword Filter → Check Status → Verify Category → Name Check → Add Provider ID → Upload to Supabase

Parallel (run all at once after upload):
  ┌─ Rich Description
  ├─ Hydrate Google Reviews Data
  ├─ Verify Entity + Trust Signals (Non-CMS)  ← unified: classifies AND verifies in one call
  │    └─ soft-deletes false positives discovered by web search
  ├─ Ensure Review Snippets Are Active
  ├─ Fetch Unique Images
  └─ Fetch Email & Contact Info
```

**Note:** The unified entity+trust step replaces BOTH the old "AI classification" pass from the Verify step AND the old separate "Trust Signals" step. One Perplexity call per provider does both. False positives caught here get soft-deleted immediately — no wasted enrichment on fake providers.

Use `run_in_background: true` for long-running batches (trust signals, images) and work on other steps while they process. Check progress periodically via direct DB queries rather than watching output.

### Parallel subagent work during long phases

While the pipeline script is running in the background, Claude is idle on the critical path. Use that time productively by delegating independent work to subagents. These two are validated patterns:

**1. Notion page creation (run during clean phase).** `scripts/pipeline-batch.js` skips Notion pre-flight when `NOTION_TOKEN` is missing from `.env.local` (it usually is). Sizing guidance — choose inline vs subagent based on city count:

- **≤20 cities: inline.** Call `mcp__notion__API-post-page` / `mcp__notion__API-patch-page` directly from the main conversation. Batch 3-5 calls in parallel in a single message. At this size the per-page result objects are small enough that context isn't at risk, and spawning a subagent costs more than it saves. For the 2026-04-14 3-city run the inline path took ~5s; the subagent attempt failed on permissions and burned ~20s for nothing.
- **>20 cities: subagent.** The moment the pipeline prints `WARN: No NOTION_TOKEN — skipping Notion pre-flight`, spawn a general-purpose Agent to batch-create the Notion pages via `mcp__notion__API-post-page` in parallel to the running clean phase. Hand the agent the full city+state list. Tell it to batch 10-12 page creations per message in parallel, and to report ONE LINE only (`Created X/N, failed: <list>`). This prevents the subagent's per-page result objects (~3KB each) from ever entering the main context.
- **>100 cities: subagent is mandatory** — inline would either overflow context or thrash the Notion rate limiter.
- Initial status `Upload to Backend`, then flip to `Complete` at the end in a second pass (inline or subagent, same sizing rule) that also checks off the `Done: *` boxes.
- Validated on 184-city batch (2026-04-13, subagent) and 3-city batch (2026-04-14, inline).

**2. Data-quality spot-check (run during enrichment phase).** Enrichment's long pole is trust signals (~2h for a 184-city batch). While it runs, spawn a subagent to query Supabase for data-quality issues on cities already loaded. Common checks:
- Coordinates outside the city's state bounding box (geocoding failures that slipped past the load-phase validator)
- `place_id` null on providers that should have one
- `provider_category` not in the canonical title-case set
- Suspicious `provider_name` patterns (LLC/Inc suffixes that slipped through, all-caps names, placeholder text)
- Duplicate `slug` collisions within a single city
- `google_reviews_data` null when `google_rating` is populated (hydration miss)

Instruct the subagent to return a terse report: counts per issue + up to 10 sample provider IDs per category. Catches pipeline bugs ~30-60 min earlier than waiting for PIPELINE COMPLETE, which means you can kill and relaunch on the same session instead of debugging the next day.

## Batch Mode (Optimized)

When TJ provides a `.md` file (exported from the expansion map tool), use the **standalone batch scripts** for maximum speed. These scripts handle everything internally — no step-by-step tool calls needed.

### Overview

The batch pipeline runs in two stages via standalone scripts:

1. **Discovery** (`scripts/discovery-batch.py`) — Discovers providers for all cities via Google Places API
2. **Processing** (`scripts/pipeline-batch.js`) — Cleans, uploads, enriches, and finalizes all cities

Claude's role in batch mode:
- Parse the batch file and show cost/time estimates
- Create Notion pages for all cities (via the script's built-in pre-flight)
- Execute the two scripts and monitor output
- Report final results
- Handle any errors that need human judgment

### Pre-Flight + orientation gate

Every `/city-pipeline` run starts with an **orientation block** that summarizes what was found and asks TJ to confirm the run before any money is spent. Always orient — even single-city runs. Once TJ picks a numbered option, the rest runs fully autonomous through to the final report (no pauses between phases).

Steps:

1. **Parse input** — see "Input parsing + mode detection" below. Tolerate any format (raw text, file path, tabular dump). Extract `(city, state)` pairs.
2. **Query Supabase per city** — active count, deleted count. This determines mode.
3. **Query Notion per city** — does the page exist? what's its current status? Use this to plan reset-vs-create.
4. **Detect surprises** — flags anything that warrants attention:
   - Atlas label conflicts with DB-derived mode (e.g., Atlas says `thin` but DB says 0 active → really fresh; Atlas says `missing` but DB has active rows → really expand)
   - Mixed modes in one batch (some fresh, some expand)
   - Notion state doesn't match mode expectation (e.g., a "fresh" city already has a Complete page from a previous wiped run; an "expand" city has no page)
   - High soft-deleted count for a "fresh" city (sweep wiped a previous attempt — worth flagging)
5. **Show the orientation block** in one of two formats and wait for TJ's numbered choice.

#### Condensed format (when there are no surprises)

Use when ALL of these are true: same mode for every city, Atlas labels (if present) align with DB-derived mode, every fresh city has no Notion page, every expand city has an existing Complete page, no high soft-deleted volume.

```
PRE-FLIGHT: 3 fresh cities (all 0 active, no surprises)
  Hacienda Heights, CA · Calexico, CA · Brighton, NY
ESTIMATE: ~$12 · ~35–45 min

OPTIONS  1. Proceed  2. Drop  3. Override mode  4. Cancel
```

#### Full format (when any surprise is present)

```
PRE-FLIGHT — 3 cities
──────────────────────────────────────────────────────────────────────
City                    Atlas    DB Active  DB Deleted  Mode    Notion
──────────────────────────────────────────────────────────────────────
Hacienda Heights, CA    Thin     0          0           fresh   missing
Roy, UT                 Thin     0          1           fresh   exists
Calexico, CA            Thin     0          0           fresh   missing
──────────────────────────────────────────────────────────────────────

NOTES
- Atlas label "Thin" disagrees with DB (0 active) — running as fresh. Atlas snapshot probably stale.
- Roy: 1 prior sweep-deletion. Existing Notion page from previous run, will reset.
- Hacienda Heights + Calexico: net-new; will create Notion pages.

ESTIMATE: ~$12 · ~35–45 min

OPTIONS
1. Proceed (fresh mode, autonomous)
2. Drop one or more cities (reply with names)
3. Override mode (force expand)
4. Cancel
```

#### Routing on TJ's choice

| Choice | Action |
|---|---|
| `1` (or "proceed", "go", anything affirmative) | Begin autonomous run. Do not pause again until the final report. |
| `2` + city name(s) | Remove those cities from the list, re-run pre-flight on the remainder, present a fresh orientation block. |
| `3` | Switch the mode. If detected as fresh → run all as expand (with `--force --cities`). If detected as expand → run all as fresh. Re-present orientation block with the override applied. |
| `4` | Stop. No work done. |

Anything else (e.g., free-form question, ambiguous reply) → ask for one of 1/2/3/4 explicitly. Don't infer.

#### Cost/time estimates

Based on 88-city and 90-city batch actuals:
- Discovery: `cities × ~$1.20` (Google Places, quick mode), `cities × ~0.5min`
- Processing: `cities × ~$2.70` (geocoding + enrichment), `~35min enrichment overhead`
- Total: `~$4/city`

For >20 cities, also note the discovery time and suggest running discovery in background while TJ does other work.

### Input parsing + mode detection

TJ rarely hands over a path to an `.md` file. The slash command typically receives **pasted text** in one of several shapes — directly in the `/city-pipeline` invocation or in a follow-up message. The skill must extract `(city, state)` pairs from whatever it sees, then determine the run mode by querying Supabase for current active counts.

**Recognizable input shapes (any one of these — be tolerant):**

- **Raw `.md` file content** pasted from `map.olera.care` (Atlas) — has a `## Cities` markdown table and a `## Machine-Readable List` block with `City,ST` per line. Use the machine-readable section.
- **Tabular row dump** — tab- or whitespace-separated rows like `1    Massapequa    New York    NY    21,822    0    86.8    missing`. The 2-letter uppercase state code is the anchor; the column immediately to its left is the city. Skip the rank, population, etc.
- **Markdown table rows** — `| 1 | Massapequa | New York | NY | 21,822 | 0 | 86.8 | thin |`. Same anchor logic.
- **Plain CSV** — `City,ST` per line.
- **Atlas CSV export** — `city,state,state_id,population,...` with header row. Use `city` and `state_id`.
- **One city per line** in any prose form (e.g., `Massapequa, NY`) — the 2-letter state code anchor still works.
- **Path to a file** — `~/Desktop/.../batch.md`. Read the file and parse as one of the above.

The skill should produce a clean `[(city, state), ...]` list regardless of input shape. If parsing is ambiguous (e.g., "Springfield" with no state), surface the ambiguity to TJ rather than guess.

**Mode detection — query Supabase, don't trust the label.** Any gap-status label in the pasted text (`missing` / `thin` / `moderate` / `covered`) is informational only — show it in the pre-run summary so TJ can sanity-check what's about to happen, but DO NOT use it to choose flags. Atlas's gap status reflects whatever snapshot the app last loaded; the DB is the source of truth right now. For each city in the parsed list, query:

```javascript
const { count } = await supabase.from('olera-providers')
  .select('*', { count: 'exact', head: true })
  .like('provider_id', `${citySlug}-${stateSlug}-%`)
  .eq('deleted', false);
```

Then route by current active count:

| count | Mode for this city | Pipeline flags | Notion handling |
|---|---|---|---|
| `0` | **Fresh** | discovery: no `--force`. pipeline: no `--force`. | Search for existing Notion page first. If found (e.g., a previously-attempted run that got wiped by the sweep): reset status to `Upload to Backend` + uncheck `Done: *` boxes. If not found: create new page with status `Upload to Backend`. After run: flip to `Complete`, check off boxes. |
| `> 0` | **Expand** | discovery: `--force`. pipeline: `--force --cities "C1,ST;C2,ST"`. | Existing Notion page is expected. Reset status to `Upload to Backend` + uncheck `Done: *` boxes BEFORE the run. After run: flip back to `Complete`, re-check boxes. |

Per TJ's convention, batches are typically all-fresh or all-expand. If a single batch contains both, run them as separate phases (fresh cities first without `--force`, expand cities second with `--force --cities`) so the flags don't bleed across.

**Why expand mode needs `--force`.** Three idempotency guards in `pipeline-batch.js` (cached `providers_ready.json`, "already in DB" count, `--resume` Notion filter) silently skip cities that have any prior pipeline output. For cities with existing active providers, that's exactly wrong — you'd report "pipeline complete" with zero net work done.

**Why expand mode resets Notion before the run.** During an expansion the city's data is in flux. Leaving Notion as `Complete` while that's in progress makes the board lie about live state. Resetting to `Upload to Backend` and unchecking boxes uses the same fluid-state pattern as fresh ingestion; after the pipeline completes, status restores to `Complete` and boxes re-check.

**Pre-run baseline snapshot (expand mode only).** Save the active provider count per city before the run so the post-run report can show before→after deltas. Fresh cities have a baseline of 0 by definition.

### Stage 1: Discovery

Save the batch file's city list to a temporary CSV, then run:

```bash
# Fresh batch (all-missing cities)
python3 scripts/discovery-batch.py \
  --batch <cities.csv or batch.md> \
  --mode quick \
  --auto-confirm \
  --output-dir ~/Desktop/TJ-hq/Olera/Provider\ Database/Expansion

# Expand batch (thin/moderate/covered cities — add --force to overwrite stale CSVs)
python3 scripts/discovery-batch.py \
  --batch <batch.md> \
  --mode quick \
  --auto-confirm \
  --force \
  --output-dir ~/Desktop/TJ-hq/Olera/Provider\ Database/Expansion
```

This runs non-interactively, outputs one CSV per city, prints per-city progress. For large batches (>20 cities), run in background:

```bash
# Run in background for large batches
python3 scripts/discovery-batch.py --batch batch.md --mode quick --auto-confirm &
```

The script is **idempotent** — cities with existing discovery CSVs are skipped unless `--force` is used. Expand batches must always pass `--force` because thin cities by definition have stale CSVs from earlier (less comprehensive) discovery runs.

### Stage 2: Processing

After discovery completes, run the processing pipeline. **Always redirect raw stdout to a log file and arm a Monitor** — do NOT pipe through `tail -N`, which buffers everything until the process exits and leaves you blind for the whole phase.

```bash
# Fresh batch (all-missing) — resume-friendly
cd ~/Desktop/olera-web && node scripts/pipeline-batch.js \
  --batch ~/Desktop/TJ-hq/Olera/Provider\ Database/Expansion \
  --phase all \
  --resume \
  > /tmp/pipeline-all.log 2>&1

# Expand batch (thin/moderate/covered) — bypass idempotency guards, scope by --cities
cd ~/Desktop/olera-web && node scripts/pipeline-batch.js \
  --batch ~/Desktop/TJ-hq/Olera/Provider\ Database/Expansion \
  --cities "Hacienda Heights,CA;Roy,UT;Calexico,CA" \
  --force \
  --phase all \
  > /tmp/pipeline-expand.log 2>&1
```

Then arm a `Monitor` that tails the log with a grep covering progress + failure signatures:

```bash
tail -f /tmp/pipeline-all.log | grep -E --line-buffered "PHASE|\[[0-9]+/[0-9]+\]|providers|COMPLETE|Error|ERROR|FAIL|Traceback|429|529"
```

Size the Monitor timeout to the expected phase duration (clean ~5min, load ~4min/city, enrich ~35min+, finalize ~5min). For phase-all on a large batch, use `persistent: true` and stop manually.

**Never pipe the script's output through `tail -N` in the launch command** — it buffers, hiding the entire run. Tail the log file, not the live pipe.

This runs 4 internal phases:
- **Clean**: Keyword filter + AI classify + category map + name check + IDs + dedup (all cities at once, loads 61MB dedup CSV once)
- **Load**: Upload to Supabase + geocode + out-of-area cleanup (per city)
- **Enrich**: Descriptions + reviews + trust signals + images (all providers as one pool, parallel streams)
- **Finalize**: Notion updates (one call per city) + final report

**Clean-phase upgrades (2026-04-30, post-sweep #1):** beyond the keyword filter + AI classify, the clean phase now applies several deterministic layers ported from `docs/data-sweep-runbook.md`: Tier 1 deletion regex (pharmacy/DME chains, funeral, wedding, fitness, PACE, Spanish-language non-US patterns, test-data leakage), a Google Places `types` reject list with save-type override (movie_theater, casino, transit_station, etc., but never when `assisted_living_facility`/`nursing_home`/`health` is also present), `country != "US"` reject (discovery now captures country from Places `addressComponents`), Tier 1 slam-dunk reclassification (Visiting Angels/Home Instead/etc. → Home Care (Non-medical); Bayada/Amedisys/etc. → Home Health Care; explicit-name patterns for NH/MC/IL/AL when no competing category word in the name), and LLM `category` persistence — new providers get the LLM's category when it disagrees with discovery's search-term-origin guess. Dedup additionally pulls soft-deleted rows so the pipeline never re-adds a provider sweep #1 already removed; per-city log surfaces `prior-sweep:-N`, `t1-reclass:N`, and `llm-reclass:N` counters when these layers fire. None of this changes the CLI surface — the slash command and script invocations are unchanged.

Phases can be run individually: `--phase clean`, `--phase enrich`, etc.

The `--resume` flag skips cities already marked Complete in Notion, enabling multi-session batches.

### Reprocess Mode (CRITICAL — read before re-running an already-processed city)

The pipeline's idempotency guards (`providers_ready.json` cache, "already in DB" skip, `--resume` Notion filter) all assume **"rerun = resume where you left off."** They do NOT assume "rerun = the previous result was bad, throw it out and try again." When you need to reprocess a city that was already run — because the previous result was wrong, or because soft-deleted rows are blocking re-import — you MUST take explicit pre-flight steps or the script will silently SKIP and report success with stale data.

**When you need reprocess mode:**
- A city is marked Complete in Notion but has few/zero active providers in Supabase
- A previous run produced a cached `providers_ready.json` that you no longer trust
- You fixed a pipeline-script bug and want to re-run affected cities

**Reprocess command (one-liner, as of 2026-04-14):**

```bash
cd ~/Desktop/olera-web && node scripts/pipeline-batch.js \
  --batch ~/Desktop/TJ-hq/Olera/Provider\ Database/Expansion \
  --cities "Bourne,MA;Nanuet,NY;North Bellmore,NY" \
  --force \
  --phase all \
  > /tmp/pipeline-reprocess.log 2>&1
```

- `--cities` narrows the 1000+ cities in the Expansion dir down to the explicit allowlist. Format: semicolon-delimited `City,ST;City,ST` (case-insensitive, matches by the `parseBatchMd`/`readyCityList` keys). If any of the requested cities are missing from `--batch`, the script prints a WARN but proceeds with the found ones. Mandatory pairing with `--force` — the script will warn (not fail) if you pass `--force` without `--cities`.
- `--force` bypasses BOTH cache layers: the `providers_ready.json` skip guard in `phaseClean` AND the "already in DB" count skip guard in `phaseLoad`. Without it, the script will silently report success with stale data.

**Before running reprocess, still do these manual steps:**

1. **Audit soft-deleted row counts** for each target city — this is how you verify the rerun actually did something:
   ```javascript
   const { count } = await supabase.from('olera-providers')
     .select('*', { count: 'exact', head: true })
     .like('provider_id', `${citySlug}-${stateSlug}-%`);
   ```
   Compare before/after.

2. **Reset Notion status** back to `Upload to Backend` for the target cities and uncheck all `Done: *` boxes. The pipeline script does NOT touch Notion — you (or a subagent, per sizing rules above) handle Notion writes. Without this step, the pages stay green in the Notion board while the data was replaced underneath, which creates confusion later.

**Gotcha — re-running clean against an already-loaded city produces zero providers.** Because the dedup set is loaded live from Supabase (filtered to `deleted=false`), the city's own active providers are in the dedup set and will dedup the incoming fresh discovery to ~zero. This is the idempotency guard working as intended, but it means reprocess for a *fully loaded and enriched* city requires also soft-deleting the existing rows first, or the clean phase will produce a nearly empty `providers_ready.json`. Practical rule: reprocess is for cities whose previous run was bad (most providers soft-deleted, few active). If a city is fully loaded and you want to refresh it, that's a different workflow — plan for it separately.

**Pipeline-script behavior notes for reprocess:**
- `phaseClean` dedup query filters out soft-deleted rows (fixed 2026-04-14) — a previously-soft-deleted provider will NOT block its own re-import.
- `phaseLoad` "already in DB" count filters out soft-deleted rows (fixed 2026-04-14) — a city with only soft-deleted rows will correctly proceed to re-upload instead of SKIP'ing.
- `perplexityChat` retries on 429/529 with exponential backoff (fixed 2026-04-14) — transient Perplexity overload no longer nukes whole batches.
- If you are running a pipeline-batch.js version older than 2026-04-14, upgrade first.

### Fix the pattern, not the line

When you find a bug in `scripts/pipeline-batch.js`, GREP THE WHOLE FILE for the same pattern before relaunching. The two soft-delete filter bugs found on 2026-04-14 were both the same class (`.from('olera-providers')` read missing `.eq('deleted', false)`), and fixing only the first one cost a full relaunch cycle to discover the second bite from the second one. Standard audit command:

```
grep -n ".from('olera-providers')" scripts/pipeline-batch.js
```

and review every read site. Writes (upsert/update/delete) don't need the filter, but reads that feed dedup, count, or collision-detection logic almost always do.

### Script features (all active by default)

`scripts/pipeline-batch.js` is the single processing script — no v1/v2 fork. Three features beyond the original sequential per-city flow:

1. **Streaming discovery→clean overlap** via `--watch` flag — clean phase begins consuming city 1's discovery CSV the moment it appears, while discovery is still crawling later cities. Saves 20-30 min on the critical path for large batches. Watch mode polls each city's expansion dir for up to 90 min waiting for a CSV.
2. **Global AI classify pooling** — in non-watch mode, collects the full post-keyword-filter pool across all cities and runs Perplexity in batches of 80. Fewer round-trips, cheaper per provider. Watch mode keeps per-city batches since cities arrive one at a time.
3. **Live site verification hook** — after load phase, fires off a background check that fetches 5 random `olera.com/assisted-living/{state}/{city}` pages and greps for `provider-card`. Reports pass/fail in the final summary. Non-blocking, non-fatal. Skipped when `--dry-run`.

### Canonical workflows

**Notion page creation + status updates → via Claude (inline or subagent, sized by city count).** The script does NOT write to Notion. Never try to set `NOTION_TOKEN` in `.env.local` to "fix" this — that path has a history of silent failures in this repo and has wasted debugging time repeatedly. Claude handles all Notion writes. Sizing rule:

- **≤20 cities: inline** via `mcp__notion__API-post-page` / `mcp__notion__API-patch-page` (batch 3-5 in parallel in one message). Faster than a subagent at small scale, and avoids subagent permission-failure mode.
- **>20 cities: subagent** — spawn a general-purpose Agent in parallel to the clean phase, tell it to batch 10-12 page operations per message in parallel, and report ONE LINE only (`Created X/N, failed: <list>`). This keeps per-page result objects (~3KB each) out of the main context. See "Notion updates: inline vs subagent sizing" section above for the full rationale.

Database ID: `4cf471e5-0d7e-43a5-a793-a87410e2ae24`. Initial City Status: `Upload to Backend`. After the pipeline finishes, flip to `Complete` and check off all `Done: *` checkboxes except `Done: Fetch Email & Contact Info`.

Validated on the 184-city batch (2026-04-13, subagent) and the 3-city batch (2026-04-14, inline). Do not regress to in-script Notion writes.

**Always start shakedown batches small.** When the script has changed (new feature, refactor, dependency bump), run a 5-10 city batch first to confirm the three active features behave — not a full 150+ city production batch. A small batch surfaces issues in 15-30 minutes instead of 6+ hours.

**Data-quality spot-check during enrichment.** Enrichment's long pole is trust signals (~2h for a 184-city batch). While it runs, consider spawning a subagent to query Supabase for data-quality issues on cities already loaded (out-of-state coordinates, null `place_id`, suspicious provider names, slug collisions, `google_reviews_data` null when `google_rating` populated). Catches pipeline bugs 30-60 min earlier than waiting for completion.

### Known gotchas

- **`NOTION_TOKEN` env var is dead** — don't chase it. See Canonical workflows above.
- **Watch mode can hang on silent discovery crashes.** Watch mode polls each city's expansion dir for up to 90 min waiting for a CSV. If discovery crashes silently mid-batch, the current city slot blocks for the full 90 min before timing out. **Monitor the discovery background task** and kill watch mode early if discovery dies.
- **Live site check logs noise on fresh cities.** Immediately after loading a new city, Vercel's ISR cache hasn't warmed, so the live site check will report failures for pages that actually render correctly minutes later. Cosmetic, non-fatal.
- **Pooled AI batches of 80 are tuned for current Perplexity Sonar quality.** If batches start returning truncated/malformed JSON, too many providers fall into the "keep to be safe" fallback and filter quality degrades. If you notice significantly more providers surviving classify than usual, drop the batch size to 60 in the script's `phaseClean` pooled path.
- **SCRATCHPAD.md is per-branch, per-session.** Do not queue cross-session instructions there — the next session won't see them unless it happens to use the same branch. Put durable cross-session warnings and patterns in THIS file.

### Error Handling

Both scripts handle errors per-city:
- Log the error
- Skip the failed city
- Continue to next city
- Report all failures at the end

### Multi-Session Strategy

For very large batches (80+ cities):
- Session 1: Run discovery for all cities (can run in background, ~3.3 hours for 80)
- Session 2: Run `--phase clean` (fast, ~5 min for all cities)
- Session 3: Run `--phase load` (~4 hours for 80 cities)
- Session 4: Run `--phase enrich` (~35 min for all providers)
- Session 5: Run `--phase finalize` (~5 min)

Or run `--phase all` in one session if time permits.

## Batch Mode (Legacy — Single-City Fallback)

For processing a **single city** or when the batch scripts aren't available, use the legacy step-by-step approach below. This is also the default for resume mode and new-city mode.

## Pipeline Steps

Run only the unchecked steps for the target city. **Run autonomously end-to-end** — do not pause for approval between steps. Run enrichment steps in parallel. Only stop and ask TJ if:
- Something fails unexpectedly (API errors, rate limits that don't resolve)
- An unmapped category appears that needs a decision
- Cost would exceed $8 for a single city (unusual — flag it)

Report results at the end with a summary table, not step-by-step.

### Discovery

For **single city** mode, run the discovery script interactively:
```bash
cd ~/Desktop/TJ-hq/Olera/Olera\ Data\ Analysis\ Scripts/senior-care-discovery/
python discovery.py
```

Select option 1 (manual city entry), enter city/state, confirm cost (~$1-2 per city in quick search mode). Copy the output CSV (`providers_discovered_*.csv`) to the city's expansion directory.

For **batch mode**, use the batch discovery script instead (see Batch Mode section above).

Report: Number of providers discovered.

### Verify if Senior Care Business

**Two-pass verification — both are required:**

**Pass 1: Keyword filter (fast, free).** Remove rows where name or category contains any of these (case-insensitive): pharmacy, hospital, pediatric, veterinary, dental, optometrist, chiropractor, urgent care, physical therapy, dialysis, medical supply, staffing agency, storage, plumbing, construction, insurance, real estate, auto, restaurant, grocery, hardware.

**Pass 2: AI entity classification (required — catches 32% of false positives that keywords miss).** Send providers in batches of 25 to Perplexity Sonar with this prompt:

```
For each business below, determine if its PRIMARY BUSINESS is providing senior care.

Answer YES only if the entity is one of these:
- Residential senior living facility (assisted living, memory care, nursing home, independent living)
- In-home care agency (home health, non-medical home care, hospice)
- Dedicated senior care program (adult day care, geriatric care management)

Answer NO if the entity is:
- A place seniors might USE but that is not a care provider (community centers, recreation facilities, YMCAs, activity centers)
- General medical (family medicine, urgent care, VA clinics, hospitals, rehab clinics)
- Mental health / therapy only (counselors, psychologists, behavioral health)
- Retail, food service, construction, IT, storage, or any non-care business
- Nonprofit / community service that serves the general public (food pantries, housing authorities, United Way)
- Funeral homes, universities, churches, government agencies

The key question is: "Does this entity provide residential senior living, in-home care services, or dedicated senior care programs as its primary business?"

Return JSON: {"results": [{"num": 1, "is_senior_care": true/false, "reason": "brief reason"}]}
```

Soft-delete false positives (`deleted = true, deleted_at = now()`). Do NOT hard-delete — soft delete preserves the data in case of mistakes.

**Cost:** ~$0.40 per city (375 providers). This is non-negotiable — without it, 32% of the database is garbage (Walmart, GameStop, Roto-Rooter, community rec centers).

**Known failure modes from Bellevue (March 2026):**
- "Memory Care" discovery category pulls in storage facilities, computer repair, cognitive therapy clinics (anything with memory/cognitive keywords)
- Community activity centers (e.g., Lied Activity Center — a school district rec center with basketball courts) look like senior living because seniors use them
- General nonprofits (food pantries, housing authorities) get categorized as "Home Health Care"
- Behavioral health and counseling practices get categorized as "Memory Care"
- **Wedding venues / event spaces** with names that sound like senior communities (e.g., "A View In Fontenelle Hills" — a wedding venue on WeddingWire/The Knot that passed name-only classification). This is why entity verification MUST use web search evidence, not just the name.
- **Durable medical equipment (DME) suppliers** categorized as "Home Care" (e.g., "Bellevue Healthcare" — sells wheelchairs and oxygen tanks, not a care provider). Reviews mention equipment, not care services.
- **Cross-state contamination** — discovery pulls businesses from other states when the city name matches (e.g., "Bellevue Healthcare" is in Bellevue, WA but appeared in Bellevue, NE results). The unified prompt must verify location, not just entity type.
- **General apartment complexes** categorized as "Independent Living" — discovery doesn't distinguish senior-specific communities from regular apartments (e.g., Redwood, Brent Village, Fontainebleau). Reviews mentioning children/families are a giveaway.

Report: How many removed by keywords, how many by AI, how many remain. List the AI-flagged removals with reasons.

### Check Business Status (Open/Closed)

Use Google Places API to verify each provider is currently operating. Remove permanently closed businesses.

Report: How many closed businesses found and removed.

### Verify Category

Map discovery categories (snake_case) to Supabase categories (title case):

```python
CATEGORY_MAP = {
    "assisted_living": "Assisted Living",
    "memory_care": "Memory Care",
    "nursing_home": "Nursing Home",
    "home_health_care": "Home Health Care",
    "home_care_non_medical": "Home Care (Non-medical)",
    "independent_living": "Independent Living",
    "home_care": "Home Health Care",
}
```

If a category from discovery is not in this map, **flag it for TJ** rather than dropping it silently. This mapping is critical because the frontend filters on exact title-case strings. If categories stay in snake_case, providers will import fine but be invisible on the site.

Report: Category breakdown and any unmapped categories.

### Check Provider Category Spelling & Capitalization

Verify every `provider_category` value exactly matches one of the title-case categories from the CATEGORY_MAP. Fix any mismatches. This is a safety net for the Verify Category step.

### Name Check (Remove "LLC" or "Inc")

Strip business suffixes (LLC, Inc, Corp, Ltd, etc.) from all provider names. Update in Supabase.

### Add Provider ID

Generate IDs in format `{city}-{state}-NNNN` (all lowercase, zero-padded to 4 digits). Also generate slugs in format `{name}-{state}` (lowercase, spaces to hyphens, special characters stripped).

### Upload to Supabase

This step includes both the import and re-geocoding.

**Import:** Write or adapt a Node.js import script. Column mapping from discovery CSV to Supabase:

| CSV Column | Supabase Column |
|-----------|----------------|
| provider_name | provider_name |
| address | address |
| city | city |
| state | state |
| zipcode | zipcode |
| phone | phone |
| website | website |
| provider_category (mapped) | provider_category |
| lat | lat |
| lon | lon |
| provider_id | provider_id |
| slug | slug |
| google_rating | google_rating |
| place_id | place_id |

**Dedup first:** Before importing, deduplicate against the existing database. The full export at `~/Desktop/TJ-hq/Olera/Provider Database/olera-providers_rows.csv` is 61MB. **Do NOT use pandas.** Stream with Python's `csv` module:

```python
import csv
existing = set()
with open('olera-providers_rows.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['provider_name'].strip().lower(), row['state'].strip().upper())
        existing.add(key)
```

Match on provider name (case-insensitive) + state.

**Re-geocode (required):** After upload, re-geocode every provider. Discovery lat/lng values are frequently wrong, especially for home care services. Call Google Geocoding API with `{address}, {city}, {state full name}` (use full state name like "Nebraska", not "NE", to prevent cross-state matches). Validate all coordinates fall within the target state's bounding box. Update lat/lon in Supabase. Cost: ~$2 per 375 providers.

Report: Rows imported, duplicates skipped, geocoding corrections made, any out-of-bounds coordinates.

### Rich Description

Write a factual 1-2 sentence description for each provider. Template:

```
{Name} is an {category description} located in {City}, {State}. {Optional: rating sentence if google_rating >= 3.0}
```

Category descriptions:
- Assisted Living → "assisted living community offering personal care support and daily living assistance"
- Memory Care → "memory care community providing specialized support for individuals with Alzheimer's and dementia"
- Nursing Home → "skilled nursing facility providing 24-hour medical care and rehabilitation services"
- Home Health Care → "home health care agency delivering skilled nursing and therapeutic services in the comfort of home"
- Home Care (Non-medical) → "non-medical home care provider offering companionship, personal care, and daily living support"
- Independent Living → "independent living community designed for active seniors seeking a maintenance-free lifestyle"

**Grammar check:** Use "an" before "assisted", "independent". Use "a" before all others.

Store in `provider_description` column.

Report: How many descriptions written.

### Hydrate Google Reviews Data

The site's recommendation engine sorts by **evidence density**: `rating × log(reviewCount + 1)`. This reads from the `google_reviews_data` JSONB column, NOT the flat `google_rating` column. Without this JSONB, providers won't sort correctly on the homepage, browse pages, or similar providers sections.

Populate `google_reviews_data` from discovery CSV data:

```javascript
{
  rating: parseFloat(csvRow.google_rating),    // from discovery
  review_count: parseInt(csvRow.review_count),  // from discovery
  reviews: [],                                  // populated later in Review Snippets step
  last_synced: new Date().toISOString()
}
```

Skip providers with no google_rating in the CSV (they'll have null google_reviews_data — this is fine).

Report: How many hydrated, how many skipped (no rating).

### Verify Entity + Trust Signals (Non-CMS) — UNIFIED STEP

This is a **single Perplexity call per provider** that does entity verification AND trust signal collection together. This is critical because classification needs web-search evidence, not just the provider name.

**Why unified:** In Bellevue (March 2026), name-only AI classification missed "A View In Fontenelle Hills" (a wedding venue that sounds like a senior community) and "Lied Activity Center" (a school district rec center). But when Perplexity searched the web for trust signals, it found WeddingWire listings and school district affiliations — evidence that would have immediately disqualified them. The classification and evidence gathering were disconnected steps, so the evidence never informed the classification.

**Non-CMS categories:** Assisted Living, Memory Care, Home Care (Non-medical), Independent Living

**CMS categories skip this step:** Nursing Home and Home Health Care get federal quality data via the quarterly CMS import.

**The unified prompt (one call per provider):**

```
Search the web for this business and answer two questions.

Provider: {provider_name}
Location: {address}, {city}, {state}
Listed Category: {provider_category}
Website: {website or "unknown"}

QUESTION 1 — ENTITY VERIFICATION
Based on what you find on the web (their website, reviews, directory listings, business registrations), what does this business ACTUALLY do?

Is its PRIMARY BUSINESS one of these senior care types?
- Residential senior living (assisted living, memory care, independent living for seniors)
- In-home senior care (home health, non-medical home care, hospice)
- Dedicated senior program (adult day care, geriatric care management)

Mark is_senior_care = FALSE if it is:
- A wedding venue, event space, or banquet hall (even if the name sounds like a community)
- A community recreation center, YMCA, or activity center (even if seniors attend)
- A general medical clinic, therapy practice, or mental health provider
- A durable medical equipment (DME) supplier, medical supply store, or equipment rental company (sells TO seniors but doesn't provide care)
- Retail, construction, IT, food service, or any non-care business
- A nonprofit or government service not specific to senior care
- A general apartment complex (not senior-specific independent living)

Also verify LOCATION: Is this business actually in {city}, {state}? If the business is in a different state (e.g., a company named "Bellevue Healthcare" that's actually in Bellevue, WA showing up in Bellevue, NE results), mark is_senior_care = FALSE with reason "wrong location."

IMPORTANT: Do not trust the listed category OR the listed location. Verify both against actual web evidence.

QUESTION 2 — TRUST SIGNALS (only if is_senior_care = true)
If this IS a senior care provider, verify these 8 signals:
1. state_licensed — Licensed by state?
2. accredited — Joint Commission, CHAP, CARF, or ACHC?
3. bbb_rated — BBB profile/rating?
4. years_in_operation — When founded?
5. regulatory_actions — Any violations? (If none found, mark confirmed)
6. active_website — Active website with real content?
7. google_business — Google Business Profile?
8. community_presence — Social media, directories?

Return ONLY this JSON:
{
  "is_senior_care": true/false,
  "entity_reason": "What this business actually is based on web evidence",
  "signals": [only if is_senior_care=true, otherwise omit],
  "confidence": "high/medium/low"
}
```

**Processing logic:**
1. If `is_senior_care = false` → soft-delete provider, skip further enrichment, log the reason
2. If `is_senior_care = true` → save trust signals to `ai_trust_signals` JSONB as normal

**Cost:** Same as before (~$1 per 1,000 providers). We're not adding a call — we're combining two into one.

**How to run:** Call Perplexity Sonar directly from a Node script. Process in batches of 30, 300ms delay between calls. Run as background task.

Report: How many confirmed senior care, how many reclassified and deleted (with reasons), average trust score for confirmed providers.

### Ensure Review Snippets Are Active

Query all providers for this city. The `google_reviews_data.reviews` array should contain actual review snippets (not empty). For providers that have a `place_id`, use Google Places API (New) to fetch up to 5 review snippets:

```
GET https://places.googleapis.com/v1/places/{place_id}?fields=reviews&key={GOOGLE_PLACES_API_KEY}
```

Update the `reviews` array inside `google_reviews_data` JSONB. Each review should have: `text`, `rating`, `author_name`, `time`, `relative_time`.

Cost: ~$5 per 1,000 requests.

Report: How many had snippets, how many fetched, how many remain empty.

### Fetch Unique Images

For each provider missing an image (`provider_images` is null or empty):

1. Fetch the `photos` field from Google Places API using the provider's `place_id`:
   ```
   GET https://places.googleapis.com/v1/places/{placeId}?fields=photos&key={API_KEY}
   ```
2. Take the first photo's `name` field (e.g., `places/{placeId}/photos/{photoRef}`)
3. **Resolve to a permanent URL** using `skipHttpRedirect=true`:
   ```
   GET https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=800&key={API_KEY}&skipHttpRedirect=true
   ```
   This returns JSON with a `photoUri` field — a permanent `lh3.googleusercontent.com` URL.
4. Store the `photoUri` value in `provider_images`
5. If no photos available, leave `provider_images` as null (the frontend shows a gradient placeholder)

**CRITICAL:** Never store raw `places.googleapis.com` API reference URLs. These are ephemeral and require an API key to access. The frontend needs permanent public URLs (`lh3.googleusercontent.com/places/...`). The `skipHttpRedirect=true` parameter is what gives you the permanent URL instead of a binary image response.

Rate limit: 200ms between requests. Cost: ~$5 per 1,000 photos.

Report: How many had images, how many fetched, how many had no photos available.

### Fetch Email & Contact Info

For each provider missing an email:
1. Check Google Places API details endpoint
2. If the provider has a website, check the contact page for an email
3. Update the `email` field in Supabase

Report: How many emails found vs. how many remain without.

## After All Steps Complete

1. **Update Notion:** Check off all completed boxes. Set "City Status" to **"Complete"**. For expand batches, this restores the pre-run Complete state with the boxes re-checked.

2. **Verify on live site:** Check power pages at `https://olera.com/{category}/{state-slug}/{city-slug}` (e.g., `/assisted-living/nebraska/bellevue`). Confirm:
   - Provider cards render with ratings and review counts
   - Trust signal badges show on non-CMS provider cards
   - Map pins are in the correct location (geocoding worked)
   - ISR cache is 1 hour — pages may not update immediately

3. **Verify trust signals on a provider detail page:** Pick a non-CMS provider, visit its page, and confirm the "Verified Credentials" section renders with green checkmarks.

4. **Post-run report — split by mode.** When the batch is from Atlas, the report should distinguish what happened to each city. For a fresh batch, every row is a "new" city. For an expand batch, every row is an "expanded" city with a before/after delta.

   ```
   FRESH BATCH (3 cities, all `missing`)
   ─────────────────────────────────────────────────────────────
   City                        Providers   Cost
   Bellevue, NE                 27          $3.84
   Lincoln, NE                  41          $5.12
   Omaha, NE                    62          $7.05
   ─────────────────────────────────────────────────────────────
   Total: 130 providers added across 3 new cities — $16.01

   EXPAND BATCH (3 cities, all `thin`)
   ─────────────────────────────────────────────────────────────
   City                        Before  After  +Delta  Cost
   Hacienda Heights, CA         8       18     +10    $4.20
   Roy, UT                      5       12     +7     $3.95
   Calexico, CA                 6       14     +8     $4.10
   ─────────────────────────────────────────────────────────────
   Total: +25 providers (was 19, now 44) across 3 expanded cities — $12.25
   ```

   Pull the "before" counts from the pre-run baseline snapshot taken in pre-flight (Atlas batch detection step). Pull the "after" counts via Supabase queries on `provider_id LIKE '<slug>-<state>-%' AND deleted=false`. If a city's `+delta` is 0, flag it — that means the active dedup blocked everything (city is genuinely covered, not actually thin per current discovery).

5. **Ask TJ** if there's another in-progress city to work on.

## Scoring System (IMPORTANT — Read This)

The old Olera Score system was **killed in March 2026**. Do NOT populate:
- `olera_score`
- `community_Score`
- `value_score`
- `information_availability_score`

These columns exist in the DB but are dead — never read or displayed.

**The current quality signal system has 3 tiers:**

| Tier | Data Source | Column | Coverage | Used in Ranking? |
|------|-----------|--------|----------|-----------------|
| 1. Google Reviews | Google Places API | `google_reviews_data` (JSONB) | All providers | YES — evidence density sorting |
| 2. CMS Medicare Data | Federal quarterly import | `cms_data` (JSONB) | Nursing Homes, Home Health (~30%) | No — display badge only |
| 3. AI Trust Signals | Perplexity Sonar API | `ai_trust_signals` (JSONB) | Non-CMS categories | No — display badge only |

**Evidence density formula:** `rating × log(reviewCount + 1)` — used on homepage, browse pages, similar providers sections. A 4.7★ with 1,000 reviews ranks above 5.0★ with 4 reviews.

CMS and trust signals are display-only badges today. A Notion task exists for incorporating them into ranking: "Incorporate Trust Signals + CMS Data into Recommendation Ranking".

## Known Pitfalls

These are real issues from past expansions. Each one has wasted real debugging time, so take them seriously.

- **Category mismatch = invisible providers.** If `provider_category` stays in snake_case, providers import but never appear on the frontend. The site filters on exact title-case strings.
- **Discovery coordinates are unreliable.** Google Places regularly returns lat/lng for a different business in a different state. Always re-geocode. Always validate against the state bounding box.
- **Table name has a hyphen.** It's `olera-providers`, not `olera_providers`. This breaks naive SQL and some ORM patterns.
- **Columns are `lat`/`lon`.** Not latitude/longitude, not lng.
- **Column names are different than you'd expect.** `provider_name` not `name`, `provider_category` not `provider_type`, `provider_description` not `description`, `zipcode` not `zip_code`. See the column reference table above.
- **61MB CSV will crash pandas.** The full provider export must be streamed with the `csv` module. Do not use `pd.read_csv()`.
- **ISR cache = 1 hour.** New providers won't show on the site immediately. Don't re-import or debug if pages look empty right after upload.
- **Notion statuses are pipeline stage names, not Kanban labels.** "City Status" values are Discovery, Merge, QC Category, Fetch Images, etc. The Kanban groups these into To-do/In progress/Complete columns, but the actual property values are the stage names. Filter accordingly.
- **Vercel requires `NODE_VERSION=22`.** If deploying olera-web changes, this env var must be set.
- **Node scripts must run from main repo, not worktrees.** Worktrees don't have node_modules. Always `cd ~/Desktop/olera-web` before running Node scripts.
- **Never ask TJ for API keys.** They live in `~/Desktop/olera-web/.env.local`. If the file doesn't exist, tell TJ to run `npx vercel env pull .env.local`.
- **Grammar: "an assisted" not "a assisted".** Use "an" before vowel sounds in generated descriptions.
- **google_reviews_data JSONB is what the site reads, not google_rating.** The flat `google_rating` column exists but the evidence density sorting reads from the JSONB. Both should be populated.
- **"Add Score" is dead.** The old Olera Score pipeline step is a remnant. Check the box and skip it. See Scoring System section.

## Cost Per City

| Item | Cost |
|------|------|
| Discovery (quick search) | ~$1.20 |
| Geocoding (~375 providers) | ~$0.50 |
| Trust Signals (~250 non-CMS) | ~$0.25 |
| Review Snippets (~375 providers) | ~$1.00 |
| Processing + enrichment overhead | ~$1.00 |
| **Total** | **~$4/city** |

> Based on actuals: 88-city batch = $270 (~$3.07/city), 90-city batch = $425 (~$4.72/city)

## Reference

Full playbook with additional detail: `~/Desktop/TJ-hq/Olera/city-expansion-playbook.md`

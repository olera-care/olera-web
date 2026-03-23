# Plan: Batch Pipeline Optimization

Created: 2026-03-23
Status: Not Started

## Goal

Make the city expansion pipeline 3-4x faster for 80+ city batches by creating standalone scripts that eliminate tool-approval overhead, process cities in phases (not one-at-a-time), and reduce API costs ~15%.

## Success Criteria

- [ ] `scripts/discovery-batch.py` runs non-interactively with `--batch cities.csv --mode quick`
- [ ] `scripts/pipeline-batch.js` processes all post-discovery steps for N cities with one `node` command
- [ ] 80-city batch completes in ~8-10 hours (down from ~33 hours)
- [ ] Zero human interaction needed during execution (except monitoring)
- [ ] Cost per city drops from ~$8-9 to ~$6-7
- [ ] Pipeline slash command updated to use new scripts for batch mode
- [ ] Notion updated once per city (at completion), not 14 times per city
- [ ] Reviews JSONB race condition eliminated (hydration runs after snippets, not parallel)

## Architecture

### Two-Script, Five-Phase Design

```
┌─────────────────────────────────────────────────────┐
│  TJ provides: batch.md (from map.olera.care)        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Phase 1: discovery-batch.py                         │
│  Sequential per city (Google API rate limit)          │
│  Output: one CSV per city in expansion dir            │
│  ~2.5 min/city = ~3.3 hours for 80                   │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Phase 2: pipeline-batch.js --phase clean             │
│  ALL cities at once, ZERO API calls                   │
│  Keyword filter + AI classify + category map          │
│  + name check + IDs + dedup (61MB loaded ONCE)        │
│  ~5 min for all 80 cities                             │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Phase 3: pipeline-batch.js --phase load              │
│  Upload + geocode + out-of-area cleanup               │
│  Sequential per city (Google Geocoding API)            │
│  ~3 min/city = ~4 hours for 80                        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Phase 4: pipeline-batch.js --phase enrich            │
│  ALL providers across ALL cities as one pool           │
│  Parallel streams by API:                             │
│    Stream A: Trust signals (Perplexity) ~35 min       │
│    Stream B: Review snippets (Google) ~27 min         │
│    Stream C: Images (Google) ~27 min                  │
│    Stream D: Descriptions + hydration (no API) instant│
│  THEN: re-hydrate reviews (merge snippets into JSONB) │
│  ~35 min for all 80 cities                            │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Phase 5: pipeline-batch.js --phase finalize          │
│  Notion updates (one call per city)                   │
│  Final report + verification                          │
│  ~5 min for all 80 cities                             │
└─────────────────────────────────────────────────────┘
```

**Default mode**: `pipeline-batch.js --phase all` runs phases 2-5 sequentially.

### Cost Optimizations Baked In

| Optimization | How | Savings/80 cities |
|-------------|-----|-------------------|
| AI classification batch size 25→50 | Fewer Perplexity calls, same accuracy | ~$16 |
| Trust signals: 3 providers/call | Unified prompt with 3 providers instead of 1 | ~$40 |
| Skip snippets for zero-rating providers | No reviews to fetch if no rating | ~$12 |
| Filter closed businesses during keyword pass | discovery.py already returns `business_status` | Eliminates separate step |
| Dedup CSV loaded once | 61MB × 1 instead of 61MB × 80 | I/O only |
| **Total** | | **~$68 saved (~$480 vs $560)** |

---

## Tasks

### Phase 1: Discovery Batch Script

- [ ] **1. Fork discovery.py to scripts/discovery-batch.py**
      - Files: `scripts/discovery-batch.py` (new)
      - Source: `~/Desktop/TJ-hq/Olera/Olera Data Analysis Scripts/senior-care-discovery/discovery.py`
      - Changes:
        - Add `argparse` CLI: `--batch <csv>`, `--mode quick|standard|comprehensive`, `--auto-confirm`, `--output-dir <path>`, `--care-types all|assisted_living,...`
        - Keep existing interactive mode as default (no `--batch` flag)
        - In batch mode: read CSV (City,StateID format), skip prompts, auto-confirm cost
        - Output one CSV per city: `{output-dir}/{city}-{state}/providers_discovered_{timestamp}.csv`
        - Create expansion directories automatically
        - Print per-city progress: `[3/80] Greece, NY — 358 providers ($4.10, 2.3 min)`
        - Print running totals after each city
        - On error: log, skip city, continue to next
        - At start: print time estimate (`80 cities × ~2.5 min = ~3.3 hours`) and total cost estimate
      - Dependencies: Python 3.13, aiohttp, pandas, dotenv, tqdm (already installed)
      - Verify: `python3 scripts/discovery-batch.py --batch test-2cities.csv --mode quick --auto-confirm --output-dir /tmp/test-discovery`

- [ ] **2. Add requirements.txt for discovery script**
      - Files: `scripts/requirements.txt` (new)
      - Pin: aiohttp, pandas, python-dotenv, tqdm, certifi
      - Verify: `pip install -r scripts/requirements.txt`

### Phase 2: Pipeline Batch Script — Core Framework

- [ ] **3. Create pipeline-batch.js skeleton with CLI parsing and config**
      - Files: `scripts/pipeline-batch.js` (new)
      - CLI args (via yargs or manual):
        - `--batch <path>` — the .md file OR a directory of discovery CSVs
        - `--phase clean|load|enrich|finalize|all` — which phase to run (default: all)
        - `--expansion-dir <path>` — base expansion directory (default: `~/Desktop/TJ-hq/Olera/Provider Database/Expansion/`)
        - `--dry-run` — print what would happen without executing
        - `--resume` — skip cities whose Notion status is already Complete
        - `--concurrency <n>` — max parallel API calls per service (default: 5)
      - Config loading: read `.env.local` for all API keys
      - Supabase client initialization
      - Notion client helper (raw API via fetch, not MCP)
      - Rate limiter utility: per-service (google, perplexity, supabase, notion)
      - Progress reporter: batch table printed to stdout after each city
      - Error handler: log + skip + continue pattern
      - Verify: `node scripts/pipeline-batch.js --help` prints usage

- [ ] **4. Implement Phase 2 (Clean & Prepare) in pipeline-batch.js**
      - The `--phase clean` handler
      - For ALL cities in one pass:
        1. Load dedup CSV ONCE (stream with csv-parse, build name+state Set)
        2. For each city's discovery CSV:
           a. Keyword filter (includes business_status=CLOSED_PERMANENTLY check)
           b. AI classification via Perplexity (batch size 50, not 25)
           c. Category mapping (snake_case → title case)
           d. Name cleaning (strip LLC/Inc/Corp)
           e. Provider ID generation (`{city}-{state}-NNNN`)
           f. Slug generation (`{name}-{city}-{state}`)
           g. Dedup against the one loaded Set
        3. Output: `{city}-{state}/providers_ready.json` per city
        4. Print per-city stats: discovered → keyword → AI → dedup → ready
      - AI classification optimization: batch 50 providers per Perplexity call
      - Verify: run on 2-city test data, confirm output JSON has correct categories/IDs/slugs

- [ ] **5. Implement Phase 3 (Upload & Geocode) in pipeline-batch.js**
      - The `--phase load` handler
      - For each city sequentially:
        1. Read `providers_ready.json`
        2. Upload to Supabase in batches of 50 (upsert on provider_id)
        3. Handle slug collisions (append category suffix, then counter)
        4. Geocode all providers (Google Geocoding API, full state name)
        5. Validate coordinates within state bounding box + ~0.5° of target city
        6. Soft-delete out-of-area providers
        7. Update Notion: status → "Upload to Backend"
      - State bounding boxes: hardcode a lookup table for all 50 states
      - Verify: run on 2-city test data, check Supabase has correct records with valid coordinates

- [ ] **6. Implement Phase 4 (Enrichment) in pipeline-batch.js**
      - The `--phase enrich` handler
      - Treats ALL active providers across ALL cities as one pool
      - Runs 4 parallel streams (different APIs, no conflict):
        - **Stream A — Trust signals** (Perplexity): 3 providers per call, 300ms delay, non-CMS only. Soft-deletes false positives immediately.
        - **Stream B — Review snippets** (Google Places): skip providers with no google_rating, 200ms delay
        - **Stream C — Images** (Google Places): resolve to permanent lh3.googleusercontent.com URLs, 200ms delay
        - **Stream D — Descriptions + initial hydration** (no API): runs instantly, writes descriptions and google_reviews_data JSONB from discovery CSV data
      - **CRITICAL ordering**: Stream D runs FIRST (instant). Streams A/B/C run in parallel AFTER.
      - **After A/B/C complete**: re-hydrate reviews to merge snippets into existing JSONB (fixes race condition permanently)
      - Progress: print every 100 providers processed per stream
      - Verify: run on 2-city test data, check all enrichment columns populated

- [ ] **7. Implement Phase 5 (Finalize) in pipeline-batch.js**
      - The `--phase finalize` handler
      - For each city:
        1. Query Supabase for final active provider count and enrichment coverage
        2. Update Notion: check all 14 boxes + set status to "Complete" — ONE API call
        3. Record stats: providers, categories, enrichment percentages, cost
      - Print final batch summary table
      - Print totals: cities completed/skipped/failed, total providers, total cost
      - Verify: Notion board shows all test cities as Complete with all boxes checked

### Phase 3: Pipeline Slash Command Update

- [ ] **8. Update city-pipeline.md batch mode instructions**
      - Files: `.claude/commands/city-pipeline.md`
      - Changes to batch mode section:
        - New "Batch Mode (Optimized)" section
        - Claude's role: parse batch file, run pre-flight checks (Notion page creation, cost estimate, time estimate), then execute the two scripts
        - Phase 1: `python3 scripts/discovery-batch.py --batch <csv> --mode quick --auto-confirm --output-dir <expansion-dir>`
        - Phase 2-5: `node scripts/pipeline-batch.js --batch <expansion-dir> --phase all --resume`
        - Claude monitors output, reports results, handles any errors that need human judgment
        - Time estimate formula: `discovery: cities × 2.5min, processing: cities × 3min + 35min enrichment`
        - Cost estimate formula: `cities × $6`
        - If >20 cities, warn about discovery time and suggest running discovery in background
        - Keep single-city mode unchanged (still uses the step-by-step approach for one-offs)
      - Verify: run `/city-pipeline` with a 2-city batch file, confirm it uses scripts

- [ ] **9. Add Notion pre-flight to pipeline-batch.js**
      - Before any phase runs:
        - Query Notion for existing city pages
        - Create missing pages (status: Planning, all boxes unchecked)
        - Print: `Created N pages, M already existed, K already complete (will skip)`
      - This replaces the current "create pages upfront" step in the slash command
      - Verify: run with mix of new + existing + complete cities

### Phase 4: Testing & Polish

- [ ] **10. End-to-end test with 3-city batch**
      - Create a test batch file with 3 small cities (population <50K for fast discovery)
      - Run full pipeline: discovery-batch.py → pipeline-batch.js --phase all
      - Verify on olera.com after ISR refresh
      - Check: correct categories, ratings show, images load, trust badges appear, map pins correct
      - Record actual timing and cost for calibration

- [ ] **11. Add session resume capability**
      - pipeline-batch.js `--resume` flag:
        - Read Notion status for each city
        - Skip "Complete" cities entirely
        - For in-progress cities: check which enrichment columns are populated, skip already-done work
        - For "Planning" cities: start from phase 2
      - This enables multi-session 80-city batches (run 20, stop, run next 20)
      - Verify: run 3 cities, kill mid-enrichment, re-run with --resume, confirm it picks up

- [ ] **12. Update SCRATCHPAD.md and commit**
      - Log new scripts in Current Focus
      - Add decision: "Batch pipeline uses phase architecture, not city-by-city"
      - Commit all new files

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Perplexity rate limits at 3-providers-per-call | Batch calls are larger, may hit token limits | Fall back to 1-per-call if response is truncated. Test with 3 first. |
| Google Geocoding API rate limit across 80 cities | Could get 429s during geocoding phase | Built-in retry with exponential backoff. Sequential processing already limits throughput. |
| 61MB dedup CSV grows as we add cities | Memory usage increases | Set is ~33K strings × ~50 bytes = ~1.6MB. Fine even at 100K. |
| Slug collisions across many NY cities | Same provider name in multiple cities | City already in slug format: `{name}-{city}-{state}`. Cross-city collisions impossible. |
| Discovery script Python dependencies | Scripts dir needs its own venv or system deps | Add requirements.txt. Discovery script already works on TJ's machine — same deps. |
| Long-running Node process crashes mid-batch | Lose progress on current city | Resume mode reads Notion + Supabase state. Each city is atomic — restart loses at most one city. |
| Pipeline-batch.js too large (single file) | Hard to maintain | Keep it modular with clear phase functions. Could split into files later if needed. |

## Notes

- Single-city mode in the slash command stays unchanged — the step-by-step approach is fine for one-offs where TJ wants visibility
- The scripts intentionally don't use MCP tools — they call Notion's REST API directly via fetch. This means they work outside Claude Code.
- Discovery could be parallelized across cities with multiple API keys, but that's over-engineering for now. Sequential is fine at 2.5 min/city.
- The `--phase` flag enables TJ to run discovery overnight and processing the next day, or run everything in one shot
- Cost tracking is built into both scripts — they print running totals and a final report

# Olera Provider Data Sweep

> **Status: DRAFT — every run improves this skill.** Phase 7 is a meta-improvement reflection that captures new patterns, missed false positives, and proposed updates to this skill, the runbook, or the definitions doc. The first 2-3 runs will be the messiest; the methodology hardens with each pass.

You are running a periodic health check on Olera's provider database (`olera-providers`). The goal: detect and correct **wrong-category** providers (in scope but in wrong bucket) and **out-of-scope** providers (not actually one of Olera's 6 categories).

This skill was distilled from the inaugural data-sweep run on 2026-04-26 — the methodology evolved through multiple pivots (deletion-only → reclassification-priority → combined verify-and-reclassify with contradiction detection). Future runs should refine, not just re-run.

## Source-of-truth artifacts (read these first)

| Artifact | Path | What it owns |
|---|---|---|
| Category definitions | `docs/provider-category-definitions.md` | The 6 categories, their boundaries, edge cases. **If anything here conflicts with definitions, definitions win.** |
| Runbook | `docs/data-sweep-runbook.md` | Regex patterns, prompt templates, contradiction detection logic, code snippets you can adapt |

If either is stale (definitions changed, methodology improved), update them as part of Phase 7 before the next sweep.

## When to run

- Manually triggered via `/data-sweep`
- **Recommended cadence:**
  - Quarterly default
  - After any city expansion batch ≥100 cities
  - When Grace flags an unusual rate of bad providers via her email-research workflow
- **Scope per sweep (current rule):** full DB. After 2-3 sweeps validate the methodology, switch to incremental ("providers added or modified since the last sweep") to control cost. Track the date of the last sweep in `docs/data-sweep-runbook.md` or via a marker file at the cleanup folder.

## Cost ceiling

**$200 hard ceiling per sweep.** Phase 1 + Phase 2 should be <$10 combined. Phase 3 is the big spend (~$160-180). If projected Phase 3 cost would exceed budget, pause and discuss with TJ before committing.

## Output location

All artifacts (MD review files, backup CSVs, raw verdicts JSON) land in:

```
~/Desktop/TJ-hq/Olera/Provider Database/Cleanup/
```

Naming convention: `<artifact>-YYYY-MM-DD.md|csv|json` (e.g., `tier1-candidates-2026-04-26.md`).

## Phases

### Phase 0: Pre-flight

- Read `docs/provider-category-definitions.md` and confirm it's current (last `Status:` date <90 days old, or update before proceeding)
- Read `docs/data-sweep-runbook.md` for the latest patterns/prompts
- Run `git log --oneline scripts/pipeline-batch.js` to check whether the entity verification prompt has been updated since last sweep
- Pull a count of active providers and current category distribution. Save as a baseline snapshot in the cleanup dir
- Confirm with TJ: full sweep or incremental? Cost ceiling? Any specific concerns to focus on?

### Phase 1: Tier 1 deterministic deletes + reclassifications + DB-wide signal scan (free, ~10 min)

**Phase 1A.0 — DB-wide signal scan (run this FIRST, sweep #2 addition).** Before anything else, run `scripts/scan-out-of-scope-signals.js` (optionally `--since <last-sweep-date>`). It catches the **name-innocent** out-of-scope class (sober-living homes, tattoo/event studios, drug rehabs filed as Nursing Home) by reading the website domain + Google reviews + description — signals no name-regex or LLM-name-check sees. Run `--verify` to individually confirm hits, `--verify --apply` to soft-delete confirmed. This is free/cheap and consistently the highest-yield step. Then proceed to the name-regex sub-steps below.

Two sub-steps using only name-pattern regex (no LLM):

**1A — Deletes (slam-dunk out-of-scope):**
- National pharmacy chains (Walgreens, CVS, Rite Aid)
- DME chains (Apria, Lincare)
- Funeral homes / mortuaries / crematories
- Wedding venues, fitness centers, restaurants
- Pure pediatric daycare
- PACE programs (out per definitions)
- Mexican / non-US facilities (Spanish-language patterns: Asilo, Estancia Geriátrica, A.C. suffix)
- Test data leakage (literal `(test)`, `(demo)`, `dummy` in name)
- Pure hospice (no home-health line in name)
- Pure adult day care / day program
- Inpatient Rehab Hospitals
- Hospitals / urgent cares (when "Home Health" / "Home Care" not also in name)
- Government offices

Patterns + protector regexes: see runbook.

**1B — Reclassifications (slam-dunk wrong-category):**
- National HC franchise names (Visiting Angels, Home Instead, Comfort Keepers, Right at Home, etc.) → `Home Care (Non-medical)`
- National HHC brand names (Amedisys, Bayada, Interim, etc.) → `Home Health Care`
- "Skilled Nursing" / "Convalescent Hospital" in name → `Nursing Home`
- "Memory Care" alone in name → `Memory Care`
- "Assisted Living" alone in name → `Assisted Living`
- "Independent Living" alone in name → `Independent Living`
- Skip combined-category providers (`AL | MC` etc.) — those need LLM judgment

For each: generate an MD review file with sections grouped by transition. All rows default-checked (slam-dunks). TJ reviews, unchecks any false positives, saves. You re-parse and execute.

After execution, save a backup CSV.

### Phase 2: Calibration sample (~$2-5, ~10 min)

Sample 500 providers from the "looks fine" pool (excluded by Phase 1 patterns). Run the inverted Perplexity Sonar prompt (see runbook for current prompt) and report:

- Aggregate IN_SCOPE / OUT_OF_SCOPE / INSUFFICIENT_EVIDENCE rate
- Per-current-category rate
- Top reason clusters for OUT_OF_SCOPE verdicts
- Sample of wrong-category-but-in-scope examples (to validate Phase 3 will catch them)

If OUT_OF_SCOPE rate is >15% or any cluster looks systematic, surface that to TJ before launching Phase 3 — there might be a Tier 1 pattern we should add first to save cost.

### Phase 3: LLM verify-and-reclassify on full DB (~$160-180, ~2 hours)

Combined prompt (see runbook for current version):
- Returns one of three verdicts: `IN_SCOPE` (with `best_category`), `OUT_OF_SCOPE` (with reason), `INSUFFICIENT_EVIDENCE`
- **Default-keep on uncertainty** — never flag OUT_OF_SCOPE without positive web evidence
- Combined-service rule: keep providers with at least one in-scope service line

Run config:
- 10 concurrent calls, batches of 3 providers per call
- Save raw verdicts to JSON every ~600 providers (resume support)
- Use the perplexityChat helper pattern from `scripts/pipeline-batch.js` (with 429/529 exponential backoff)

After completion:
1. **Apply contradiction detection** to the IN_SCOPE-with-different-best-category set. The detector flags any reclassification where the LLM's reason text mentions a category being dropped from a combined-category bucket (e.g., `AL | MC → AL` but reason says "memory care community"). Auto-exclude these — they stay at the current combined category.
2. Generate two MD review files:
   - `reclassifications-<DATE>.md` — IN_SCOPE but `best_category` ≠ current. Compact one-line-per-row format. Contradiction-flagged rows excluded entirely (not shown to TJ).
   - `deletions-<DATE>.md` — OUT_OF_SCOPE with positive evidence.
3. Save raw verdicts JSON for re-use.

### Phase 4: Human review (paused — TJ-gated)

TJ reviews both MD files. All rows default-checked; he unchecks anything wrong. He saves and tells you he's done.

**Do not proceed past this gate without TJ's explicit approval.**

### Phase 5: Execute approved changes

Re-parse both MD files. For each row still checked:
- Reclassifications: `update provider_category` (unchanged: `deleted = false`)
- Deletions: `update deleted = true, deleted_at = now()`

Batch updates in parallel groups of 25. Save backup CSVs of every change before writes.

Report counts: total reclassified, total deleted, failures (if any).

### Phase 6: Pipeline audit

Read the current entity verification prompt at `scripts/pipeline-batch.js` (Stream A unified verify+trust prompt). Check whether it matches the inverted form in the runbook. If drift detected (someone reverted or weakened it), surface to TJ — needs a fix before next city batch.

Also check `scripts/discovery-batch.py` SEARCH_PATTERNS — are any new search terms being used that pull in adjacent ecosystem? Surface drift.

### Phase 7: Meta-improvement reflection (mandatory — captures sloppiness from this run)

Before declaring the sweep done, generate a short reflection MD covering:

1. **What new wrong-scope patterns did we encounter** that aren't yet in the runbook's Tier 1 regexes?
2. **Did contradiction detection miss any LLM errors** that TJ caught manually? (Capture vocabulary the regex didn't recognize.)
3. **Were any Tier 1 regexes too aggressive** (false positives in TJ's review) or **too narrow** (real cases that fell through)?
4. **Did the calibration sample's OUT_OF_SCOPE clusters surface a new bucket** that should become Tier 1 next time?
5. **Did the cost projection match reality?** If the actual spend was wildly different, propose a re-calibration.
6. **Any surprises in the data** worth a heads-up (corrupt category fields, new duplicate patterns, etc.)?

Output: `sweep-reflection-<DATE>.md` in the cleanup folder. Show it to TJ. Ask whether any of the findings should become updates to:

- `docs/provider-category-definitions.md` (boundary changes)
- `docs/data-sweep-runbook.md` (regex / prompt updates)
- This skill (process changes)

If TJ approves any updates, make them in the same session. Don't defer — the muscle memory is freshest right after the run.

## Final report

After Phase 7 completes, summarize the sweep:

| Metric | Value |
|---|---|
| Active providers (start) | N |
| Active providers (end) | N |
| Tier 1 deleted | N |
| Tier 1 reclassified | N |
| LLM reclassified (Phase 3) | N |
| LLM deleted (Phase 3) | N |
| LLM contradictions auto-excluded | N |
| Cost actual | $N |
| Wall time | Nh |
| Phase 7 reflection | path to MD |

Update SCRATCHPAD.md with the result. Optionally write a Notion report under a dedicated Data Sweep folder in Product Development.

## Anti-patterns to avoid (lessons from sweep #1)

1. **Don't run LLM verification on the full DB without a calibration sample first.** A 500-provider sample at $5 tells you whether the methodology is sound. Skipping it risks burning $200 on a bad prompt.
2. **Don't trust the LLM's binary verdicts blindly — apply contradiction detection.** The LLM regularly contradicted itself on combined-category transitions (verdict said "drop MC" while reason confirmed both AL+MC exist). 31% of LLM reclassifications in sweep #1 were contradictions.
3. **Don't ask the LLM to "is this senior care?"** That admits hospice / adult day / PACE because they're senior-related. Use the inverted prompt: "is this PRIMARY BUSINESS one of the 6 EXACT categories?" with explicit exclusion list.
4. **Don't default to OUT_OF_SCOPE on uncertainty — but don't blind-KEEP on it either (sweep #2).** Use INSUFFICIENT_EVIDENCE as the third verdict, then **individually re-verify every INSUFFICIENT (website forced)** before keeping. Sweep #2 found 24% of batched-INSUFFICIENT verdicts were actually out-of-scope (medspas, clinics, hospices). Blind default-keep is how MedWell + 541 others survived the first pass. Default-keep only after an individual attempt also comes back genuinely unknowable.
5. **Don't skip the human review gate.** Even with contradiction detection, TJ catches things programmatic checks miss (e.g., "name says Assisted Living but website says Independent Living" — Edison Christian pattern). The MD-checkbox-then-execute pattern is non-negotiable.
6. **Don't run Phase 3 globally before Phase 1.** Phase 1 catches deterministic cases for $0; Phase 3 confirming them costs $0.002/each but is wasted budget.
7. **Don't delete on a batched verdict — always individually re-verify (sweep #2).** Batched calls (3+/call) under-ground: sweep #2 saw 51% INSUFFICIENT and 73 false-OUT that individual website-forced re-verify flipped back to IN_SCOPE. Batched = triage; individual re-verify = the gate before the deletions MD.
8. **Don't skip the DB-wide signal scan (sweep #2).** The worst providers are name-innocent (sober-living, tattoo studios, rehabs-as-Nursing-Home). Tier-1 name regex and the LLM both miss them; the website-domain/reviews signal scan catches them for free. Run it first, every sweep.

## Inputs from past runs

- 2026-04-26: inaugural sweep. Tier 1 deletes 1,074. Phase 1 reclassifications 1,342. Phase 3 reclassifications ~2,400 (after contradiction filter). Phase 3 deletions ~2,936. Total cost ~$170. Surfaced: hospice systematic miscategorization, national HC franchise miscategorization, combined-category over-application, ~50 corrupt `provider_category` values, Mexican facility contamination.

## Failure modes to watch

- **Perplexity rate-limit storms.** If 429/529 errors spike, reduce concurrency from 10 → 5, or pause for 5 min. Don't disable retries — exponential backoff is in the helper.
- **Resume corruption.** If the JSON cache file is malformed, treat it as a fresh start (the script's resume logic gracefully handles parse failures).
- **MD parser confusion.** If TJ's review file has irregular section headers or mangled checkboxes (e.g., from a Markdown editor that re-formatted), the parser may skip rows. Validate the parsed count before executing — if it's off by >5%, re-prompt TJ.

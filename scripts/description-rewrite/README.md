# Description rewrite pipeline

Purpose: rewrite the first sentence of `provider_description` on directory
listings to improve the Google SERP snippet and, in turn, CTR on
`/provider/*` pages. Tracked in the Olera HQ Action Items Notion board as
"Batch-rewrite provider_description first sentences for SERP snippet
quality".

See the Notion ticket for the strategic framing, HCU risk mitigations, and
success metrics. This README is the operator manual.

## Prerequisites

1. `SUPABASE_KEY` env var with write access to `olera-providers` and
   `provider_description_rewrites`.
2. `ANTHROPIC_API_KEY` env var.
3. A fresh GSC pages-movement CSV in `~/Desktop/olera-hq/strategy/seo/`.
   Generate via `/seo` or `python3 scripts/seo_pull.py` from olera-hq.
4. The schema in `0_schema-setup.sql` applied once in the Supabase SQL
   editor. Idempotent, safe to re-run.

## Flow

### Step 1 — select candidates

```bash
SUPABASE_KEY=... node scripts/description-rewrite/1_select-candidates.mjs \
  --csv ~/Desktop/olera-hq/strategy/seo/2026-04-21_pages-movement.csv \
  --limit 500 \
  --min-impressions 100 \
  --output scripts/description-rewrite/candidates-wave-01.json
```

Outputs a JSON array of candidate records with the fields the rewrite
prompt needs (name, category, city, state, rating, original description,
baseline GSC metrics). Resolution from URL slug -> `provider_id` is done by
ILIKE-matching the slug-derived name hint against `provider_name`. The
script keeps only rows whose generated slug exactly matches the GSC slug;
everything else goes into the miss report for manual follow-up.

### Step 2 — dry-run on 10

```bash
SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/description-rewrite/2_rewrite-descriptions.mjs \
  --candidates scripts/description-rewrite/candidates-wave-01.json \
  --wave 1 \
  --limit 10 \
  --dry-run
```

Writes two output files beside the candidates JSON:
- `candidates-wave-01-wave1-diff-dryrun.txt` — human-readable before/after
- `candidates-wave-01-wave1-audit-dryrun.json` — structured rows for review

**Review output before running live.** Specifically look for:
- Outputs that drop the provider name, city, or state (should already be
  caught by the validator, but double-check).
- Outputs that pattern-fingerprint the same structure across variants.
- Outputs that invent facts the input didn't contain.
- Outputs that scrub distinctive human phrasing from the original.

### Step 3 — live wave 1 (500 records)

```bash
SUPABASE_KEY=... ANTHROPIC_API_KEY=... node scripts/description-rewrite/2_rewrite-descriptions.mjs \
  --candidates scripts/description-rewrite/candidates-wave-01.json \
  --wave 1
```

Writes `provider_description_v1_backup` (first time per row) and the new
`provider_description`. Inserts per-record audit rows into
`provider_description_rewrites`. Safe to re-run — same wave number,
duplicate audit rows but correct state in `olera-providers` because the
backup column is only set when currently null.

### Step 4 — measure (4 weeks)

Monitor in GSC:
- Rewritten cohort CTR vs each page's own pre-rewrite baseline (paired).
- `/provider/` content-group CTR vs prior 4-week window.
- Average position on the cohort (watch for drops = HCU regression).

Log findings to the SEO Running Thread at
`https://www.notion.so/3455903a0ffe81888526d1f4bdf7e1f4`.

### Step 5 — decision

- Positive signal (CTR up, no rank drop): expand to remaining records in
  waves of 1-2K with the same prompt.
- Mixed or negative signal: rollback with
  ```sql
  UPDATE "olera-providers"
    SET provider_description = provider_description_v1_backup,
        provider_description_v1_backup = NULL
    WHERE provider_description_v1_backup IS NOT NULL;
  ```
  Post-mortem in the SEO Running Thread.

## Style variants

Three structural variants rotate deterministically by candidate index:

- **A** — Name-first descriptive. `"{Name} is a {category} in {city}, {state}, offering..."`
- **B** — Name-first comma-inset. `"{Name}, a {category} in {city}, {state}, provides..."`
- **C** — Location-first. `"Based in {city}, {state}, {Name} is a {category} that..."`

All three satisfy the same hard rules (140-170 chars, all of
name/category/city/state in the first 80 chars, no clickbait, preserve
distinctive facts from the original).

## Validator rejections

Records that fail validation keep their original `provider_description`
untouched, but still log an audit row with status `rejected_*` so we can
inspect patterns.

| Reason | What it means |
|---|---|
| `too_short_N` | Output under 100 chars. Prompt probably failed to pack the required fields. |
| `too_long_N` | Output over 200 chars. Will get truncated by Google — reject. |
| `missing_name` | Name dropped from the first sentence. Banned. |
| `missing_city`, `missing_state` | Location dropped. Banned. |
| `missing_terminator` | No period at end. Banned (breaks reading in SERP). |
| `banned_hook` | Starts with "Discover...", "Find the best...", "Looking for...". Banned (clickbait pattern punished by HCU). |
| `llm_error` | Anthropic call errored. Can re-run the same wave — already-applied rows are safe because of the backup column guard. |

## Cost

At ~$0.002/record on Haiku 4.5, wave 1 (500 records) is ~$1. Full 2,224-
record cohort is ~$4-5. Negligible.

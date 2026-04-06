# Deduplicate Provider Database

Find and remove duplicate providers from Supabase using three-tier fuzzy matching.

## Arguments

`$ARGUMENTS` — optional: a city name, state, or flags to pass to the script.

## Instructions

Run the dedupe script from the main repo directory (worktrees don't have node_modules):

```bash
cd ~/Desktop/olera-web
```

**Always run in report mode first** (no `--delete` flag), then show the user the duplicate pairs found. Ask for confirmation before deleting.

### Report mode (default — shows duplicates without changing anything)
```bash
node scripts/dedup-database.js
```

### Delete mode (soft-deletes duplicates, keeps the best record)
```bash
node scripts/dedup-database.js --delete
```

### Export mode (save duplicate pairs to CSV for review)
```bash
node scripts/dedup-database.js --export report.csv
```

### How it works

Three-tier matching (adapted from TJ's `duplicate_finder.py`):

1. **Tier 1**: Exact normalized address + name similarity >= 75%
2. **Tier 2**: Base address (suite stripped) + name similarity >= 75%
3. **Tier 3**: Name + city match (>= 90% fuzzy similarity)

The script normalizes addresses (abbreviations, punctuation) and names (strips LLC, Inc, suffixes) before comparing. Soft-deletes set `deleted = true` and `deleted_at = now()` — no hard deletes.

### Safety
- Always preview first — show the user how many duplicates were found and sample pairs before deleting.
- The script keeps the "best" record (highest review count / most complete data) and soft-deletes the rest.
- Soft-delete is reversible — records can be restored by setting `deleted = false`.

# Olera City Expansion Pipeline

You are helping TJ expand Olera's senior care provider directory to new cities. The pipeline discovers providers via Google Places API, cleans and enriches the data, imports to Supabase, and tracks progress in Notion.

This skill supports two modes:
- **Resume mode** (default): Query Notion for cities already in progress, pick up where they left off
- **New city mode**: Start a fresh expansion for a city TJ specifies

Always start with Step 0 to understand the current state before doing any work.

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
5. "Done: Rich Description"
6. "Done: Add Provider ID"
7. "Done: Add Score"
8. "Done: Check Provider Category Spelling & Capitalization"
9. "Done: Name Check (Remove \"LLC\" or \"Inc\" from provider names)"
10. "Done: Upload to Supabase"
11. "Done: Ensure Review Snippets Are Appropriate"
12. "Done: Fetch Unique Images"
13. "Done: Fetch Email & Contact Info"

To check a box via the Notion MCP, set the property value to `"__YES__"`.

**Update Notion progressively** as you complete each step. Do not batch updates to the end.

## Supabase Reference

- Table: `olera-providers` (hyphen, not underscore)
- Columns: `name`, `address`, `city`, `state`, `zip_code`, `phone`, `website`, `provider_type`, `lat`, `lon`, `provider_id`, `slug`, `email`
- Provider ID pattern: `{city}-{state}-NNNN` (all lowercase, zero-padded to 4 digits), e.g., `bellevue-ne-0001`
- Query providers for a city: `provider_id LIKE '{city}-{state}-%'`
- Use `@supabase/supabase-js` with the service role key from `.env`

## File Organization

All working files go to:
```
~/Desktop/TJ-hq/Olera/Provider Database/Expansion/{City}-{State}/
```

Create this directory if it doesn't exist. The full provider DB export (for dedup) is at:
```
~/Desktop/TJ-hq/Olera/Provider Database/olera-providers_rows.csv
```

## Pipeline Steps

Run only the unchecked steps for the target city. Pause after each step, report results, and wait for TJ's go-ahead before proceeding.

### Discovery

Run the discovery script:
```bash
cd ~/Desktop/TJ-hq/Olera/Olera\ Data\ Analysis\ Scripts/senior-care-discovery/
python discovery.py
```

Select option 1 (manual city entry), enter city/state, confirm cost (~$4-5 per city in quick search mode). Copy the output CSV (`providers_discovered_*.csv`) to the city's expansion directory.

Report: Number of providers discovered.

### Verify if Senior Care Business

Filter out false positives. Remove rows where name or category contains any of these (case-insensitive): pharmacy, hospital, pediatric, veterinary, dental, optometrist, chiropractor, urgent care, physical therapy, dialysis, medical supply, staffing agency.

Report: How many removed, how many remain.

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

### Rich Description

Write a factual 1-2 sentence description for each provider based on its name, category, address, and any info from its website or Google Places listing. Store in the appropriate Supabase column.

Report: How many descriptions written.

### Add Provider ID

Generate IDs in format `{city}-{state}-NNNN` (all lowercase, zero-padded to 4 digits). Also generate slugs in format `{name}-{state}` (lowercase, spaces to hyphens, special characters stripped).

### Add Score

Calculate or assign a quality/relevance score based on available data (reviews, completeness of info, etc.). Store in Supabase.

### Check Provider Category Spelling & Capitalization

Verify every `provider_type` value exactly matches one of the title-case categories from the CATEGORY_MAP. Fix any mismatches. This is a safety net for the Verify Category step.

### Name Check (Remove "LLC" or "Inc")

Strip business suffixes (LLC, Inc, Corp, Ltd, etc.) from all provider names. Update in Supabase.

### Upload to Supabase

This step includes both the import and re-geocoding.

**Import:** Write or adapt a Node.js import script. Column mapping:

| CSV Column | Supabase Column |
|-----------|----------------|
| name | name |
| address | address |
| city | city |
| state | state |
| zip | zip_code |
| phone | phone |
| website | website |
| category (mapped) | provider_type |
| lat | lat |
| lon | lon |
| provider_id | provider_id |
| slug | slug |

**Dedup first:** Before importing, deduplicate against the existing database. The full export at `~/Desktop/TJ-hq/Olera/Provider Database/olera-providers_rows.csv` is 61MB. **Do NOT use pandas.** Stream with Python's `csv` module:

```python
import csv
existing = set()
with open('olera-providers_rows.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['name'].strip().lower(), row['state'].strip().upper())
        existing.add(key)
```

Match on provider name (case-insensitive) + state.

**Re-geocode (required):** After upload, re-geocode every provider. Discovery lat/lng values are frequently wrong, especially for home care services. Call Google Geocoding API with `{address}, {city}, {state full name}` (use full state name like "Nebraska", not "NE", to prevent cross-state matches). Validate all coordinates fall within the target state's bounding box. Update lat/lon in Supabase. Cost: ~$2 per 375 providers.

Report: Rows imported, duplicates skipped, geocoding corrections made, any out-of-bounds coordinates.

### Ensure Review Snippets Are Appropriate

Query all providers for this city. Check that review snippets or description fields are populated and make sense. Fix any that are empty, nonsensical, or clearly wrong.

Report: How many needed fixes.

### Fetch Unique Images

For each provider missing an image:
1. Try Google Places Photos API using provider name + city + state
2. Fall back to a category-appropriate placeholder if nothing is found
3. Store the image URL in the appropriate Supabase column

Report: How many had images, how many fetched, how many fell back to placeholders.

### Fetch Email & Contact Info

For each provider missing an email:
1. Check Google Places API details endpoint
2. If the provider has a website, check the contact page for an email
3. Update the `email` field in Supabase

Report: How many emails found vs. how many remain without.

## After All Steps Complete

1. **Update Notion:** Check off all completed boxes. Set "City Status" to **"Complete"**.

2. **Verify on live site:** Check power pages at `https://olera.com/{category}/{state-slug}/{city-slug}` (e.g., `/assisted-living/nebraska/bellevue`). Confirm provider cards and map pins render correctly. ISR cache is 1 hour, so pages may not update immediately.

3. **Ask TJ** if there's another in-progress city to work on.

## Known Pitfalls

These are real issues from past expansions. Each one has wasted real debugging time, so take them seriously.

- **Category mismatch = invisible providers.** If `provider_type` stays in snake_case, providers import but never appear on the frontend. The site filters on exact title-case strings.
- **Discovery coordinates are unreliable.** Google Places regularly returns lat/lng for a different business in a different state. Always re-geocode. Always validate against the state bounding box.
- **Table name has a hyphen.** It's `olera-providers`, not `olera_providers`. This breaks naive SQL and some ORM patterns.
- **Columns are `lat`/`lon`.** Not latitude/longitude, not lng.
- **61MB CSV will crash pandas.** The full provider export must be streamed with the `csv` module. Do not use `pd.read_csv()`.
- **ISR cache = 1 hour.** New providers won't show on the site immediately. Don't re-import or debug if pages look empty right after upload.
- **Notion statuses are pipeline stage names, not Kanban labels.** "City Status" values are Discovery, Merge, QC Category, Fetch Images, etc. The Kanban groups these into To-do/In progress/Complete columns, but the actual property values are the stage names. Filter accordingly.
- **Vercel requires `NODE_VERSION=22`.** If deploying olera-web changes, this env var must be set.

## Cost Per City

| Item | Cost |
|------|------|
| Discovery (quick search) | $4-5 |
| Geocoding (~375 providers) | ~$2 |
| Total | ~$6-7 |

## Reference

Full playbook with additional detail: `~/Desktop/TJ-hq/Olera/city-expansion-playbook.md`

# Olera City Expansion Pipeline

You are helping TJ expand Olera's senior care provider directory to new cities. The pipeline discovers providers via Google Places API, cleans and enriches the data, imports to Supabase, and tracks progress in Notion.

This skill supports two modes:
- **Resume mode** (default): Query Notion for cities already in progress, pick up where they left off
- **New city mode**: Start a fresh expansion for a city TJ specifies

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

## Pipeline Steps

Run only the unchecked steps for the target city. **Run autonomously end-to-end** — do not pause for approval between steps. Run enrichment steps in parallel. Only stop and ask TJ if:
- Something fails unexpectedly (API errors, rate limits that don't resolve)
- An unmapped category appears that needs a decision
- Cost would exceed $15 for a single city (unusual — flag it)

Report results at the end with a summary table, not step-by-step.

### Discovery

Run the discovery script:
```bash
cd ~/Desktop/TJ-hq/Olera/Olera\ Data\ Analysis\ Scripts/senior-care-discovery/
python discovery.py
```

Select option 1 (manual city entry), enter city/state, confirm cost (~$4-5 per city in quick search mode). Copy the output CSV (`providers_discovered_*.csv`) to the city's expansion directory.

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

1. **Update Notion:** Check off all completed boxes. Set "City Status" to **"Complete"**.

2. **Verify on live site:** Check power pages at `https://olera.com/{category}/{state-slug}/{city-slug}` (e.g., `/assisted-living/nebraska/bellevue`). Confirm:
   - Provider cards render with ratings and review counts
   - Trust signal badges show on non-CMS provider cards
   - Map pins are in the correct location (geocoding worked)
   - ISR cache is 1 hour — pages may not update immediately

3. **Verify trust signals on a provider detail page:** Pick a non-CMS provider, visit its page, and confirm the "Verified Credentials" section renders with green checkmarks.

4. **Ask TJ** if there's another in-progress city to work on.

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
| Discovery (quick search) | $4-5 |
| Geocoding (~375 providers) | ~$2 |
| Trust Signals (~250 non-CMS) | ~$0.25 |
| Review Snippets (~375 providers) | ~$2 |
| **Total** | **~$8-9** |

## Reference

Full playbook with additional detail: `~/Desktop/TJ-hq/Olera/city-expansion-playbook.md`

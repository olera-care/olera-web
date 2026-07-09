# Auto-Sourced Image Audit & Takedown Plan

**Status:** Planning only — no code changes. This document scopes the exposure,
gives the exact queries to produce the definitive list, and lays out a phased
plan to take down or swap unlicensed auto-sourced images for TJ's licensed stock
library.

**Goal:** Guard public pages against unlicensed images. Priority is **provider
hero images**, since that is where the flagged image lived and where an
auto-sourced photo is most prominent.

---

## TL;DR

- The overwhelming source of provider photos is the **Google Places Photos
  API**. There is **no Bing / Perplexity / generic-web scraping** in this repo
  (Perplexity is used only for email discovery). A **separate iOS app** also
  scrapes photos into the same field — out of repo, flag separately.
- Those Google photos reach public pages in **two shapes**:
  1. **Self-hosted** — we downloaded the bytes and re-host them on **Cloudflare
     R2** (`pub-…​.r2.dev`, bucket `provider-images`). *This is the highest-risk
     class and the explicit target of this audit* — we are redistributing
     copyrighted bytes from our own infrastructure.
  2. **Hot-linked** — we store Google's `lh3.googleusercontent.com` URL directly
     in `provider_images`. Still unlicensed and still on public pages, but the
     bytes are served by Google, not us.
- **The safe landing zone already exists.** TJ built a provably-licensed,
  self-hosted, license-manifested stock library (`public/images/fallback/` +
  `CREDITS.json` + a build-time license guard), already wired as the runtime
  fallback. Removing an auto-sourced image automatically falls back to a
  licensed category photo — **no new UI work is required to make a takedown
  safe.**
- **We cannot run the definitive list from this environment** (no Supabase
  credentials — only `.env.example` is present, and we are read-only in planning
  phase). The list lives in the database. Section 4 gives the exact queries to
  produce it. Provider hero images are called out as the priority slice.

---

## 1. Where auto-sourced images come from

| Path | File | What it does |
|------|------|--------------|
| Runtime helper | `lib/google-places.ts:114-174` | `fetchGooglePlacePhoto(placeId)` — resolves Google photo → permanent `lh3.googleusercontent.com` URL |
| City enrichment | `scripts/enrich-city.js:474-512` | Fetches first Google photo, writes `photoUri` **directly** into `olera-providers.provider_images` (hot-link) |
| Batch pipeline | `scripts/pipeline-batch.js:556-575, 1453-1544` | Combined reviews+photos; writes Google URL into `provider_images` |
| Older copies | `scripts/process-city.js`, `*.bak` | Same logic, superseded |
| **R2 migration** | `scripts/migrate-images-to-r2.mjs` | Re-downloads Google bytes → `sharp` optimize → **uploads to Cloudflare R2** → rewrites `provider_images` |
| Hero selection | `scripts/classify-provider-images.mjs` | Classifies each image (heuristics + Claude vision), picks hero, denormalizes `hero_image_url` |

**Not image sources** (for completeness): Geocoding calls (`process-city.js`,
`fix-mislabeled-cities.js`, `reconcile-location.js`), text/ratings search
(`market-diagnostic`, `medjobs-homecare-backfill.js`), and website discovery
(`outreach-enrichment.ts`) all hit Google APIs but pull **no photos**.

**External source to flag:** `SCRATCHPAD.md:650` references "iOS-scraped images"
counting toward gallery completeness — the iOS app (separate codebase) scrapes
into the same `provider_images` field. Provenance for those must be investigated
outside this repo.

---

## 2. Where the images live — storage inventory & risk tiering

| # | Storage class | Where | How to identify | Licensed? | Risk |
|---|---------------|-------|-----------------|-----------|------|
| 1 | **R2 self-hosted (Google bytes)** | Cloudflare R2 `provider-images`, `pub-e9cff84835324ecca87386d81c641a56.r2.dev` | URL contains `r2.dev` | ❌ No | 🔴 **Highest** — we redistribute the bytes |
| 2 | **Google hot-link** | Google CDN | URL contains `googleusercontent.com` (or ephemeral `places.googleapis.com`) | ❌ No | 🟠 High — unlicensed, public, but served by Google |
| 3 | **Legacy dead CDN** | `cdn-api.olera.care` (offline) | URL contains `cdn-api.olera.care` | ❌ No | 🟡 Broken links; R2 migration exists to replace these |
| 4 | **First-party uploads** | Supabase `provider-directory-images`, `profile-images` (+ medjobs/content) | `…supabase.co/storage/…` | ✅ Supplied by admin/provider | 🟢 Low |
| 5 | **Email stock set** | Supabase `content-images/fallback` | `lib/family-comms/alternatives.ts`, `lib/email-samples.ts` | ⚠️ Unprovable provenance (pre-dates TJ's library) | 🟠 Separate cleanup — flagged by TJ in `SCRATCHPAD.md:229` |

Classes **1, 2, 3** are the auto-sourced targets. **Class 1 is the priority**
("self-hosted" in the request, and where the flagged hero lived). Class 5 is a
distinct, parallel problem worth folding into the same remediation.

---

## 3. How auto-sourced images surface on public pages (why hero is the priority)

Selection logic in `lib/types/provider.ts`:

- **`resolveCardImage()` (`:335-351`)** — browse cards: `hero_image_url` →
  first non-logo `provider_images` → **licensed category stock fallback**.
- **`getPrimaryImage()` (`:100-106`)** — `hero_image_url` → `provider_images[0]`
  → `provider_logo`.
- **Detail page** `app/provider/[slug]/page.tsx:93-99, 344, 798` — uses
  `provider_images[0]` as the hero and passes `heroFallbackImage` (licensed
  stock) when empty. The same first image also becomes the **`og:image`** social
  preview (`:93-99` in `generateMetadata`).
- **Render/fallback stack** — `components/providers/ProviderHeroGallery.tsx:34-62`:
  the licensed stock photo is a true fallback layer (shows if real images fail),
  not just a load placeholder.

So an auto-sourced image is the **most prominent element** on the card, the
detail hero, and the social-share preview — hence hero-first prioritization.

> Note: `lib/providers/directory.server.ts:126,143` currently hardcodes
> `hero_image_url: null` in the main directory read, so public pages effectively
> render `provider_images[0]`. Any takedown must therefore act on
> **`provider_images`**, not only the denormalized `hero_image_url`.

---

## 4. Producing the definitive list (run these — we could not, no creds here)

The list is a database query. Run against `olera-providers` and
`provider_image_metadata` with the service role.

**Size the problem by host class (the money query):**

```sql
select
  case
    when image_url ilike '%r2.dev%'                 then '1_r2_selfhosted'
    when image_url ilike '%googleusercontent.com%'  then '2_google_hotlink'
    when image_url ilike '%cdn-api.olera.care%'     then '3_legacy_cdn'
    when image_url ilike '%supabase.co/storage%'    then '4_first_party_upload'
    else '5_other'
  end as host_class,
  count(*)                          as images,
  count(*) filter (where is_hero)   as heroes,
  count(distinct provider_id)       as providers
from provider_image_metadata
group by 1 order by 1;
```

**Priority slice — self-hosted (R2) heroes on live providers:**

```sql
select provider_id, provider_name, slug, hero_image_url
from "olera-providers"
where hero_image_url ilike '%r2.dev%'
  and (deleted is null or deleted = false)
order by provider_name;
```

**Full self-hosted set (R2, hero + gallery):**

```sql
select provider_id, provider_name, slug, hero_image_url, provider_images
from "olera-providers"
where (provider_images ilike '%r2.dev%' or hero_image_url ilike '%r2.dev%')
  and (deleted is null or deleted = false);
```

**Hot-linked Google + legacy CDN (classes 2 & 3):**

```sql
select provider_id, provider_name, slug, hero_image_url, provider_images
from "olera-providers"
where provider_images ilike '%googleusercontent.com%'
   or provider_images ilike '%cdn-api.olera.care%'
   or hero_image_url  ilike '%googleusercontent.com%';
```

Cross-check the R2 count against the actual bucket object listing (via the R2/S3
API) — objects can be orphaned in the bucket even after a DB row is repointed.

---

## 5. The safe landing zone already exists (TJ's licensed stock system)

Built in commit `2f20196` ("Replace unprovable fallback images with licensed
stock library"), implementing "Strategy #2 — Own our stock & fallback licenses."

| Piece | Path |
|-------|------|
| Served library (39 images) | `public/images/fallback/{category}-NN.jpg` |
| License manifest (legal record) | `public/images/fallback/CREDITS.json` (Pexels + Unsplash, commercial/no-attribution) |
| Build guard (fails CI if undocumented) | `scripts/check-fallback-licenses.js` |
| Category pools + runtime picker | `lib/types/provider.ts` (`CATEGORY_FALLBACK_POOLS`, `getCategoryFallbackImage`) |
| Intake / process doc | `stock-intake/README.md`, `docs/stock-image-pipeline.md` |

**Implication:** the fallback path is already wired end-to-end. **Clearing an
auto-sourced image → the provider automatically renders a licensed,
category-appropriate stock photo.** No frontend work is required to make a
takedown safe. Independent Living is the thinnest pool (a re-sourcing candidate
if we want more active-lifestyle imagery).

---

## 6. Proposed plan (phased — for approval, not yet built)

### Phase 0 — Inventory & freeze the intake (fast)
- Run the Section 4 queries; export the R2-hero list (priority) + full class 1/2/3
  lists to a spreadsheet with counts. Reconcile R2 DB rows against the bucket
  object list.
- **Stop the bleed:** the current pipeline (`enrich-city.js`, `pipeline-batch.js`)
  still writes new Google photos on every city run. Decide whether to pause the
  `images` stream in enrichment until remediation strategy is locked (prevents
  the backlog from regrowing while we clean it).

### Phase 1 — Remediate the self-hosted set (Class 1, highest risk)
Per provider with an R2 image, choose one:
- **(a) Take down → stock.** Null out `hero_image_url` and strip R2 URLs from
  `provider_images`; the licensed category fallback renders automatically. Then
  delete the orphaned objects from the R2 bucket. Simplest, fully safe, zero
  licensing risk. Recommended default for all unclaimed providers.
- **(b) Keep for claimed/owner-supplied.** If a provider has **claimed** their
  profile and the image is genuinely theirs (facility photo they'd supply
  anyway), it can be retained or re-requested through the first-party upload path
  (`provider-directory-images`) — that shifts it to Class 4 (licensed by the
  supplier). Needs a claimed-status join to identify these.
- Existing tooling makes this a data operation, not a build: the admin image API
  (`app/api/admin/images/[providerId]/route.ts`) already supports
  `set_hero` / `clear_hero` / `delete_image`, and `provider_image_metadata` has
  a `review_status` column (`admin_overridden`) to record decisions and protect
  them from the classifier.

### Phase 2 — Hot-links & legacy (Classes 2 & 3)
- Same take-down-to-stock treatment for `googleusercontent.com` and
  `cdn-api.olera.care` URLs. Legacy CDN links are already broken, so those are
  pure cleanup.

### Phase 3 — Email stock set (Class 5)
- Replace `content-images/fallback` (Supabase) references in
  `lib/family-comms/alternatives.ts` and `lib/email-samples.ts` with the
  licensed `public/images/fallback/` library, or re-source + document them in a
  manifest of their own.

### Phase 4 — Prevent recurrence
- If any auto-sourcing is kept, gate it behind a license-aware rule (e.g. only
  store provider-supplied uploads; never auto-store Google bytes on public
  surfaces), mirroring the `check-fallback-licenses.js` guard philosophy.
- Investigate the **iOS app's** scraped images separately — same `provider_images`
  field, provenance outside this repo.

---

## 7. Open decisions for the team

1. **Default action** — take everything down to licensed stock (safest, cleanest),
   or attempt to preserve images for claimed providers? (Recommend: down-to-stock
   for unclaimed; preserve/re-request for claimed.)
2. **Pause auto-image enrichment** now, or let it run until remediation ships?
3. **Scope of "public pages"** — provider cards + detail + og:image are covered
   here; confirm no other surface (email, ads, PDFs) pulls the same URLs.
4. **iOS app** — who owns investigating the separately-scraped images in the
   shared `provider_images` field?
5. **R2 bucket cleanup** — confirm we want to hard-delete objects after DB
   repointing (vs. leave orphaned).

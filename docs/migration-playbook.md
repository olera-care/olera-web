# Olera v1.0 → v2.0 Migration Playbook

> **Status:** In Progress (DNS cutover complete, SEO hardening ongoing) | **Priority:** P1 | **Owner:** TJ
> **Last Updated:** 2026-03-01

---

## 1. Provider Page SEO Report Card

Every SEO element on the provider detail page, comparing Olera v1.0 (current live), Olera v2 (migration target), and competitors.

> **Note:** Olera v1.0 assessments are based on the XFive-built Rails+React stack analysis and should be verified against the live site. Items marked with `*` are estimates. Competitor data marked with `~` is inferred from SERP analysis (both APFM and Caring.com block automated crawling).

### Meta & Head Tags

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| Dynamic title tag (unique per provider) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Dynamic meta description (unique per provider) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Canonical URL | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Robots meta tag (per-page) | ✅ Yes* | ⚠️ Global only | ✅ Yes | ✅ Yes | P3 |
| Viewport meta tag | ✅ Yes | ✅ Via Next.js | ✅ Yes | ✅ Yes | — |
| Language / locale declaration | ✅ Yes* | ✅ `lang="en"` | ✅ Yes | ✅ Yes | — |

### Open Graph & Social

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| og:title | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| og:description | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| og:image (absolute URL) | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| og:url | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| og:type | ✅ Yes* | ✅ "website" | ✅ "business.business" | ✅ "website" | — |
| og:site_name | ✅ Yes* | ✅ "Olera" | ✅ Yes | ✅ Yes | — |
| twitter:card | ✅ Yes* | ✅ summary_large_image | ✅ Yes | ✅ Yes | — |
| twitter:title | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| twitter:description | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| twitter:image | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |

### Structured Data (JSON-LD)

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| LocalBusiness schema | ✅ Yes | ✅ Yes | ✅ Yes~ | ✅ Yes~ | — |
| BreadcrumbList schema | ✅ Yes* | ✅ Yes | ✅ Yes~ | ✅ Yes~ | — |
| AggregateRating schema | ✅ Olera Score | ✅ Yes (in LocalBusiness) | ✅ Yes~ | ✅ Yes~ | — |
| FAQPage schema (for Q&A section) | ❌ No* | ✅ Done (PR #81) | ❌ **No** (no FAQ section) | ⚠️ Possible~ | ~~P1~~ Done |
| Individual Review schema | ❌ No* | ✅ Done (PR #82) | ⚠️ Possible~ | ✅ Yes~ | ~~P1~~ Done |
| Organization / Publisher schema | ❌ No* | ✅ Global in layout.tsx | ✅ Yes~ | ✅ Yes~ | — |
| PriceSpecification / Offer schema | ❌ No* | ✅ Done (PR #82) | ⚠️ Unverified~ | ⚠️ Possible~ | ~~P1~~ Done |
| ImageObject schema | ❌ No* | ❌ Missing | ⚠️ Possible~ | ❌ No~ | P2 |
| VideoObject schema | ❌ No | N/A (no videos) | ⚠️ Possible~ | ❌ No | P3 |
| MedicalBusiness subtype | ❌ No* | ❌ Deferred (low reward vs LocalBusiness) | ⚠️ Unverified~ | ⚠️ Possible~ | P3 (revisit) |
| Person schema (staff/manager) | ❌ No* | ❌ **Missing** | ⚠️ Unverified~ | ❌ No~ | P2 |
| GeoCoordinates | ❌ No* | ✅ Done (PR #82) | ⚠️ Unverified~ | ⚠️ Likely~ | ~~P1~~ Done |

### HTML & Content Quality

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| Single H1 tag | ✅ Yes | ✅ Provider name | ✅ Yes | ✅ Yes | — |
| Proper heading hierarchy (H1→H2→H3) | ✅ Yes* | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Semantic HTML5 elements (nav, main, section) | ⚠️ React SPA* | ⚠️ Partial (nav only) | ⚠️ Unverified~ | ⚠️ Likely (WordPress)~ | P2 |
| Breadcrumb navigation (visual) | ✅ Yes | ✅ With aria-label | ✅ Yes | ✅ Yes | — |
| Meaningful image alt text | ⚠️ Partial* | ⚠️ Partial (gallery good) | ⚠️ Partial (2 missing on HP) | ⚠️ Unverified~ | P2 |
| Internal cross-links (category/state/city) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| User-generated reviews displayed | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Q&A content displayed | ❌ No (v2 feature) | ✅ QASectionV2 | ✅ Yes | ✅ Yes | — |
| Unique content depth (~word count) | ⚠️ ~1,000–2,000* | ✅ ~2,000–3,500 | ✅ ~3,000+ | ✅ ~2,500+ | — |

### Technical SEO

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| Proper 404 status code | ✅ Rails default* | ✅ `notFound()` (fixed 2026-03-01) | ✅ Proper 404 | ✅ Proper 404 | ~~P0~~ ✅ |
| Included in sitemap.xml | ✅ 22K+ providers | ✅ 39K+ providers | ✅ Yes | ✅ Yes | — |
| robots.txt allows crawling | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | — |
| Server-side rendered | ⚠️ Rails SSR + React hydration | ✅ Full Next.js SSR | ✅ Yes | ✅ Yes | — |
| Image optimization (webp, srcset) | ❌ Standard `<img>` | ❌ **Plain `<img>` tags** | ✅ Optimized | ✅ Optimized | **P1** |
| Lazy loading below-fold images | ❌ No* | ❌ **Missing** | ✅ Yes | ✅ Yes | **P1** |
| Preconnect / preload hints | ❌ No* | ❌ Missing | ✅ Yes | ✅ Yes | P2 |
| Core Web Vitals optimized | ⚠️ Unknown | ⚠️ Untested | ✅ Yes | ✅ Yes | P2 |

### URL & Redirect Infrastructure

| SEO Element | Olera v1.0 | Olera v2 | APFM | Caring.com | v2 Priority |
|---|---|---|---|---|---|
| Clean URL structure | ✅ `/provider/{slug}` | ✅ `/provider/{slug}` | ✅ Yes | ✅ Yes | — |
| v1.0 provider URLs → v2 (301) | N/A (is v1.0) | ✅ Middleware 4-segment | N/A | N/A | — |
| v1.0 state abbreviation URLs → v2 slugs | N/A (is v1.0) | ✅ Middleware 301 (fixed 2026-03-01) | N/A | N/A | ~~P0~~ ✅ |
| Pagination URL migration (`/page/{n}`) | N/A (is v1.0) | ✅ Middleware strips `/page/{n}` (fixed 2026-03-01) | N/A | N/A | ~~P1~~ ✅ |
| Trailing slash normalization | ✅ Rails default | ✅ Via Next.js defaults | ✅ Yes | ✅ Yes | — |
| Category alias redirects (permanent 308) | N/A (is v1.0) | ⚠️ Uses 307 temporary | N/A | N/A | **P1** |

### Overall Score

| Metric | Olera v1.0 | Olera v2 | APFM | Caring.com |
|---|---|---|---|---|
| **Confirmed Elements** | ~24 / 40 | 34 / 40 (+4 from structured data) | ~28 / 40 confirmed | ~22 / 40 confirmed |
| **Confirmed + Inferred** | ~24 / 40 | 34 / 40 | ~35 / 40 | ~33 / 40 |
| **Score (confirmed only)** | **~60%** | **85%** | **~70%** | **~55%** |
| **Score (with inferred)** | **~60%** | **85%** | **~88%** | **~82%** |
| **Grade** | **D+** | **B+** (up from B-) | **B+ to A** | **B to B+** |

> **Important:** Both APFM and Caring.com block automated crawling (HTTP 403). Their scores include many inferred elements based on SERP analysis, tech stack, and industry research. Actual implementation may differ. Only Olera v2 scores are fully verified from source code.

### Key Takeaways

1. **DNS cutover has NOT happened yet** — olera.care is still running v1.0. v2.0 is on staging at staging-olera2-web.vercel.app.
2. **Provider slugs match** — `provider_id` in `olera-providers` IS the human-readable slug (e.g., `irn-home-care`). No redirect mapping needed. ✅
3. **P0 regressions now fixed** — 404 handling returns proper HTTP 404; state abbreviation URLs redirect to full slugs via middleware. ✅
4. **FAQPage schema = competitive advantage** — APFM doesn't have it, Caring.com may not either. Adding it to Olera v2's Q&A section would be a differentiator
5. **Structured data is the biggest remaining gap** — v2 has 3 of 12 schema types; competitors likely have 6-8
6. **Closing P1 gaps brings v2 to ~85% (B+)** — on par with or exceeding competitors on verified elements
7. **v1.0 title tag pattern is strong** — `{Provider Name}, {City} {State}: Pricing & Availability | Olera.care` (confirmed via Google SERP). v2 uses `{Name} | {Category} in {City}, {State} | Olera` — different format, should verify which performs better for CTR

### P0 Fixes (Do Before DNS Cutover)

0. **CRITICAL — Provider slug system** ⚠️ **CONFIRMED (2026-03-01) — Fix in progress**
   - `provider_id` values are 7-char alphanumeric IDs (e.g., `r4HIF35`, `BiZLwjW`) — NOT human-readable
   - Current URLs: `/provider/r4HIF35` — not SEO-friendly, not user-friendly
   - **Solution:** Add `slug` column to `olera-providers` with human-readable values generated from `{provider_name}-{state}` (e.g., `accel-at-college-station-tx`). Code supports both slug and provider_id lookups.
1. ~~**Fix 404 handling**~~ ✅ **DONE (2026-03-01)** — Replaced error HTML with `notFound()` in provider page. Now returns proper HTTP 404 with the global not-found page.
2. ~~**Add state abbreviation redirects**~~ ✅ **DONE (2026-03-01)** — Added middleware redirects for:
   - `/{category}/{stateAbbrev}` → `/{category}/{stateSlug}` (e.g., `/assisted-living/fl` → `/assisted-living/florida`)
   - `/{category}/{stateAbbrev}/{city}` → `/{category}/{stateSlug}/{city}`
   - `/{category}/{state}/{city}/page/{n}` → `/{category}/{stateSlug}/{city}` (pagination suffix stripped)

### P1 Fixes — Competitive Advantage

3. **Add FAQPage JSON-LD** — Wire Q&A section data into FAQPage schema. Neither APFM nor Caring.com has this confirmed — adding it makes Olera the only senior care directory with FAQ rich snippets

### P1 Fixes (Do Before DNS Cutover)

4. Add individual Review schema markup
5. Add PriceSpecification/Offer schema
6. Add GeoCoordinates to LocalBusiness
7. Use MedicalBusiness subtype instead of generic LocalBusiness
8. Migrate images to `next/image` (webp, srcset, lazy loading)
9. ~~Add pagination URL migration (`/page/{n}` suffix handling)~~ ✅ **DONE (2026-03-01)** — Handled in middleware alongside state abbreviation redirects
10. Switch alias redirects from 307 → 308 permanent

### P2 Polish (Post-Cutover)

11. Add Person schema for facility managers
12. Add ImageObject schema for gallery images
13. Improve semantic HTML (article, section tags)
14. Complete image alt text coverage
15. Add preconnect/preload resource hints
16. Core Web Vitals audit + optimization

---

## 2. v1.0 Route Inventory (from XFive)

Complete list of every route in Olera v1.0 and its v2 migration status.

### Provider & Browse Pages (Core — Highest Traffic)

| v1.0 Route | Est. Pages | v2 Equivalent | Status |
|---|---|---|---|
| `/provider/{slug}` | ~39,000+ | `/provider/{slug}` | ✅ Done — same URL |
| `/{category}/{state}` | ~300+ | `/{category}/{state-slug}` | ⚠️ **State format changed** (abbrev → full name) |
| `/{category}/{state}/{city}` | ~10,000+ | `/{category}/{state-slug}/{city}` | ⚠️ **State format changed** |
| `/{category}/{state}/{city}/page/{n}` | ~10,000+ | `/{category}/{state-slug}/{city}` | ❌ **Pagination suffix not handled** |
| `/{category}` | 7 | `/{category}` | ✅ Done — aliases handled |

### Editorial Content (Medium Traffic)

| v1.0 Route | Est. Pages | v2 Equivalent | Status |
|---|---|---|---|
| `/caregiver-support` | 1 | `/resources` | ❌ **Redirect not configured** |
| `/caregiver-support/{slug}` | ~66 articles | `/resources/{slug}` | ❌ **Redirect not configured** |
| `/caregiver-support/c/{categorySlug}` | ~6 | `/resources` | ❌ **Redirect not configured** |
| `/caregiver-support/curated` | 1 | `/resources` | ❌ **Redirect not configured** |
| `/caregiver-support/curated/{categorySlug}` | ~6 | `/resources` | ❌ **Redirect not configured** |
| `/research-and-press` | 1 | — | ❌ **No v2 page** |
| `/research-and-press/{slug}` | ~7 | — | ❌ **No v2 page** |
| `/research-and-press/c/{categorySlug}` | ~3 | — | ❌ **No v2 page** |

### Community Features (Medium Traffic)

| v1.0 Route | Est. Pages | v2 Equivalent | Status |
|---|---|---|---|
| `/caregiver-forum` | 1 | — | ❌ **No v2 equivalent** |
| `/caregiver-forum/{topic}` | ~20+ | — | ❌ **No v2 equivalent** |
| `/caregiver-forum/{topic}/{discussion}` | ~100+ | — | ❌ **No v2 equivalent** |
| `/caregiver-forum/*/page/{n}` | many | — | ❌ **No v2 equivalent** |
| `/caregiver-relief-network` | 1 | — | ❌ **No v2 equivalent** |
| `/caregiver-relief-network/favorite-providers` | 1 | — | ❌ **No v2 equivalent** |
| `/caregiver-relief-network/recommended/{slug}` | ~50+ | — | ❌ **No v2 equivalent** |

### Static & Company Pages

| v1.0 Route | Est. Pages | v2 Equivalent | Status |
|---|---|---|---|
| `/company/{slug}` (about) | 1 | — | ❌ **No v2 page** |
| `/pages/{slug}` (privacy, terms) | ~2 | `/terms-of-use`, `/privacy-policy` | ⚠️ Partial — terms redirected, privacy missing |
| `/providers` (for providers landing) | 1 | `/for-providers` | ❌ **Redirect not configured** |

### Auth & Portal (Low SEO Impact — Needs Functional Redirects)

| v1.0 Route | v2 Equivalent | Status |
|---|---|---|
| `/provider-portal/*` | `/portal/*` | ✅ Redirected in next.config.ts |
| `/account` | `/portal` | ❌ **Redirect not configured** |
| `/inbox` | `/portal` | ❌ **Redirect not configured** |
| `/confirm-email` | — | ❌ **No v2 equivalent** |
| `/reset-password` | — | ❌ **No v2 equivalent** |
| `/provider/{slug}/review/{uuid}` | — | ❌ **No v2 equivalent** |
| `/provider/{slug}/request-review/{token}` | — | ❌ **No v2 equivalent** |

---

## 3. DNS Cutover Plan (Zero Downtime)

Based on XFive's guidance + Vercel documentation.

### Current Setup
- **DNS:** Cloudflare (manages `olera.care`)
- **v1.0 hosting:** Vercel project (Ruby on Rails + React, olera.care domain attached)
- **v2.0 hosting:** Vercel project (Next.js 16, currently at `olera2-web.vercel.app` and `staging-olera2-web.vercel.app`)

### Migration Steps (Zero Downtime)

```
Step 1: Verify v2.0 is fully deployed and working on olera2-web.vercel.app
Step 2: Verify Cloudflare DNS proxy is DISABLED (gray cloud) for olera.care records
Step 3: Run: vercel alias set <v2-deployment-url> olera.care
Step 4: Run: vercel alias set <v2-deployment-url> www.olera.care
Step 5: Test olera.care in browser — should serve v2.0
Step 6: Remove olera.care from v1.0 project in Vercel dashboard
Step 7: Add olera.care to v2.0 project in Vercel dashboard
Step 8: Verify SSL certificate issued on new project
Step 9: Trigger a production deployment to confirm auto-aliasing works
```

### Key Gotchas
- **Order matters:** Alias FIRST, then remove from old project, then add to new
- **Use the Automatic URL** (with unique hash, not the project URL)
- **Don't include `https://`** in the alias command
- **Cloudflare proxy must be OFF** (gray cloud) — orange cloud breaks Vercel SSL
- **Handle both apex + www** — run alias for each separately
- **After aliasing, before adding domain:** new deployments won't auto-update the alias

---

## 4. CMS & Editorial Content Migration Strategy

### Current State
- **v1.0 CMS:** Sanity CMS (headless)
- **Content volume:** 66 original articles/videos + 7 research/press articles
- **v2.0 CMS:** Content module exists (`lib/content.ts`) with mock data fallback (`data/mock/resources.ts`)

### Migration Approach (TBD)
- **Option A:** Migrate Sanity content → Supabase (store articles in a new table)
- **Option B:** Keep Sanity as CMS, connect v2 to same Sanity project
- **Option C:** Move to MDX files in the repo (static, no external CMS dependency)

### Content Sections to Migrate
| Section | Articles | CMS Source | v2 Destination |
|---|---|---|---|
| Caregiver Support | ~66 | Sanity | `/resources/{slug}` |
| Research & Press | ~7 | Sanity | `/resources/{slug}` or new section |
| Category landing page content | 7 | Sanity | `/{category}` pages (already have SEO content) |
| Company / About page | 1 | Sanity | New `/about` page needed |

---

## 5. Top Non-Provider v1.0 Pages (Traffic Priority)

> **Action needed:** Export top 100 pages from Google Analytics / Search Console for olera.care, excluding `/provider/*` URLs. This data will tell us which redirects are most critical.

### Likely High-Traffic Non-Provider Pages (Based on URL Structure)
1. `/` — Homepage
2. `/assisted-living` — Category landing
3. `/memory-care` — Category landing
4. `/nursing-home` — Category landing
5. `/home-care` — Category landing
6. `/home-health-care` — Category landing
7. `/independent-living` — Category landing
8. `/assisted-living/fl` — Florida assisted living (high search volume state)
9. `/assisted-living/tx` — Texas assisted living
10. `/assisted-living/ca` — California assisted living
11. `/caregiver-support/*` — Top editorial articles (unknown ranking)
12. `/research-and-press/olera-receives-usd3m-grant-*` — Press coverage
13. `/providers` — For providers landing
14. `/caregiver-forum` — Community forum
15. `/caregiver-relief-network` — Care planner tool

### How to Get Actual Data
```
Google Search Console → Performance → Pages tab
Filter: exclude "/provider/"
Sort by: Clicks (descending)
Export top 100 rows
```

---

## 6. Migration Readiness Checklist

> **Note:** DNS cutover has NOT happened yet. olera.care is still running v1.0. These are pre-cutover fixes ready on the `bold-gates` branch.

### Completed (Pre-Cutover — on `bold-gates` branch)

| Task | Status | Date |
|---|---|---|
| Verify provider slug format compatibility | ✅ Done | 2026-03-01 |
| P0: Fix 404 handling (proper HTTP 404) | ✅ Done | 2026-03-01 |
| State abbreviation URL redirects (51 states × 7 categories) | ✅ Done | 2026-03-01 |
| City page abbreviation redirects (inherits from state redirect) | ✅ Done | 2026-03-01 |
| Pagination URL migration (`/page/{n}` suffix) | ✅ Done | 2026-03-01 |

### Remaining — SEO & Redirects

| Task | Status | Owner | Priority |
|---|---|---|---|
| `/caregiver-support/*` → `/resources/*` redirects | ❌ Not started | Claude + TJ | P1 |
| `/research-and-press/*` redirect strategy | ❌ Not started | TJ (decision) | P1 |
| `/caregiver-forum/*` redirect strategy | ❌ Not started | TJ (decision) | P2 |
| `/providers` → `/for-providers` redirect | ❌ Not started | Claude + TJ | P1 |
| P1 SEO: FAQPage JSON-LD schema | ❌ Not started | Claude + TJ | P1 |
| P1 SEO: Review schema, GeoCoordinates, MedicalBusiness | ❌ Not started | Claude + TJ | P1 |
| P1 SEO: Migrate images to `next/image` | ❌ Not started | Claude + TJ | P1 |
| Switch alias redirects from 307 → 308 permanent | ❌ Not started | Claude + TJ | P1 |

### Remaining — Operations & Content

| Task | Status | Owner | Priority |
|---|---|---|---|
| Export top 100 pages from Search Console | ❌ Not started | TJ | P1 |
| CMS migration strategy decision | ❌ Not started | TJ | P2 |
| Monitor Search Console for 404s / crawl errors | ❌ Not started | TJ | P1 |
| Submit updated sitemap to Google Search Console | ❌ Not started | TJ | P1 |
| P2 SEO polish (Person schema, preload hints, etc.) | ❌ Not started | Claude + TJ | P2 |
| Retire Cloudflare (if only used for Turnstile) | ❌ Not started | TJ + XFive | P3 |
| Retire v1.0 Vercel project | ❌ Not started | TJ | P3 |

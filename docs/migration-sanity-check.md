# Olera v1.0 → v2.0 Migration Sanity Check

> **Status:** In Progress | **Owner:** TJ | **Date:** 2026-03-05
> **Context:** Full audit of migration decisions, comparing v1.0 codebase (olera-fe-experiments + olera-backend) against v2.0 (olera-web). Focused on preserving traffic, SEO rankings, and user flow.

---

## Summary

The migration-playbook.md covers provider pages and editorial content well. This sanity check found **14 redirect gaps** and **7 strategic gaps** — covering provider portal operations, sitemap coverage, category-scoped content URLs, user flow friction, taxonomy inconsistency, and SEO metadata.

---

## Findings

### Critical — Operations (broken links for real users now)

- [ ] **1. Gated provider portal page missing** — `/provider-portal/provider/{slug}/*` URLs used in all provider emails (lead alerts, Q&A, reviews, cold outreach). These are dead links right now. Not indexed, but critical to provider activation funnel. **Assigned to Esther.**

- [x] **2. v1.0 provider auth URLs not redirected** — DONE (PR #152) — `/provider/sign-up`, `/provider/sign-in`, `/provider/forgot-password`, `/provider/resend-activation-link`. These had explicit redirects in v1.0's `next-config/provider-portal-redirects.ts` but weren't carried over to v2.0. Any old emails or bookmarks with these URLs will 404.

- [x] **3. v1.0 provider edit URLs not redirected** — DONE (PR #152) — `/provider/{slug}/preview`, `/provider/{slug}/edit-basics`, `/provider/{slug}/edit-images`, `/provider/{slug}/edit-prices`, `/provider/{slug}/status`. Same situation — v1.0 had redirects for these, v2.0 doesn't.

### High — SEO (will hurt discoverability over time)

- [x] **4. Sitemap missing entire content sections** — DONE — v2.0 sitemap only covers static pages, power pages, and providers. Missing:
  - `/research-and-press/*` articles (v2.0 has these pages live, not just redirected)
  - `/caregiver-support/*` articles
  - `/community/post/*` posts
  - `/waiver-library/*` pages
  - `/benefits` and `/benefits/finder`
  - `/browse/*` pages

- [x] **5. No `generateSitemaps()` for large sitemap** — DONE — With 39K+ providers + power pages + content, the single sitemap.ts could exceed 50K URLs. Next.js won't auto-split without `generateSitemaps()`. v1.0 had this properly segmented (separate sitemaps per content type with pagination).

- [x] **6. Root canonical `"/"` bleeds to dynamic pages** — Already handled (all key pages override with own canonical) — The root layout sets `alternates: { canonical: "/" }`. Dynamic pages (provider profiles, power pages, articles) should override this with their own canonical URL. Without per-page canonicals, Google may treat them as duplicates of the homepage.

### Medium — SEO (edge cases, lower traffic)

- [x] **7. Category-scoped article URLs not redirected** — DONE (PR #152) — v1.0 had `/{category}/caregiver-support/{slug}` (e.g., `/assisted-living/caregiver-support/10-tips-for-families`). These aren't caught by middleware or next.config.ts redirects. Should redirect to `/caregiver-support/{slug}`.

- [x] **8. Category-scoped forum URLs not redirected** — DONE (PR #152) — Same pattern: `/{category}/caregiver-forum/*` (e.g., `/assisted-living/caregiver-forum/daily-care-tips`). Middleware only catches 4-segment provider URLs and state abbreviations, not these.

- [x] **9. `/pages/{slug}` not redirected** — DONE (PR #152) — v1.0 had CMS pages at `/pages/{slug}`. Currently only `/pages/terms` and `/pages/privacy` are handled. Any other `/pages/*` URLs will 404.

- [x] **10. `/caregiver-support/curated/*` not redirected** — DONE (PR #152) — v1.0 had curated article collections at `/caregiver-support/curated` and `/caregiver-support/curated/{category}`. No v2 redirect exists.

### Low — Noted but not urgent

- [x] **11. `/sign-out` not redirected** — DONE (PR #152) — Minor, but old bookmarks will 404.

- [ ] **12. Research & Press is live in v2.0 but redirected to `/`** — `migration-playbook.md` shows `/research-and-press/*` redirecting to homepage, but v2.0 actually has `/research-and-press` and `/research-and-press/[slug]` pages. The redirect in next.config.ts should be removed (it was removed per a comment in the config, but should be verified).

- [ ] **13. Forum content compressed to single URL** — All ~100+ forum discussions redirect to `/community`. If any had backlinks or traffic, that's content equity being funneled into one page. Acceptable trade-off if forum content is being rebuilt in community, but worth monitoring.

- [ ] **14. `/research-and-press/c/{categorySlug}` not redirected** — *Found by OpenAI Codex audit (2026-03-06).* v1.0 had category index pages at `/research-and-press/c/{categorySlug}` (documented in `migration-playbook.md:179`). The old wildcard redirect was removed (`next.config.ts:48,54`), and v2.0 app routes only cover `/research-and-press` and `/research-and-press/[slug]` — no `/c/` segment. These category URLs will 404 after cutover. Fix: add a redirect from `/research-and-press/c/:slug` → `/research-and-press`.

---

## Strategic Gaps (Codex second-pass audit, 2026-03-06)

> These go beyond redirect coverage into site architecture, user flows, and naming consistency.
> Found by OpenAI Codex (gpt-5.3-codex) using the broader "north star" migration prompt.

### Critical

- [ ] **S1. Provider experience split between `/portal/*` and `/provider/*`** — Legacy redirects send providers to `/portal/*` (`next.config.ts:33`), while main nav sends them to `/provider/*` (`Navbar.tsx:549`). `/provider/connections` runs on mock data (`app/provider/connections/page.tsx:8`) while `/portal/connections` is real-data driven (`app/portal/connections/page.tsx:77`). **Action:** Clean up or remove the mock connections page; clarify the two hubs in nav.

### High

- [ ] **S2. Provider creation/claim funnel friction** — `/for-providers/create` redirects to `/onboarding?intent=provider` (`app/for-providers/create/page.tsx:18`), but onboarding logic can leave signed-in/completed users in a non-progressing state or bounce `intent=organization` to `/portal` (`app/onboarding/page.tsx:25-26`). Claim flow uses the organization intent path (`app/for-providers/claim/page.tsx:114`). **Action:** QA the create/claim/organization flows end-to-end; fix edge cases.

- [ ] **S3. SEO canonical inconsistency (extends finding #6)** — Root layout sets global canonical `/` (`app/layout.tsx:34`). Important pages define metadata without canonical overrides: `/browse` (`app/browse/page.tsx:58`), `/team` (`app/team/page.tsx:5`), `/for-providers` (`app/for-providers/page.tsx:11`). **Action:** Add canonical overrides to all key pages.

- [ ] **S4. Trust/legal dead-end links** — Footer links to `/privacy`, `/terms`, `/support` (`Footer.tsx:264`, `SimpleFooter.tsx:13`) only resolve via legacy `/pages/privacy` and `/pages/terms` redirects (`next.config.ts:44,66`). Org schema references missing `/contact` (`app/layout.tsx:83`). **Action:** Create proper pages or ensure redirects resolve cleanly; add `/contact` and `/support` routes.

### Medium

- [ ] **S5. Community runs on mock data** — Community page uses mock post data (`app/community/page.tsx:12`, `data/mock/forumPosts.ts:59`). Post detail has a back link to non-existent `/community/{careType}` (`app/community/post/[slug]/page.tsx:191`). Sitemap omits `/community/post/*` (`app/sitemap.ts:74,132`). **Action:** Fix broken back link; add "coming soon" state or hide from nav if not production-ready.

- [ ] **S6. Taxonomy naming inconsistency across discovery surfaces** — Power pages use `home-health-care` / `nursing-home` (`lib/power-pages.ts:58,46`), while nav/browse/community use `home-health` / `nursing-homes` (`NavMenuData.ts:27,79`, `app/browse/page.tsx:16`). Inconsistent slugs fragment link equity. **Action:** Audit and standardize slugs across power pages, nav, and browse.

- [ ] **S7. High-intent v1 funnels collapsed to homepage** — `/care-assessment`, `/caregiver-relief-network/*`, `/company/*` all redirect to `/` (`next.config.ts:50,77,79`) instead of nearest v2 equivalent. `/care-assessment` → `/benefits/finder` would preserve intent. **Action:** Remap high-intent redirects to their closest v2 task path.

---

## Corrections to migration-playbook.md

Line 340 states: "All v1.0 routes now have redirects configured. No known URL will 404 after DNS cutover."

This is **not fully accurate** based on comparison with v1.0 source code. The following route patterns are missing:

1. `/provider-portal/provider/{slug}/*` (operational — all sub-pages)
2. `/provider/sign-up`, `/provider/sign-in`, `/provider/forgot-password`
3. `/provider/{slug}/preview`, `/provider/{slug}/edit-basics`, etc.
4. `/{category}/caregiver-support/{slug}`
5. `/{category}/caregiver-forum/*`
6. `/pages/{slug}` (beyond terms/privacy)
7. `/caregiver-support/curated/*`
8. `/sign-out`
9. `/research-and-press/c/{categorySlug}` *(found by Codex)*

---

## Implementation Priority

**Session 1 (now):** Items 2, 3, 7, 8, 9, 10, 11 — all simple redirect additions to next.config.ts and/or middleware.ts

**Session 2:** Items 4, 5, 6 — sitemap expansion and canonical tag fixes

**Session 3+:** Item 1 — gated provider portal page (Esther)

**Verify:** Item 12 — check if research-and-press redirect is actually active or already removed

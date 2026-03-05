# Olera v1.0 → v2.0 Migration Sanity Check

> **Status:** In Progress | **Owner:** TJ | **Date:** 2026-03-05
> **Context:** Full audit of migration decisions, comparing v1.0 codebase (olera-fe-experiments + olera-backend) against v2.0 (olera-web). Focused on preserving traffic, SEO rankings, and user flow.

---

## Summary

The migration-playbook.md covers provider pages and editorial content well. This sanity check found **10 gaps** that weren't previously caught — mostly around provider portal operations, sitemap coverage, and category-scoped content URLs.

---

## Findings

### Critical — Operations (broken links for real users now)

- [ ] **1. Gated provider portal page missing** — `/provider-portal/provider/{slug}/*` URLs used in all provider emails (lead alerts, Q&A, reviews, cold outreach). These are dead links right now. Not indexed, but critical to provider activation funnel. **Assigned to Esther.**

- [ ] **2. v1.0 provider auth URLs not redirected** — `/provider/sign-up`, `/provider/sign-in`, `/provider/forgot-password`, `/provider/resend-activation-link`. These had explicit redirects in v1.0's `next-config/provider-portal-redirects.ts` but weren't carried over to v2.0. Any old emails or bookmarks with these URLs will 404.

- [ ] **3. v1.0 provider edit URLs not redirected** — `/provider/{slug}/preview`, `/provider/{slug}/edit-basics`, `/provider/{slug}/edit-images`, `/provider/{slug}/edit-prices`, `/provider/{slug}/status`. Same situation — v1.0 had redirects for these, v2.0 doesn't.

### High — SEO (will hurt discoverability over time)

- [ ] **4. Sitemap missing entire content sections** — v2.0 sitemap only covers static pages, power pages, and providers. Missing:
  - `/research-and-press/*` articles (v2.0 has these pages live, not just redirected)
  - `/caregiver-support/*` articles
  - `/community/post/*` posts
  - `/waiver-library/*` pages
  - `/benefits` and `/benefits/finder`
  - `/browse/*` pages

- [ ] **5. No `generateSitemaps()` for large sitemap** — With 39K+ providers + power pages + content, the single sitemap.ts could exceed 50K URLs. Next.js won't auto-split without `generateSitemaps()`. v1.0 had this properly segmented (separate sitemaps per content type with pagination).

- [ ] **6. Root canonical `"/"` bleeds to dynamic pages** — The root layout sets `alternates: { canonical: "/" }`. Dynamic pages (provider profiles, power pages, articles) should override this with their own canonical URL. Without per-page canonicals, Google may treat them as duplicates of the homepage.

### Medium — SEO (edge cases, lower traffic)

- [ ] **7. Category-scoped article URLs not redirected** — v1.0 had `/{category}/caregiver-support/{slug}` (e.g., `/assisted-living/caregiver-support/10-tips-for-families`). These aren't caught by middleware or next.config.ts redirects. Should redirect to `/caregiver-support/{slug}`.

- [ ] **8. Category-scoped forum URLs not redirected** — Same pattern: `/{category}/caregiver-forum/*` (e.g., `/assisted-living/caregiver-forum/daily-care-tips`). Middleware only catches 4-segment provider URLs and state abbreviations, not these.

- [ ] **9. `/pages/{slug}` not redirected** — v1.0 had CMS pages at `/pages/{slug}`. Currently only `/pages/terms` and `/pages/privacy` are handled. Any other `/pages/*` URLs will 404.

- [ ] **10. `/caregiver-support/curated/*` not redirected** — v1.0 had curated article collections at `/caregiver-support/curated` and `/caregiver-support/curated/{category}`. No v2 redirect exists.

### Low — Noted but not urgent

- [ ] **11. `/sign-out` not redirected** — Minor, but old bookmarks will 404.

- [ ] **12. Research & Press is live in v2.0 but redirected to `/`** — `migration-playbook.md` shows `/research-and-press/*` redirecting to homepage, but v2.0 actually has `/research-and-press` and `/research-and-press/[slug]` pages. The redirect in next.config.ts should be removed (it was removed per a comment in the config, but should be verified).

- [ ] **13. Forum content compressed to single URL** — All ~100+ forum discussions redirect to `/community`. If any had backlinks or traffic, that's content equity being funneled into one page. Acceptable trade-off if forum content is being rebuilt in community, but worth monitoring.

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

---

## Implementation Priority

**Session 1 (now):** Items 2, 3, 7, 8, 9, 10, 11 — all simple redirect additions to next.config.ts and/or middleware.ts

**Session 2:** Items 4, 5, 6 — sitemap expansion and canonical tag fixes

**Session 3+:** Item 1 — gated provider portal page (Esther)

**Verify:** Item 12 — check if research-and-press redirect is actually active or already removed

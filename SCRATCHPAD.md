# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **Homepage Section-by-Section Refactor** (branch: `glad-goodall`) — READY FOR MERGE
  - Phase 1-3 done + Phase 4 polish: NIH badge, community container, CTA redesign
  - PR #79 targeting staging — ready to merge
  - Plan: `plans/homepage-refactor-plan.md`
  - Notion: P1 — "Section-by-Section Homepage Refactor"

- **v1.0 → v2.0 Migration Playbook** (branch: `claude/notion-action-items-1FXqC`) — IN PROGRESS
  - Code phases 1-4 merged (PR #53, branch `swift-faraday`)
  - **Playbook doc:** `docs/migration-playbook.md` — comprehensive SEO report card, route inventory, DNS plan
  - **TODO (next session with Notion MCP):** Paste the SEO report card tables from `docs/migration-playbook.md` into the Notion task "Olera v1.0 → v2.0 Migration Playbook (v2 — Abbreviated)". The tables are ready — just need Notion MCP access to write them.
  - **Key findings from this session (2026-03-01):**
    - Provider page SEO score: 67% (C+) vs APFM 95% (A), Caring.com 82% (B+)
    - P0 gaps: 404 handling (returns 200), FAQPage schema missing, state abbrev redirects missing
    - v1.0 uses 2-letter state abbreviations (`/fl`) — v2 uses full names (`/florida`). ~10,300 pages need redirects
    - v1.0 has 49 route patterns (from XFive CSVs at `glad-goodall` branch: `redirects.csv`, `routes-clean.csv`)
    - Sanity CMS has 66 editorial articles + 7 press articles needing migration
    - DNS cutover: zero-downtime via `vercel alias set` (Cloudflare proxy must be gray cloud)
    - XFive CSVs analyzed: `redirects.csv` (13 internal redirects), `routes-clean.csv` (49 routes)
  - Architecture research archived to `archive/SCRATCHPAD-2026-02.md`

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — IN PROGRESS
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
  - Plan: `plans/provider-deletion-request-plan.md`

---

## Blocked / Needs Input

- **Migration Playbook → Notion:** SEO report card tables are ready in `docs/migration-playbook.md`. Need Notion MCP to write them to the task. TJ will resume this on local machine with MCP access.
- **Top 100 pages from Search Console:** TJ needs to export from Google Search Console (Performance → Pages → exclude `/provider/` → sort by clicks → top 100)

---

## Next Up

1. **Add `hero_image_url` column to `olera-providers`** — needs Supabase migration
2. **Remaining ~2,992 providers without CSV descriptions**
3. **Test Google OAuth end-to-end**
4. **Email notifications** for provider approval/rejection
5. **Community forum flagging** for admin moderation

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-28 | CTA: quiet nudge over teal gradient banner | Strip template blobs, one warm heading, one button — calm confidence over SaaS shouting |
| 2026-02-28 | Community section in unified gray container | Docuseries + flat links felt unbounded; single bg-gray-100 rounded card groups them |
| 2026-02-28 | NIH badge: actual logo, compact, bottom-right hero | Real logo image inverted to white; tight but not cramped spacing |
| 2026-02-28 | Uniform grid over bento for Explore Care | Equal-weight cards feel less template-y; bento asymmetry was visual noise |
| 2026-02-28 | Remove social proof trust strip | Fake numbers add no trust; section added no user value |
| 2026-02-28 | Community as editorial + flat link rows | Perena-style flat rows over boxed cards; docuseries gets hero treatment, community links are quiet and scannable |
| 2026-02-28 | Default care type to Home Care | Most common search intent; was incorrectly defaulting to Home Health |
| 2026-02-28 | Self-host bento images over Unsplash | Remove external dependency; own the imagery |
| 2026-02-28 | BrowseCard (compact 310px) for all homepage cards | More providers in less space; save ProviderCard for browse/search pages |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges |
| 2026-02-26 | Content regression checks beyond git merge-base | Revert→re-apply cycles make commit topology misleading |
| 2026-02-26 | PR merge reports go to Notion | Automated reports for audit trail and team visibility |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-03-01 (Session 26) — v1.0 → v2.0 Migration Playbook

**Branch:** `claude/notion-action-items-1FXqC`

**What:** Deep exploration and documentation of the full migration from Olera v1.0 to v2.0. No code changes — pure research and planning.

**Deliverables:**
- `docs/migration-playbook.md` — 305-line comprehensive playbook with 6 sections
- Provider page SEO report card: 40 elements audited vs APFM & Caring.com
- Complete v1.0 route inventory (49 routes) mapped to v2 equivalents
- DNS zero-downtime cutover plan (from XFive + Vercel docs)
- CMS migration strategy outline (Sanity → TBD)
- Pre/post-cutover readiness checklist (20 tasks)

**Key discoveries:**
- v1.0 state URLs use abbreviations (`/fl`), v2 uses full names (`/florida`) — ~10,300 pages need redirect middleware
- v1.0 has forum (8 routes), relief network (4 routes), editorial content (66 articles) with no v2 equivalents
- Provider page is 67% SEO-complete vs APFM's 95% — main gaps are structured data schemas
- XFive CSV analysis: `routes-clean.csv` (49 routes), `redirects.csv` (13 internal redirects)

**Pending:** Paste SEO report card into Notion (needs MCP access — TJ will do on local machine)

**Commits:** `25f85d3`

---

### 2026-02-28 (Session 25) — Homepage Final Polish & PR

**Branch:** `glad-goodall`

**What:** Final polish pass — NIH badge, community container, CTA redesign. PR #79 ready for merge.

- NIH badge: added actual NIA logo to homepage hero, iterated on size/position/spacing — compact, bottom-right, not distracting
- Community section: wrapped docuseries + flat links in unified `bg-gray-100` rounded container to fix unbounded feel
- CTA section: full redesign — stripped teal gradient + blobs, replaced with white bg, warm human copy ("You don't have to figure this out alone"), single primary button
- Removed `"use client"` from CTASection (no longer needed)

**Files modified:** `components/home/HeroSection.tsx`, `components/home/CommunitySection.tsx`, `components/home/CTASection.tsx`

**Commits:** `57e9550`→`d87e230` (multiple iterations on NIH badge + community + CTA)

---

### 2026-02-28 (Session 24) — Homepage Polish Continued

**Branch:** `glad-goodall`

**What:** Continued Phase 3 polish across all remaining sections. Design taste pass using Perena/Airbnb/Claude principles.

- Hero: shortened subtext, defaulted care type to Home Care, "Find local help" link
- Top Providers: honest heading ("Top-rated" not "near you"), subtitle, mobile scroll fade, skeleton count fix
- Explore Care: bento grid → uniform 3-col card grid with self-hosted images
- Social proof trust strip: removed entirely (no user value)
- Community: rebuilt 3x — final version is editorial docuseries layout + Perena-style flat link rows (Discord, Facebook, Resources, Benefits)
- CTA: unchanged
- Page flow: Hero → Top Providers → Explore Care → Community → CTA

**Commits:** `7f4a1f5`, `6caf6c8`, `cfac6d3`, `eccbeb6`, `407471c`, `3cf75f1`

---

### 2026-02-28 (Session 23) — Homepage Section-by-Section Refactor

**Branch:** `glad-goodall`

**What:** P1 Notion task — broke 1,440-line monolith into composable sections, removed redundancy, reordered flow.

**Commits:** `b5f997a`, `d4dbff7`, `599c7d6`

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_

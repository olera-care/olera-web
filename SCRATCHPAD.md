# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **Homepage Section-by-Section Refactor** (branch: `glad-goodall`) — IN PROGRESS
  - Phase 1 done: monolith broken into 6 composable sections
  - Phase 2 done: social proof simplified to trust strip, page reordered, video + redundant carousel removed
  - Phase 3 in progress: section-by-section polish (hero done, top providers next)
  - Plan: `plans/homepage-refactor-plan.md`
  - Notion: P1 — "Section-by-Section Homepage Refactor"

- **v1.0 → v2.0 Migration** (branch: `swift-faraday`) — IN PROGRESS
  - Phase 1-3 complete. Phase 4: Unified browse+power page architecture
  - Architecture research archived to `archive/SCRATCHPAD-2026-02.md`

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — IN PROGRESS
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
  - Plan: `plans/provider-deletion-request-plan.md`

---

## Blocked / Needs Input

- (none)

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
| 2026-02-28 | Bento grid over tabbed carousel for homepage | Faster intent accelerator — 5 care types at a glance, one click to power page |
| 2026-02-28 | Remove Aging in America video from homepage | Interrupts discovery flow between browse sections |
| 2026-02-28 | BrowseCard (compact 310px) for all homepage cards | More providers in less space; save ProviderCard for browse/search pages |
| 2026-02-28 | Social proof as lightweight trust strip | Heavy animated section (spinning rings, SVG dots) was 167 lines for 3 numbers |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges |
| 2026-02-26 | Content regression checks beyond git merge-base | Revert→re-apply cycles make commit topology misleading |
| 2026-02-26 | PR merge reports go to Notion | Automated reports for audit trail and team visibility |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, SocialProofSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-02-28 (Session 23) — Homepage Section-by-Section Refactor

**Branch:** `glad-goodall`

**What:** P1 Notion task — iteratively improve the care seeker homepage as a structured discovery surface. Broke monolith, removed redundancy, reordered flow, started section polish.

**Phase 1 — Extract sections:**
- `app/page.tsx` reduced from 1,440 → 19 lines (composition of 6 section components)
- Created: `HeroSection`, `TopProvidersSection`, `ExploreCareSection`, `SocialProofSection`, `CommunitySection`, `CTASection` in `components/home/`
- Extracted inline hooks to `hooks/use-in-view.ts` and `hooks/use-animated-counters.ts`
- Removed Aging in America video and redundant BrowseByCareTypeSection tabbed carousel

**Phase 2 — Reorder & consolidate:**
- Simplified SocialProofSection from 167 → 66 lines (trust strip with animated counters, no decorative SVG)
- Reordered page: Hero → Top Providers → Trust Strip → Explore Care → Community → CTA

**Phase 3 — Section polish (in progress):**
- Hero: added value prop subtext + "Not sure where to start?" secondary path to benefits finder
- Top Providers: next

**Commits:** `b5f997a`, `d4dbff7`, `599c7d6`

---

### 2026-02-28 (Session 22) — Care Seeker Hero Redesign

**Branch:** `lively-yalow`

**What:** Redesigned hero to edge-to-edge Zillow-style. Left-aligned bottom-anchored layout, serif heading, single gradient overlay, new hero image (father & son outdoor scene).

**Commits:** `0ef1987`, `6c3bac0`, `f5daacc`, `155cc26`, `11944d6`

---

### 2026-02-27 (Session 21) — Provider Home Page Polish

**Branch:** `shiny-maxwell`

**What:** Iterated on `/for-providers` marketing landing page. Leadership section borders/widths, set-up-profile section unified container.

**Commits:** `b5ea4d6`, `029b146`, `b334769`

---

### 2026-02-26 (Session 20) — Merge Access Lockdown

**Branch:** `neat-morse`

**What:** Locked down merge access — only TJ can merge via GitHub rulesets + `merge-admins` team. Created `MERGE_PERMISSIONS.md`, updated all docs.

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_

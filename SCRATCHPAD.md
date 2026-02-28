# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **v1.0 → v2.0 Migration** (branch: `swift-faraday`) — IN PROGRESS
  - Phase 1-3 complete (SEO infra, power pages, asked questions). PR #53 targeting staging.
  - Phase 4: Unified browse+power page architecture (see below)
  - Notion: P1 — "Olera v1.0 → v2.0 Migration Playbook"

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Transform from narrow mobile wizard → desktop-native Care Planning Console
  - Two-panel layout, persistent sidebar, real-time eligibility preview, transparent scoring
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`
  - Notion: P1 — "Senior Benefits Finder Improvements & Optimizations"

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell` → merged to `staging`) — DONE
  - 9-section marketing landing page at `/for-providers` to convert providers
  - Plan: `plans/provider-home-page-plan.md`
  - Notion: P2 — "Provider home page development"

- **Care Seeker Hero Redesign** (branch: `lively-yalow` → merged to `staging`) — DONE
  - Edge-to-edge hero, left-aligned heading, new image, compact BrowseCards
  - PRs: #77 (hero), #78 (card swap)

- **Off-Click Scroll Regression Fix** (branch: `joyful-panini` → merged to `staging`) — DONE
  - Shared `useClickOutside` hook with blur-before-close pattern
  - Restored Modal.tsx fix lost in Feb 26 reconciliation
  - Plan: `plans/off-click-scroll-fix-plan.md`
  - Notion: P1 — "Off-Click Scroll Regression: Root Cause & Global Fix"

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
  - Port iOS deletion request/approve/deny/restore/purge flow to web
  - Plan: `plans/provider-deletion-request-plan.md`
  - 4 phases: DB migration → Provider portal UI → Admin deletions tab → Polish

- **Admin Provider Directory Editor** (branch: `stellar-hypatia` → merged to `staging`) — DONE
  - Django-admin-style CRUD for 36K+ providers in `olera-providers` table
  - Search, filters, server-side pagination, sectioned edit form, audit logging

---

## In Progress

- [x] Initial project setup
- [x] Provider cards on homepage
- [x] Provider detail page
- [x] Hero section redesign
- [x] Provider card spacing standardization
- [x] Browse page with filtering
- [x] iOS Supabase integration (Phase 1)
- [x] PR #20, #21/#23 merged
- [x] Admin dashboard MVP
- [x] Auth overhaul — unified modal, Google OAuth, post-auth onboarding
- [x] Staging environment
- [x] Design language alignment (teal palette, vanilla bg, serif headings)
- [x] **Provider page smart defaults** — highlights, care services, descriptions inferred from category
- [x] **Description backfill** — 33,631 providers updated from RAG CSV via `scripts/backfill-descriptions.mjs`
- [x] **Image classification** — Vision AI script, admin images page, stock fallbacks
- [x] **Admin provider directory** — full CRUD editor, sidebar restructure, admin links in navbar/portal

---

## Blocked / Needs Input

- (none)

---

## Next Up

1. **Add `hero_image_url` column to `olera-providers`** — referenced in images API but doesn't exist yet; needs Supabase migration
2. **Remaining ~2,992 providers without CSV descriptions** — category fallback covers them, but could RAG-generate real ones
3. **Test Google OAuth end-to-end**
4. **Email notifications** for provider approval/rejection
5. **Community forum flagging** for admin moderation

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-21 | Server-side pagination for directory (not client-side) | 36K+ records — must use Supabase `.range()` with `count: "exact"` |
| 2026-02-21 | Field allowlist for PATCH updates | Explicit `EDITABLE_FIELDS` set prevents injection of unexpected columns |
| 2026-02-21 | `hero_image_url` column doesn't exist on `olera-providers` | Removed from SELECT; detail uses `SELECT *` which handles gracefully |
| 2026-02-26 | Content regression checks needed beyond git merge-base | Revert→re-apply cycles make commit topology misleading; must compare actual file content for critical files |
| 2026-02-26 | PR merge reports go to Notion | Automated reports in Product Development > PR Merge Reports for audit trail and team visibility |
| 2026-02-26 | Smaller, more frequent merges to staging | Avoids big reconciliation sessions when multiple contributors touch shared files |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges that caused regressions (Feb 26 post-mortem) |
| 2026-02-26 | jakub300 keeps org admin | XFive tech lead needs admin for transfer tasks; not in merge-admins so can't merge |
| 2026-02-28 | Shared `useClickOutside` hook for all off-click patterns | Centralizes blur-before-close fix; prevents scroll-to-footer regression class |
| 2026-02-28 | `Modal.tsx` added to critical file watchlist | Blur-before-close fix was silently lost in Feb 26 reconciliation |
| 2026-02-28 | Always rebase PRs branched from `main` onto `staging` before merge | PR #77 carried old code for 4 critical files; rebase resolved cleanly |

---

## Notes & Observations

- Project is a TypeScript/Next.js web app for senior care discovery
- iOS OleraClean design tokens extracted from `/Users/tfalohun/Desktop/OleraClean/OleraClean`
- Key iOS colors: #5AAEC4 (accent), #06B6D4 (accentBright), #F9F6F2 (vanilla bg)
- Slash commands reference iOS patterns in some places — update for web as needed

---

## Session Log

### 2026-02-28 (Session 23) — Hero Redesign Merge + Homepage Card Fix

**Branch:** `lively-yalow` (PR #77), `fix/homepage-browse-cards` (PR #78) — both merged to staging

**What:** Safely merged PR #77 (care seeker hero redesign) via rebase onto staging to preserve autoscroll fix. Then swapped homepage provider cards from ProviderCard to BrowseCard.

**PR #77 merge details:**
- PR branched from `main` (not staging) — Phase 2.5 caught 4 critical regressions (page.tsx, Modal.tsx, Navbar.tsx, FindCareMegaMenu.tsx would have lost autoscroll fix)
- Rebased 6 commits onto staging — applied cleanly, no conflicts
- All critical file checks passed post-merge

**PR #78 (quick follow-up):**
- Homepage "Top providers near you" was using `ProviderCard` (tall, minimal info)
- Swapped to `BrowseCard` (compact with rating inline, amenity tags, pricing) — matches city pages
- Card width reduced from 370px → 310px

**Commits:** `94696cf` (PR #77 merge), `855722d` (PR #78 merge)

---

### 2026-02-28 (Session 22) — Off-Click Scroll Regression Fix

**Branch:** `joyful-panini` | **PR:** #76 targeting staging (merged)

**What:** Fixed global scroll-to-footer regression when dismissing interactive elements. Created shared `useClickOutside` hook and restored Modal.tsx fix lost in Feb 26 reconciliation.

**Root cause:** Browser focus management scrolls to next focusable element when a focused child is removed from the DOM. Footer Discovery Zone has 70+ links → default scroll target.

**Changes:**
- `hooks/use-click-outside.ts` — new shared hook with blur-before-close + `mousedown`
- `components/ui/Modal.tsx` — restored `handleClose()` with blur (lost in reconciliation)
- Migrated 8 components to hook: BrowseFilters, MatchSortBar, BenefitsIntakeForm, Navbar, homepage, onboarding, ConversationList
- Added inline blur to BrowseClient, CityBrowseClient (CSS-class pattern), FindCareMegaMenu (backdrop)
- Standardized all handlers on `mousedown` (was mixed `click`/`mousedown`)

**Commits:** `257fdf0`, `f4a7c38`

---

### 2026-02-27 (Session 21) — Provider Home Page Polish

**Branch:** `shiny-maxwell`

**What:** Continued iterating on `/for-providers` marketing landing page to match Figma mockups. Focused on leadership section and set-up-profile section polish.

**Changes:**
- `components/for-providers/LeadershipSection.tsx` — added `border border-gray-200` to cards, widened container from `max-w-4xl` → `max-w-6xl`, headshot column from `w-36/w-44` → `w-44/w-52`
- `components/for-providers/SetUpProfileSection.tsx` — wrapped form + screenshot in unified `bg-gray-50 rounded-2xl` container (was separate bordered card on white)

**Commits:** `b5ea4d6`, `029b146`, `b334769`

---

### 2026-02-26 (Session 20) — Merge Access Lockdown

**Branch:** `neat-morse`

**What:** Locked down merge access so only TJ can merge PRs to `main` and `staging`. Implemented via GitHub rulesets + org team, downgraded collaborator roles, updated all docs.

**GitHub changes (via API):**
- Created `merge-admins` org team (TJ as sole member)
- Created `main-branch-protection` ruleset (active) — only `merge-admins` can bypass
- Created `staging-branch-protection` ruleset (active) — only `merge-admins` can bypass
- Deleted old classic branch protection on `main`
- Downgraded chantel-stack to org member + repo maintain
- logan447 stays at write (COO, 2nd in charge)
- jakub300 stays at org admin (XFive tech lead, needs admin for transfer tasks)
- Efuanyamekye stays at write

**Final roles:**
| User | Role | Can Merge |
|------|------|-----------|
| tfalohun | admin | Yes (sole merger) |
| jakub300 | admin | No (not in merge-admins) |
| logan447 | write | No |
| chantel-stack | maintain | No |
| Efuanyamekye | write | No |

**Files created/modified:**
- `CLAUDE.md` — added merge permissions section
- `CONTRIBUTING.md` — updated branch protection, Step 8, hands-on Step 7, golden rule
- `docs/GITHUB_SETUP.md` — replaced classic branch protection with rulesets, updated role guidance
- `docs/MERGE_PERMISSIONS.md` — new reference doc (who can merge, how it works, emergency procedure)

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_

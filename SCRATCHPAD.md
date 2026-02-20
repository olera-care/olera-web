# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **Provider Page Design Polish** (branch: `quiet-elion`)
  - Aligning web design language with iOS OleraClean app
  - Hero section redesign: side-by-side gallery + identity "business card"
  - Iterating on spacing, containers, trust signals, visual hierarchy

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
- [ ] **Provider page hero refinement** — fill empty space in identity area

---

## Blocked / Needs Input

_None currently._

---

## Next Up

1. **Hero identity area** — address empty space beside gallery (may need expanded content)
2. **Test Google OAuth end-to-end**
3. **Email notifications** for provider approval/rejection
4. **Community forum flagging** for admin moderation
5. **Update claim flow** — wire `source_provider_id`

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Primary palette: teal/cyan (#06B6D4) replacing green (#319266) | Match iOS OleraClean accent colors |
| 2026-02-20 | Vanilla backgrounds (#F9F6F2) for warm feel | Match iOS oleraVanilla bg |
| 2026-02-20 | Serif font (New York/Georgia) for display headings | Match iOS OleraClean typography |
| 2026-02-20 | Remove white card wrappers from hero and content sections | Reduce "containers within containers" nesting |
| 2026-02-20 | Hero above grid, sidebar starts at Highlights level | Give hero breathing room, sticky sidebar enters at content |
| 2026-02-20 | Olera Score: centered circle + 4 breakdown cards | Match Olera 1.0 Figma rating layout |
| 2026-02-20 | Highlights as 2x2 transparent badges in identity area | Fill dead space, surface trust signals without visual clutter |
| 2026-02-12 | Staging environment: staging branch + Vercel domain + branch protection | Buffer between dev and production |
| 2026-02-10 | Single UnifiedAuthModal replaces 2 modals | Eliminated ~2,000 LOC of duplication |
| 2026-02-10 | Google OAuth primary CTA, auth-first flow | One-click auth is fastest path |

---

## Notes & Observations

- Project is a TypeScript/Next.js web app for senior care discovery
- iOS OleraClean design tokens extracted from `/Users/tfalohun/Desktop/OleraClean/OleraClean`
- Key iOS colors: #5AAEC4 (accent), #06B6D4 (accentBright), #F9F6F2 (vanilla bg)
- Slash commands reference iOS patterns in some places — update for web as needed

---

## Session Log

### 2026-02-20 (Session 13) — Provider Page Design Polish

**Branch:** `quiet-elion`

**Design Language Alignment:**
- Extracted iOS OleraClean design system (colors, fonts, spacing, component patterns)
- Updated `tailwind.config.ts`: teal primary palette, vanilla backgrounds, serif font families
- Updated Notion task (30c5903a) with complete design language documentation
- Commit: `f85fe14`

**Hero Section Iteration (7 commits):**
1. `935593e` — Remove nested containers (white card wrappers → content sits on vanilla bg)
2. `a84c0df` — Match Highlights and Managed By to Olera 1.0 Figma (white cards, unique icons)
3. `04346a6` — Always show 4 highlights, white background cards
4. `c781503` — Move hero above grid, sidebar starts at Highlights level (sticky positioning)
5. `5b8f893` — Replace rating with Olera 1.0 centered score (circle + stars + 4 breakdowns)
6. `a3e7e3a` — Move highlights into hero identity area as 2x2 transparent badges

**Key components added/modified:**
- `HighlightIcon` — maps highlight labels to contextual SVG icons (shield, house, badge, etc.)
- `SaveButton` — added `variant="icon"` and `variant="pill"` props
- `ProviderHeroGallery` — removed shadow, kept compact max-w-md aspect-[3/2]
- Provider page structure: hero (gallery + identity side-by-side) → grid (content + sticky sidebar)

**Current state:** Hero has gallery left + identity right. Identity shows name, context line (category·location·rating), price, address, 2x2 highlight badges, managed by. User noted "too much empty space" — needs further refinement.

---

### 2026-02-12 (Session 12)

**Staging Environment Setup:**
- Created `staging` branch from `main` and pushed
- Updated `CONTRIBUTING.md` with staging workflow, branch strategy, deployment flow
- Created plan: `plans/staging-environment-plan.md`

**Manual steps for TJ:**
- [ ] Vercel: Add staging domain alias linked to `staging` branch
- [ ] GitHub: Add branch protection on `main`

---

### 2026-02-10 (Session 11)

**Auth Overhaul — All 3 Phases Complete:**
- Replaced ~3,000 lines of auth code with ~1,000-line unified system
- Phase 1: `UnifiedAuthModal` with Google OAuth + email-first flow
- Phase 2: Post-auth onboarding inside modal (no separate /onboarding page)
- Phase 3: Cleanup — deleted 6 legacy files, migrated 13 files
- Premium modal UI (Luma/Linear-inspired, Olera hummingbird logo)

---

### 2026-02-09 (Session 10)

**Admin Dashboard MVP:**
- Built full admin dashboard at `/admin` (Overview, Providers, Leads, Team)
- Changed provider claim flow: new claims → `pending` (admin review first)
- Added portal banners for pending/rejected states
- Auth gating via middleware + layout
- Auto-seed: `ADMIN_EMAILS` env var bootstraps master_admin
- SQL migration: admin_users, audit_log tables with RLS

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_

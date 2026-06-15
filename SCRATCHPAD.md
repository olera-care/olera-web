# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Admin Panel 2.0 QA Fixes** (branch: `noble-yalow`) — IN PROGRESS
  - From Apr 7 meeting with Graize & Cecille
  - **Bug fixes**:
    - [x] Fix "Needs Email" counter — added status=pending filter to exclude non-actionable leads
    - [x] Restore delete-reason modal — required free-text reason field, logged in audit
  - **Claims page enhancements**:
    - [x] CSV export for provider claims — new /api/admin/providers/export endpoint + Export CSV button
    - [x] Multi-select + bulk approve/reject/delete on claims — checkboxes, bulk action bar
  - **Provider portal UX**:
    - [x] Fix auto-sign-in from lead notification emails — deferred send now uses `generateNotificationUrl` with `otk` token
    - [x] Provider engagement tracking — added `contact_revealed` event type, tracks email/phone copy clicks
    - [x] Provider unsubscribe/opt-out — `/unsubscribe/[slug]` page, API endpoint, email off-ramp link, send gating
  - **Manual (non-code)**:
    - [ ] Purchase Perplexity AI premium subscription for ops team

- **Senior Benefits Pipeline** (branch: `noble-pare`) — MERGED (PR #502)

- **Aging in America** — SHIPPED (PRs #493-498 merged)

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA

- **Provider Page CTA Conversion Redesign** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW

- **Strict User Account Type Separation** (PR #463) — READY FOR MERGE

- **Staging → Main Promotion** — IN PROGRESS (253 commits audited)

- **SEO: City/Browse Page Optimization** — ANALYSIS COMPLETE, IMPLEMENTATION NEXT

- **Care Seeker Connection Flow De-Jank** (branch: `helpful-euler`) — IN PROGRESS

- **Family Activity Center** (branch: `logical-mahavira`) — IN PROGRESS

- **MedJobs Monetization Proposal** — DONE (Notion doc created, ready for team review)

---

## Blocked / Needs Input

(none active)

---

## Next Up

1. Logan builds Stripe payment integration for MedJobs (Apr 10)
2. Team meeting 8am Eastern (Apr 10) — present monetization proposal
3. Fix provider search/detection (franchise chains, city filter)
4. MedJobs candidates detail page taste pass
5. Run benefits pipeline on FL + CA → compare patterns across 3 states
6. Seed TX: `/api/admin/seed-sbf-programs?state=TX&confirm=true`
7. SEO city-specific content sections
8. Merge PR #463 (user account separation)
9. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Exploration before taxonomy | 5-shape taxonomy derived from 12 TX programs was too small a sample. Pipeline observes what data exists, taxonomy emerges from patterns across states. |
| 2026-04-06 | Pipeline auto-generates dashboard data | `pipeline-summary.ts` is auto-written after each run. No manual step between pipeline and dashboard. |
| 2026-04-06 | Dashboard shows pipeline findings inline, not in separate view | Pipeline diffs appear as amber warnings on program rows. Dashboard stays a quality lens, not a pipeline viewer. |
| 2026-04-06 | No Airtable — AI-first workflow with admin viewer | Provider data uses Supabase + Claude directly. Benefits follows same pattern. Problem was viewing, not editing. |
| 2026-04-06 | Empty string for free-service savingsRange | UI renders "Save {savingsRange}" — empty string = badge hidden. Free-service info lives in savingsSource. |
| 2026-04-06 | Verification gate: no state goes live without verification | YMYL content — Google can suppress the whole domain for inaccurate benefits info. |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail strips params named "token". |
| 2026-03-25 | Quick discovery mode (3 terms/category) sufficient for batch | Standard mode costs 4x more but yields mostly duplicates. |
| 2026-04-09 | MedJobs monetization: $49/mo after 1 free interview | Lowest friction for small providers. Scarce asset is candidates, not attention. Free first interview de-risks unproven supply quality. |
| 2026-03-24 | Highlights are earned, not defaulted | Users see through templated labels. 1 verified fact > 4 defaults. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Benefits data: 528 programs across 50 states in `data/waiver-library.ts` (11,664 lines)
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — TX audit CSV + accuracy docx
- Notion strategy docs: "Benefits: Turning Traffic into Platform Users" + "Benefits Data: Getting It Right Before We Scale"
- Waiver library pages auto-generate via `generateStaticParams` — adding programs = pages on deploy
- Texas has special SEO routes at `/texas/benefits/`, other states at `/waiver-library/{state}/`
- Pipeline reference: `scripts/pipeline-batch.js` (city pipeline, 1322 lines)
- Michigan pipeline findings: PACE age wrong (65→55), SNAP age wrong (65→60), Ombudsman has fake savings, 4 source URLs missing, 5 data fields model can't capture (asset_limits, regional_variations, waitlist, documents_required, household_size_table)

---

## Session Log

### 2026-04-09 (Session 70) — MedJobs Monetization Strategy

**No code changes — strategy/research session**

**Context:** Morning meeting with Logan & Esther on provider onboarding, staffing, and questions. Key data: 75 questions/day (15x increase), 7 provider responses in one day — first real two-way marketplace signal.

**Monetization proposal developed through iterative discussion:**
- Started with tiered subscription → TJ pushed for lower friction
- Moved to pay-per-interview ($15-25 each) → simplest transaction
- Considered bundles of 5 to absorb candidate quality variance
- TJ cut through: one price, no tiers → **$49/mo unlimited after 1 free interview**
- Free first interview de-risks unproven candidate quality
- If bad candidate on free trial, provider can email support for another credit

**Competitive justification (scarce asset framework):**
- Indeed/Monster: scarce = employer attention → PPC model
- LinkedIn: scarce = candidate attention → expensive subscriptions
- ZipRecruiter: scarce = matching → AI subscription
- **Olera: scarce = the candidates themselves** → gate access to them

**Notion doc created:** [MedJobs Monetization Proposal](https://www.notion.so/33d5903a0ffe8115800bcdef0d642f58) under today's meeting notes

**Action items from meeting:**
- TJ: payment model research (done) + fix provider search/detection
- Esther: debug/stabilize staffing feature for QA
- Logan: QA audit today, build Stripe payment integration tomorrow
- Team meeting tomorrow 8am Eastern

### 2026-04-07 (Session 69) — Admin Panel 2.0 QA Fixes

**Branch:** `noble-yalow` | **From Apr 7 meeting with Graize & Cecille**

**Bug Fixes:**
- Fixed "Needs Email" counter: added `status=pending` filter to exclude non-actionable leads
- Restored delete-reason modal: required free-text reason, logged in audit trail

**Claims Page Enhancements:**
- CSV export via `/api/admin/providers/export` + Export CSV button
- Multi-select with checkboxes + bulk approve/reject/delete bar
- Bulk API endpoints: PATCH + DELETE on `/api/admin/providers`

**Provider Portal UX:**
- Fixed auto-sign-in: deferred lead emails now use `generateNotificationUrl` with `otk` token
- Added `contact_revealed` event tracking on email/phone copy buttons
- Built unsubscribe flow: `/unsubscribe/[slug]` page + API + email link + send gating

### 2026-04-06 (Session 68) — Senior Benefits Data Quality System

**Branch:** `noble-pare` | **7 commits pushed**

**Scope:** End-to-end benefits data quality system — from data model through pipeline to admin dashboard.

**Phase 1 — Foundation:**
- Added verification metadata fields to `WaiverProgram` + `BenefitProgram` types
- SQL migration for `sbf_state_programs` + `sbf_federal_programs`
- Ingested Chantel's TX audit: 12 programs corrected (income limits, savings, sources)
- Self-review caught 4 bugs before TJ tested: "Save Free service" UI, FAQ/step content inconsistencies, badge overflow

**Phase 2 — Admin Dashboard:**
- Built `/admin/benefits`: state grid → program detail → content preview
- Deep links to live waiver library pages
- Sidebar link under Operations
- Key design choice: viewer not editor — AI edits data, humans review visually

**Phase 3 — Pipeline v1 (abandoned):**
- Built rigid 5-phase pipeline (discover → verify → generate → QA → finalize)
- Michigan test: 20 programs found but QA gate was meaningless (Perplexity self-assessment, not real verification)
- TJ challenged: "we can do better" — pipeline was doing generic research, not targeted verification

**Phase 4 — Pipeline v2 (exploration-first):**
- Rebuilt as explore → dive → compare → report
- Open-ended questions ("what matters for this program?") instead of predetermined forms
- Compare phase cross-references against existing data with normalized name matching
- Produces 765-line markdown report for human review
- Auto-generates `pipeline-summary.ts` for dashboard

**Phase 5 — Dashboard + Pipeline integration:**
- State cards show pipeline status (explored date, issues found)
- Program rows show inline diffs with amber warnings
- Pipeline summary auto-generated after each run

**Key pivot:** Abandoned predetermined 5-shape taxonomy. Taxonomy comes after exploration across multiple states, not before. "We need enough humility to grant this could be the beginning of the right approach."

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **Merged via PRs #493-498**

- Full AIA migration: dark cinematic index + episode detail pages
- YouTube IDs confirmed, hero image, sitemap, thumbnail fallback

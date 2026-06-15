# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Admin Panel 2.0 QA Fixes** (branch: `noble-yalow`) — SHIPPED TO PRODUCTION (PRs #504-#510)
  - From Apr 7 meeting with Graize & Cecille — all action items complete + extras
  - **Bug fixes**: delete-reason modal, exclude archived+rejected from Q&A Needs Email
  - **Claims page**: CSV export, multi-select, bulk approve/reject/delete
  - **Provider portal UX**: auto-sign-in otk tokens, engagement tracking, unsubscribe flow, dashboard email prefs toggle
  - **Questions page**: pagination, date filter, server-side search bar
  - **Engagement tracking**: leads page 3-dot indicators, Activity Center labels/filters/email clicks, migration 036 run
  - **Production promoted**: PR #508 (120 commits), PR #510 (email clicks filter)

- **Senior Benefits Pipeline** (branch: `noble-pare`) — MERGED (PR #502)

- **Aging in America** — SHIPPED (PRs #493-498 merged)

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA

- **Provider Page CTA Conversion Redesign** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW

- **Strict User Account Type Separation** (PR #463) — READY FOR MERGE

- **Staging → Main Promotion** — DONE (PR #508, 120 commits promoted Apr 7)

- **SEO: City/Browse Page Optimization** — ANALYSIS COMPLETE, IMPLEMENTATION NEXT

- **Care Seeker Connection Flow De-Jank** (branch: `helpful-euler`) — IN PROGRESS

- **Family Activity Center** (branch: `logical-mahavira`) — IN PROGRESS

---

## Blocked / Needs Input

(none active)

---

## Next Up

1. **Test provider auto-sign-in end-to-end** — otk tokens verified in email logs, needs click-through test
2. **Bulk approve notifications** — bulk PATCH doesn't send provider emails/Slack (single approve does). Add if needed.
3. **Purchase Perplexity AI premium** for Graize & Cecille (manual — non-code)
4. Run benefits pipeline on FL + CA → compare patterns across 3 states
5. Seed TX: `/api/admin/seed-sbf-programs?state=TX&confirm=true`
6. MedJobs candidates detail page taste pass
7. SEO city-specific content sections
8. Merge PR #463 (user account separation)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-07 | Leads Needs Email counter was correct at 52 | Attempted `status=pending` filter, dropped to 8. TJ confirmed 52 was right — those are all actionable leads. Reverted. |
| 2026-04-07 | Exclude archived from Q&A Needs Email, not from Leads | Archived questions with stale `needs_provider_email` flags clutter the ops queue. Leads don't have this problem. |
| 2026-04-07 | Pagination over higher limits | Q&A hit 74 items in 2 days. At current growth, 200 limit would be hit fast. Pagination scales indefinitely. |
| 2026-04-06 | Exploration before taxonomy | 5-shape taxonomy derived from 12 TX programs was too small a sample. Pipeline observes what data exists, taxonomy emerges from patterns across states. |
| 2026-04-06 | Pipeline auto-generates dashboard data | `pipeline-summary.ts` is auto-written after each run. No manual step between pipeline and dashboard. |
| 2026-04-06 | Dashboard shows pipeline findings inline, not in separate view | Pipeline diffs appear as amber warnings on program rows. Dashboard stays a quality lens, not a pipeline viewer. |
| 2026-04-06 | No Airtable — AI-first workflow with admin viewer | Provider data uses Supabase + Claude directly. Benefits follows same pattern. Problem was viewing, not editing. |
| 2026-04-06 | Empty string for free-service savingsRange | UI renders "Save {savingsRange}" — empty string = badge hidden. Free-service info lives in savingsSource. |
| 2026-04-06 | Verification gate: no state goes live without verification | YMYL content — Google can suppress the whole domain for inaccurate benefits info. |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail strips params named "token". |
| 2026-03-25 | Quick discovery mode (3 terms/category) sufficient for batch | Standard mode costs 4x more but yields mostly duplicates. |
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
- Provider engagement data: 23 email_click events exist as of Apr 7 — providers ARE clicking email links. Activity Center can now filter by email clicks, contact copies, and auto sign-ins.

---

## Session Log

### 2026-04-07 (Session 69) — Admin Panel 2.0 QA Fixes

**Branch:** `noble-yalow` | **12 commits pushed** | **TJ tested + approved on Vercel preview**

**From Apr 7 meeting with Graize & Cecille** — 7 action items from the Admin Panel 2.0 QA call + iterative fixes from TJ testing.

**Bug Fixes:**
- Restored delete-reason modal: `ConfirmDeleteDialog` now requires free-text reason, passed to API audit log
- Excluded archived + rejected questions from Needs Email view + counter (stale `needs_provider_email` flags)
- Fixed 500 error: `.not("status","in",...)` PostgREST syntax doesn't work with Supabase JS client → used chained `.neq()` calls
- Note: Leads counter (52) was correct — attempted `status=pending` filter dropped it to 8, reverted

**Claims Page Enhancements:**
- CSV export via `/api/admin/providers/export` + "Export CSV" button (respects active tab filter)
- Multi-select with checkboxes + bulk approve/reject/delete bar
- Bulk API endpoints: PATCH + DELETE on `/api/admin/providers`
- Confirmation dialog on bulk delete (caught in self-review — was firing without confirmation)

**Provider Portal UX:**
- Fixed auto-sign-in: deferred lead emails (`add-email` route) now use `generateNotificationUrl` with `otk` token (was sending bare `/provider/connections` URL). Same fix for questions `add-email`.
- Added `contact_revealed` event tracking on email/phone copy buttons in lead detail drawer
- Built provider unsubscribe flow: `/unsubscribe/[slug]` page, `/api/providers/unsubscribe` API, "Unsubscribe from leads" link in email off-ramp, send gating in connection request + deferred send paths
- Added email preferences toggle to provider dashboard — card at bottom of `/provider` with on/off switch, reads/writes same metadata flag, API extended to support resubscribing

**Questions Page Improvements (from TJ testing feedback):**
- Added pagination (50 per page, Previous/Next buttons) — Q&A hit 74 items in 2 days
- Added date filter: preset chips (All time, Today, Yesterday, Last 7 days, Last 30 days) + custom date picker
- API now accepts `date_from`/`date_to` params
- Added server-side search bar — Graize couldn't find providers across paginated pages with Ctrl+F. Now searches by provider name across all pages via API.

**Engagement Tracking Visibility (PRs #506, #507):**
- Leads page: 3-dot engagement indicators per provider (blue=email clicked, amber=lead opened, green=contact copied)
- Activity Center: labels/colors/filters for contact_revealed, one_click_access, lead_opened events
- Activity API: fixed filter to use event_type for non-email events
- Migration 036: added contact_revealed + one_click_access to provider_activity CHECK constraint (run on Supabase)
- Bug found: contact_revealed events were silently failing due to DB CHECK constraint — fixed by migration

**Email Clicks Filter (PR #509, promoted PR #510):**
- Added "Email clicks" filter option to Activity Center providers dropdown
- Verified 23 email_click events already existed in database — tracking was working, UI filter was missing
- Email clicks track all types: lead emails (connection_request), question emails (question_received), review emails (new_review)

**Production Promotions:**
- PR #508: 120 commits staging→main (all Admin Panel 2.0 work)
- PR #510: email clicks filter (2-line change)
- Critical file verification: all indicators intact
- Notified Graize in Slack #provider-outreach about the search bar fix

**Key files:**
- `app/admin/leads/page.tsx` — delete-reason modal
- `app/admin/providers/page.tsx` — multi-select, bulk actions, CSV export, delete confirmation
- `app/api/admin/providers/route.ts` — bulk PATCH/DELETE endpoints
- `app/api/admin/providers/export/route.ts` — new CSV export
- `app/api/admin/leads/route.ts` — delete reason in audit log
- `app/api/admin/leads/add-email/route.ts` — otk token + unsubscribe check
- `app/api/admin/questions/route.ts` — date filter params, archived exclusion from needs_email
- `app/api/admin/questions/add-email/route.ts` — otk token
- `app/admin/questions/page.tsx` — pagination + date filter UI
- `app/provider/connections/page.tsx` — contact_revealed tracking
- `app/api/activity/track/route.ts` — contact_revealed event type
- `app/api/connections/request/route.ts` — unsubscribe check before sending
- `lib/email-templates.tsx` — unsubscribe link in off-ramp
- `app/unsubscribe/[slug]/page.tsx` — new unsubscribe page
- `app/api/providers/unsubscribe/route.ts` — new unsubscribe API
- `app/api/admin/activity/route.ts` — event_type filter fix for new events
- `app/admin/activity/page.tsx` — new event labels/colors/filter options
- `components/provider-dashboard/DashboardPage.tsx` — email preferences toggle card
- `supabase/migrations/036_add_engagement_event_types.sql` — CHECK constraint update

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

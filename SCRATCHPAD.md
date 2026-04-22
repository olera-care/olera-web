# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-04.md`

---

## Current Focus

### 2026-04-22 — Provider Analytics Phase 0 (instrumentation) — Phase 0A SHIPPED, 0B in progress

Multi-session, multi-week initiative. Strategy doc and plan are the source of truth — read those first when resuming, not this scratchpad entry.

**Strategy doc (Notion):** https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
**Phase 0 plan:** `plans/provider-analytics-phase-0-instrumentation-plan.md`
**Branch:** `feature/provider-analytics-phase-0` (pushed; no PR yet — TJ testing on Vercel preview first)
**Vercel deployment dashboard:** https://vercel.com/olera/olera-web/Fuy72nNEeFGQSamv2ny553qhCMhN

**The arc:** Replace the post-notification "Get more reviews" CTA with a use-first provider-facing analytics experience. Phase 0 is instrumentation only — no UI. Data needs ~2-3 weeks of real accrual before Phase 1 (dashboard + onboard teaser card) can ship credibly.

**Phase 0A — SHIPPED to branch (commit `3c5c011f`).** Migrations 044 + 045 already applied to shared Supabase by TJ. What's wired:
- Anonymous `actor_type` branch on `/api/activity/track` with `isbot` filter, referrer sanitization, UA classification
- Client-side `<ViewTracker />` mounted on `app/provider/[slug]/page.tsx` (must be client because page is RSC + ISR)
- Server-side writers for `lead_received` (3 sites), `review_received` (2 sites). `question_received` was already wired pre-Phase-0.
- `cta_click_public` on Save button; TODOs for Contact/Phone/Share in bigger components
- `search_click` on `BrowseCard` with path-segment-based source inference
- Anonymous `olera_session` cookie (UUID, 30d sliding TTL, no PII)
- All event writers normalized on URL slug as `provider_id` so rows aggregate correctly

**Pre-test review (`/pre-test`) caught 4 real bugs**, all fixed before push. Most critical: identifier mismatch — UUID vs slug across writers — would have broken aggregation.

**Phase 0B — In progress.**
- ✅ Task 10: Aggregation cron at `app/api/cron/aggregate-provider-views/route.ts`. Vercel cron entry added (`0 8 * * *`). Supports `?date=YYYY-MM-DD` override and `?dry_run=true` for ops.
- ⏭ Task 11: `/admin/analytics` sanity-check view (NEXT — this is the testing surface TJ wants instead of SQL queries)
- ⏭ Task 12: Privacy review pass
- ⏭ Task 13: `lib/analytics/PHASE_1_TODO.md`
- ⏭ Task 14: PR + merge

**Most important deferred question (Phase 3+):** What is Olera's L3 / monetizable layer? "What are our blocks providers are eager to use in a playground?" — explicitly NOT solved here, captured in strategy doc as the highest-priority open question.

**Watch for on resume:** if I'm mid-stream on Phase 0B, next step is `/admin/analytics` page — sections in plan task 11. Reuse the `<PulseHeader />` pattern from the recent admin pulse work (PR #616) and `lib/admin-stats.ts::buildSeries()` bucket helpers. Use `select("*")` for admin reads per memory.

---

### 2026-04-21 → 2026-04-22 — 176-city expansion batch complete

176-city senior-care provider expansion. Ran end-to-end via `/city-pipeline`. No code changes — DB + Notion writes only.

**Final stats:**
- 170/176 cities loaded with providers; 6 empty (Holtsville NY, Hampton PA, Penn PA, Burke Centre VA, Bethpage NY, Weston WI — all survived 0 providers after keyword + AI classify + Perplexity entity verification + dedup)
- 3,655 active providers inserted (from 30,304 discovered → 5,754 post-classify → 2,099 soft-deleted by trust-signal entity verification)
- Enrichment: 5,751 descriptions, 1,824 trust signals confirmed, 4,836 review snippets, 4,044 images
- Cost: $386.57 (11,807 Google + 1,750 Perplexity calls)
- Wall time: ~9h15m (discovery 1h25m → clean 3h50m → load 45m → enrich 2h40m → finalize 5m)
- Pipeline logs: `/tmp/pipeline-all.log`, `/tmp/discovery-2026-04-21.log` (both will rotate)

**Data quality (verified via subagent spot-check during enrich):**
- 0 null place_ids, 0 bad categories, 0 out-of-state coordinates, 0 LLC/Inc/Corp suffixes
- Fixed 1 edge case: `vail-az-0005` had " LLP" suffix — stripped post-enrichment
- Name Check regex in pipeline doesn't catch LLP — consider adding for future batches

**Why clean took 3h50m (not "~5 min" per skill):** pooled AI classify ran on 30,304 providers (batch of 80 at a time × ~380 API calls × seconds each + retries). Skill's estimate was based on smaller batches. Expect proportional scaling on future big batches.

**Notion:** all 176 pages flipped "Upload to Backend" → "Complete" via subagent (14 Done boxes checked except "Fetch Email & Contact Info" per skill convention).

**Followups (low priority, carry forward):**
1. **ND/SD not in Notion State select** — Jamestown ND, Mitchell SD, Yankton SD got pages without State value. Add ND/SD options when convenient.
2. ~~**Stale Notion pages in "Discovery" status**~~ — CLEANED UP 2026-04-22. 128 stuck pages audited against Supabase: 127 flipped to Complete (100 from 2026-04-02 bulk seed + 16 more from same batch + 12 from 2026-04-15 184-city batch subagent misses). Port St. John, FL (0 providers after filters) soft-archived.
3. **6 empty cities** — safe to remove from expansion map as "verified empty" (no senior-care providers after all filters).
4. **Live-site check at end showed 5 FAILs** — cosmetic ISR cache warming noise per skill docs, not real failures. Pages will work after ISR warms (~1hr).

---

### 2026-04-21 — Admin Pulse Header (Questions + Leads)

**Branch:** `glad-pare` (tracks `origin/glad-pare`, no PR to `staging` yet — TJ has more feedback to land first)
**Head:** `540825b3`

Built a "pulse header" for `/admin/questions` and `/admin/leads`:
- Title + KPI ("X needing email") + delta line + full-width interactive chart
- Single date-range popover button (7 presets + custom from/to) replacing the old 3-row filter chrome
- Tabs, search, list, inline email form, archive/delete flows untouched

**Files created:**
- `lib/admin-stats.ts` — bucket helpers (hour/day/week/month auto-pick)
- `app/api/admin/questions/stats/route.ts` — returns `{ total, delta, series, bucket }`
- `app/api/admin/leads/stats/route.ts` — same shape
- `components/admin/DateRangePopover.tsx` — single-button popover with presets + stacked From/To custom range
- `components/admin/PulseHeader.tsx` — title/KPI/delta/sparkline + Y-axis max label + gridline + hover tooltip

**Files modified:**
- `app/admin/questions/page.tsx` — integrated PulseHeader, removed old header + filter chrome
- `app/admin/leads/page.tsx` — same

**Iteration log (why this took 8 commits):**
1. `6c9e9a34` — initial 48px sparkline — "looked bad"
2. `d4eded07` — width bug (ResizeObserver never attached) + empty-state bug (`Math.max(1, …)` masked all-zero case)
3. `382a49da` — height 140→180, padding 22px, UTC label formatting to fix Apr 13/14 off-by-one
4. `1811ac49` — added max-value label + dashed gridline at ceiling so peaks read as "at max" not "clipped"
5. `bb2bbddc` — tried hardcoded Y-max at 120 (TJ asked)
6. `10b95517` — TJ pushed back: hardcoded ages badly. Replaced with `niceCeiling()` auto-scale (1.5x → round up to 1/1.5/2/2.5/3/4/5/6/8/10 × 10^n). Added 90ms ease-out CSS transitions on SVG hover elements + row action slide-in translate.
7. `d1cee83a` — **semantic split**: KPI shows needs-email count (time-bounded), chart shows ALL question volume. Single DB query, two metrics computed in memory.
8. `540825b3` — **linear interpolation** (dropped Fritsch-Carlson monotone cubic). Smooth curves created "upward inflection" illusion — user read intermediate Bezier y-values as data that didn't exist. Also bumped niceCeiling 1.5x → 1.75x for peaks in 40-55% zone. Default range "all" → "30d". Stroke 1.75→2.

**Design decisions locked in:**
- **Chart ≠ KPI** intentionally. KPI is action queue (needs-email). Chart is platform pulse (all activity). Two metrics on one card — contextualizes the number with volume context.
- **Linear over smooth.** Monotone cubic's S-shape between discrete daily buckets visually implies intermediate values that don't exist. Linear = most honest read of time-series. Matches Linear / Stripe / Datadog.
- **Nice-number Y-axis**, not fixed. Hardcoded ceilings don't age with growth. `niceCeiling(realMax)` rounds up to clean steps with 1.75x headroom → peaks always at 40-55% of chart.
- **Server buckets UTC days**, labels formatted in UTC to match. Admin chart represents UTC-day windows; admin user understands this.
- **Date range popover > multi-row chips.** One button, one popover. Presets list (all/today/yesterday/7d/30d/90d/1y) + stacked custom From/To at bottom of dropdown. Widened from w-72 to w-80 so From/To inputs don't overflow.

**Hover feel:**
- Chart hover dot + crosshair + tooltip all smooth-follow (90ms ease-out on SVG cx/cy/x1/x2 and HTML left/top)
- Row action buttons (Archive/Remove/Delete) slide in 4px from right on row hover (translate-x-1 → translate-x-0 + opacity, 200ms)
- Popover still hard appears — low priority

**Known cross-page inconsistency (not fixed):**
- Admin overview card "Needs Email: X" is all-time count
- `/admin/leads?tab=needs_email` now opens at last-30-days default
- Numbers will differ between the two views
- Fixes: either scope the overview card to 30d, or pass `?range=all` when navigating from overview. Awaiting TJ's call.

**Other known limits (not bugs today):**
- `.limit(50000)` with `ascending: true` means if platform ever has >50k questions/leads, we'd fetch the oldest 50k and miss recent. Olera is at ~1300 questions. Non-issue.
- Chart first-hover pops in instantly (no fade-in). Subsequent moves smooth. Acceptable.

**TJ said "I have a few things to add"** — next feedback loop incoming. Pausing here.

---

### 2026-04-20 (evening) — Benefits review workflow operational + 3 FL programs shipped

**End-of-day state. Post-compact continuation notes at the bottom.**

**5 PRs merged to staging today (in order):**
- **#602** FL SNAP remediation + Notion-based review workflow introduced (`335f9a8a`)
- **#605** FL Weatherization (WAP) remediation (`f1dcc31b`)
- **#606** Removed "Check if you qualify" widget globally (`37a6895d`)
- **#607** System-wide "your parent" → "your loved one" framing sweep, ~7,900 replacements across 51 states + waiver-library (`9a65c34e`)
- **#608** FL SMMC-LTC remediation + TJ attribution (`5c01f15d`)

Staging head: `5c01f15d`.

### Benefits review workflow — NOW OPERATIONAL

Pivoted from the original state-row queue model to two program-level queues. Admin dashboard demoted to read-only auditor's viewer; reviewers compose findings in Notion Audit Results pages.

**Notion DBs (IDs load-bearing for post-compact resume):**
- **Program Review Queue** — `https://www.notion.so/fb03b87a9918460086ae728ee879b9e2` — data source ID `035ff597-d5ff-4813-b744-6f717e77dbe0`
  - 14 FL program rows seeded (FL SNAP/WAP/SMMC-LTC = Approved; 11 others open)
  - 50 other states NOT seeded yet (decision: seed JIT as TJ begins auditing each state)
  - Columns: Program · State · Program Type · Severity · High-Sev/Total Flags · Flagged Fields · Reviewer · Status · 5 checkboxes (Numbers/Phones/URLs/Tone/FAQ fact-checked) · Live Page · Admin · Source URL · Program ID
  - Row titles always prefixed with state: `FL — SNAP (Supplemental Nutrition Assistance Program)`
- **State Overview Review Queue** — `https://www.notion.so/5c2c64faee88488eac7d04e620891f42` — data source ID `746f7dd0-edde-4e47-b342-24287aac7c03`
  - All 51 states seeded (TX pre-marked Approved — Chantel's March review)
  - 6 checkboxes (Overview copy / Start-here / ByNeed / Quick facts / Cross-program consistency / Tone)
- **Process Guide** — `https://www.notion.so/3475903a0ffe81d0a4ddecf27a6a3fae` — updated to reflect new workflow
- **Old Tier 1 Queue** — renamed to "Benefits QA — Tier 1 Review Queue (LEGACY)" with description pointing to new queues
- **PR Merge Reports parent** — `3135903a-0ffe-81e1-bee6-c3cdabd61965` (publish reports here after every merge)

**Reviewer attribution (critical):**
- `data/benefits-verifiers.ts` — per-program `PROGRAM_VERIFIERS` registry. After each audit, add `"fl:program-id": { slug: "tj-falohun", reviewedAt: "YYYY-MM-DD" }` to surface "Reviewed by TJ Falohun" byline instead of default Dr. DuBose.
- Currently attributed to TJ: `fl:snap-food-benefits`, `fl:weatherization-assistance-program`, `fl:smmc-ltc-hcbs-waivers`
- `getProgramVerifier()` reads this; UI renders in `ProgramPageV3.tsx` byline.

### FL audit progress

| Program | Status | Notion row |
|---------|--------|-----------|
| SNAP | Approved (PR #602) | `3485903a-0ffe-81de-afe2-c1011ca8dea2` |
| Weatherization | Approved (PR #605) | `3485903a-0ffe-816a-a538-c95fdc8f4870` |
| SMMC-LTC | Approved (PR #608) | `3485903a-0ffe-8143-9de2-e471b25af74b` |
| SMMC-LTC Medicare Savings | Not Started | `3485903a-0ffe-81b7-b512-c5fc816d7c9d` |
| PACE | Not Started | `3485903a-0ffe-8177-b56c-e70577ec587d` |
| LIHEAP | Not Started | `3485903a-0ffe-8107-93a9-d9ec605960a8` |
| SHINE | Not Started | `3485903a-0ffe-8142-ab97-de2f71a95bb0` |
| Meals on Wheels | Not Started | `3485903a-0ffe-8161-96d9-cde3df46f57a` |
| ADI Respite | Not Started | `3485903a-0ffe-8185-bd07-ebc30441a576` |
| SCSEP | Not Started | `3485903a-0ffe-81cd-b465-c4ad4fb0ab73` |
| Legal Aid | Not Started | `3485903a-0ffe-8100-a74d-c6823abf64c5` |
| HCE | Not Started | `3485903a-0ffe-8179-b2f4-ee51aee6ace9` |
| CCE (phone flag) | Not Started | `3485903a-0ffe-815f-8bcd-ec210e84a2bf` |
| Elder Options | Not Started | `3485903a-0ffe-811f-ba4d-fd023994e0a7` |

### Workflow conventions locked in this session

- **Audit flow:** TJ audits live page against pre-verified facts I stage in the Notion row → logs findings in Audit Results H2 with issue-type subsections (Numbers / Links / Phone / Copy / Structure / FAQs) → I process into drafts.json → regen drafts.ts → PR → /pr-merge → publish Notion report to PR Merge Reports
- **Pre-verification pattern:** before TJ audits, I pull .gov sources and pre-populate "Pre-verified facts" section at top of each Notion row with income/asset/age/phone/URL/agency data as ground truth
- **Copy rules TJ has flagged:**
  - "What your parent can keep" → "What doesn't count" (GLOBAL, done in #602)
  - "your parent" → "your loved one" (GLOBAL, done in #607 — ~7,900 replacements)
  - **Em dashes are AI-tell, should be removed** (flagged #608 on SMMC-LTC; NOT yet swept globally)
- **Audience framing:** works for adult children, spouses, siblings, self-applicants, friends. Default to "loved one" unless describing a specific relationship role.

### IMMEDIATE NEXT UP — em-dash sweep (pending compact)

**Scope:** Remove em dashes (`—` U+2014) across all benefits content. System-wide sweep analogous to PR #607's "loved one" sweep.

**Files to sweep:**
- `data/pipeline/*/drafts.json` (51 files)
- `data/waiver-library.ts`
- Regenerate drafts.ts via `node scripts/benefits-pipeline.js --regen-index`

**Replacement strategy (from my analysis, TJ hasn't explicitly specified):**
- `X — Y` → `X, Y` (most common; works in most contexts)
- `X — Y.` → `X. Y.` (restructure to period when — introduces independent clause)
- Use judgment per context: comma, colon, period, or restructure

**Cautions:**
- Em dashes inside legitimate program names / proper nouns should stay (rare but possible)
- Some em dashes legitimately punctuate parenthetical asides — decide per occurrence (probably keep as `,` wrap)

**Branch name:** `chore/em-dash-sweep`
**Approach:** sed-based sweep like #607, validate JSON, regen, typecheck, PR

### After em-dash sweep — continuing FL audits

TJ's auditing pattern:
1. Pick next FL program (suggest by traffic/severity — CCE has phone flag so touch it; otherwise PACE or MSP as next high-traffic programs)
2. I pre-verify .gov sources → stage in Notion row
3. TJ audits, logs findings
4. I process, PR, merge, Notion report

**After FL is done:** Tier 1 priority queue per Process Guide — OH HEAP (70% income error — worst single flag in queue) → IN → NC → NY. These 4 states need Program Review Queue rows seeded JIT when TJ's ready.

### Other open items

- **Admin dashboard counter gap** (non-blocking): admin/benefits state cards count `pipeline-draft` vs `approved/published`, but programs in `under-review` status fall through both counts. Per-program badge still renders correctly. Separate follow-up ticket if worth fixing.
- **CTA Link buttons** elsewhere saying "Check if you qualify" (in shadow routes, ChecklistClient) still exist — PR #606 only removed the inline widget. TJ aware; separate decision if he wants those killed too.

### Post-compact resume instructions

If starting fresh post-compact, the key handoff points:
1. **Context doc:** this SCRATCHPAD entry is the authoritative state
2. **Next action:** em-dash sweep (branch `chore/em-dash-sweep` not yet created)
3. **Branch convention:** off `origin/staging`, PR back to `staging`, merge with `--admin` flag
4. **Worktree:** `/Users/tfalohun/.claude-worktrees/olera-web/sparky-bohr` (sparky-bohr branch merged but worktree persists)
5. **Admin bypass pattern:** `gh pr merge <N> --merge --delete-branch --admin` — local checkout step fails because staging worktree is at `/speedy-jemison`, but server-side merge succeeds

---

### 2026-04-20 (afternoon) — PR #603 reviewed_at merged to staging ✅

Delivered the PR 2 scope promised in #601. Now live on staging at commit `5ff8d2a4`.

**PR**: https://github.com/olera-care/olera-web/pull/603 (merged 2026-04-20 @ 19:11 UTC via squash + admin bypass)

**What shipped:**
- New `reviewed_at timestamptz` column on `content_articles` (migration `043_article_reviewed_at.sql`)
- Admin **Dates** section in `/admin/content/[articleId]` — side-by-side Published/Verified pickers + "Mark reviewed" quick button that stamps `NOW()`
- `reviewed_at` added to `EDITABLE_FIELDS` allowlist in PATCH route
- Public byline on `/caregiver-support/[slug]` and `/texas/[slug]` shows `Verified [date]` when `reviewed_at` is non-null (pre-migration: renders clean with no claim)

**Why the separate column (not reuse `updated_at`):** `updated_at` bumps on any admin save — it's a dirty signal, and was bulk-tainted on 2025-03-07. `reviewed_at` is set *only* by explicit admin action (button or picker), so the "Verified [date]" claim is truthful.

**Pre-test review:** 0 bugs. Two non-blocking observations (both pre-existing):
- 🟢 ISR 60s cache lag between admin save and public page (no `revalidatePath` on PATCH — pre-existing across all admin edits)
- 🟢 Late-night "Mark reviewed" clicks in PT/ET produce tomorrow's UTC date (negligible during business hours)

**Merge analysis:** zero file overlap with staging. 7 critical watchlist files verified unchanged post-merge (Footer discovery zone, AuthProvider 24hr cache, 108 permanent redirects in next.config, self-hosted fonts + GA4, Navbar, middleware, types/content).

**Notion report:** https://www.notion.so/3485903a0ffe8101865dd333d00f0437

### Blocked / Pending manual step

⚠️ **Migration 043 not yet applied to Supabase.** TJ will apply via dashboard SQL editor when QA'ing. SQL is safe/additive:
```sql
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
```
Public pages are null-safe pre-migration — no "Verified [date]" claim appears until admin stamps it.

### Out of scope (deliberately deferred from #603)

- `/admin/benefits` per-program `lastVerifiedDate` overrides — different plumbing (pipeline data, not DB column)
- Making `updated_at` user-editable — leaving auto-managed-on-save intact
- Optional backfill script to set `reviewed_at` on articles actually reviewed on Mar 7
- Adding `revalidatePath` to admin PATCH route to eliminate the 60s lag — would affect every admin edit, scope for a separate PR

---

### 2026-04-20 — Verified-by byline across editorial surfaces (PR #601, READY FOR QA)

Recovered Chantel's orphan commit `0dd777b6` (Add verified-by reviewer support for articles) from the tip of `waiver-library-redesign` — single commit stranded when that long-lived branch merged in chunks and this one missed every PR. Extended it into a proper byline system across four surfaces.

**PR**: https://github.com/olera-care/olera-web/pull/601 (branch: `feature/article-verified-by`)

**Surfaces touched:**
- `/caregiver-support/[slug]` (83 articles) — new byline with `Published by` / `Written by` / `Verified by` distinctions
- `/texas/[slug]` — existing verifier (hardcoded Dr. DuBose) made DB-overridable with fallback
- `StatePageV3` (50 state benefits pages) — new `Reviewed by Dr. Logan DuBose` strip
- `ProgramPageV3` (~500 program pages) — strip with `lastVerifiedDate`/`reviewedAt` surfacing

**Key decisions (honest > posturing):**
- **Dropped "Medically reviewed by"** — felt like posturing. Settled on plain "Reviewed by" on state/program pages and "Verified by" on articles.
- **Collapsed byline when author === reviewer** — `Dr. DuBose · Verified by Dr. DuBose` read as double-signature redundancy. Now shows single name via `lib/article-byline.ts::getBylineRules`.
- **Added "Published by Olera team" explicit segment** when author is org-level — previously hidden via `showAuthorCard`, which left `[reviewer avatar] Verified by Dr. DuBose · Verified [date]` reading as "two Verifieds." Now: `Published by Olera team · Verified by Dr. DuBose · [date]`.
- **Dropped the "Verified [date]" claim everywhere.** Our only signal was `content_articles.updated_at`, which got bulk-refreshed across all 83 articles on 2025-03-07 (CMS import or schema touch). Every article was falsely claiming "Verified Mar 7, 2025." Now shows only `published_at` naked on articles. Program pages show `lastVerifiedDate`/`reviewedAt` only when hand-curated in pipeline data (accurate). State pages: no date (no state-level verification signal exists).
- **Migration `042_article_reviewer_fields.sql` not auto-applied** — nullable columns + scoped seed UPDATE. Preview works without it via hardcoded Dr. DuBose fallback. Apply via Supabase dashboard when happy with the look.

**Pre-test catches this session:**
- 🔴 Admin `EDITABLE_FIELDS` allowlist in `/api/admin/content/[articleId]/route.ts` didn't include `reviewer_name` / `reviewer_role` — dropdown would have silently dropped values on PATCH. Fixed before TJ tested.
- 🟢 Unused `updatedAt` local in caregiver-support — removed.

**Bonus diagnosis:**
- Vercel mis-attributing Chantel's deploys to Logan = her git config has `chantelwright@chantels-MacBook-Air.local` as author email (macOS default when `user.email` was never set). `.local` emails don't match any Vercel team member, so fallback attribution kicks in. One-line fix on her side: `git config --global user.email <her-github-email>`.

**Next up — PR 2 scope (admin editability):**
- Add proper `reviewed_at timestamptz` column + "Mark as reviewed" button in `/admin/content/[articleId]`
- Editable Published/Updated/Verified date inputs with smart server-side defaults (empty published_at → NOW() on publish; updated_at → NOW() on save)
- Override `lastVerifiedDate` per program in `/admin/benefits`
- Once shipped, reintroduce `Verified [date]` claim on articles — truthful because it'll only set when admin explicitly clicks
### 2026-04-20 — Benefits review workflow pivot + FL SNAP remediation

PR #602 open against staging: https://github.com/olera-care/olera-web/pull/602 (branch `sparky-bohr`)

**What happened:**
- Dogfooded the Tier 1 review process on FL (lightest — 14 programs, 2 high-sev flags)
- While auditing SNAP, TJ surfaced 7 classes of issue the rigid per-field admin comment format couldn't hold: numeric, broken links, wrong phone, missing mechanics, voice/audience framing, FAQ verbosity, structural confusion (Senior SNAP ↔ general SNAP)
- Admin comment format captures ~20% of real review signal. Shifted composing space to each state's Notion row under a new **Audit Results** H2 (H3 per program + bullets grouped by Numbers / Links / Phone / Copy / Structure / FAQs)
- Admin dashboard demoted to read-only auditor's view

**Code changes (PR #602):**
- `data/pipeline/FL/drafts.json` + regenerated `drafts.ts` — FL SNAP patches:
  - `income_1: $1,255 → $2,610`, `income_2: $1,703 → $3,525` (200% FPL — FL uses BBCE for seniors, not 100% FPL baseline)
  - Phone `1-866-762-2237 → (850) 300-4323` (official DCF Customer Call Center)
  - Broken `myflfamilies.com/service-programs/access/` → `myaccess.myflfamilies.com`
  - Added 3 contentSections callouts: ESAP senior pathway (tip), benefit calc formula (info), Healthy SNAP restrictions effective 2026-04-20 (warning)
  - Tightened 6 FAQs (removed cross-answer repetition) + added 1 new FAQ on Healthy SNAP
  - `contentStatus: "under-review"`, `reviewedBy: "TJ"`, `lastVerifiedDate: 2026-04-20`
- `components/waiver-library/ProgramPageV3.tsx` + `ProgramPageV2.tsx` — label "What your parent can keep" → "What doesn't count" (global fix — works for adult children, spouses, self-advocates, self-applicants)
- `data/pipeline-drafts-types.ts` — `PipelineDraft` gains optional `reviewedBy`/`reviewedAt`/`lastVerifiedDate` per documented v2 lifecycle spec

**Notion changes (no code):**
- Process Guide: new "Composing space: the Audit Results section" block; Step 1 numeric-action rewritten; "Where things live" updated; promotion section updated
- All 4 remaining Tier 1 rows (IN, NC, OH, NY) got the Audit Results scaffold appended + obsolete dashboard-comment references cleaned up
- FL row is the canonical example — TJ's SNAP audit was the template

**Pre-test review (pre-test command run):** 0 bugs. One cosmetic flag (not a bug in this commit): admin state counter doesn't count "under-review" separately — programs in that status fall through both "drafted" and "approved" counts. Per-program badge still renders correctly. Separate follow-up candidate.

**Key decisions:**
- Kept `age: 60` on SNAP despite factcheck flagging 60→65 (ESAP pathway uses 60+; factcheck parser quirk documented in process guide)
- Kept `assets_individual/couple: 4500` (elderly/disabled limit — verified against DCF, not the $3,000 non-senior limit)
- Did NOT split SNAP into two programs for ESAP — one page with an ESAP callout is cleaner than two parallel entries for what's fundamentally one benefit with two application tracks

### Next up
- TJ continues auditing the remaining 13 FL programs using the new Audit Results pattern (Weatherization has real numeric flags; then LIHEAP, Medicaid, etc.)
- After FL is fully audited + approved, move to Tier 1 priority queue: IN (P1, 6 high-sev), NC (P2), OH (P3 — HEAP 70% error is the single worst in the queue), NY (P4)
- Separate low-priority follow-up: add "under-review" count to admin state card

### 2026-04-19 — Benefits SEO day (all 4 P1s shipped)

Four PRs in sequence, each unblocking the next. Entire benefits-SEO quadrant of the P1 roadmap closed.

- **Append state to program names** — MERGED ✅ (PR #595, 2026-04-19, staging @ `6791af5d`)
  - New pure helper `lib/program-name.ts::getDisplayName(program, state)` with skip-suffix detection (state name OR 2-letter abbreviation as standalone word)
  - Zero runtime deps — client-component-safe (doesn't pull waiver-library / pipeline-drafts into client bundle)
  - Updates: `generateMetadata` title/OG on program pages (main + Texas parallel), `ProgramPageV3` H1 + breadcrumb last-crumb, `StatePageV3` program list rows (×2)
  - New 3-item BreadcrumbList JSON-LD on both program routes (Hub → State → Program)
  - /pre-test pivot: initially put helper in `lib/program-data.ts` but that would have bundle-bloated the client. Moved to pure-deps file. Lesson: audit helper's source file imports before importing into client components.
  - Notion report: https://www.notion.so/3475903a0ffe81dd803dfa8ac160c87e

- **Benefits URL Canonicalization** — MERGED ✅ (PR #592, 2026-04-19, staging @ `99556606`)
  - Notion ticket literally asked for `robots: noindex`, but /explore revealed the Tier 7 redirects already made that a no-op. Real issue: `/senior-benefits/:state/:benefit` redirect dropped `:benefit`, sending Google to the state page. Plus sitemap emitted non-canonical `/senior-benefits/*` URLs.
  - Fix: `next.config.ts` redirects preserve `:benefit`; `buildStateUrl/buildProgramUrl` emit canonical `/benefits/...` for non-Texas; `buildWaiverLibraryUrl` aligned
  - Texas stays on parallel URL — TX_OLD_TO_NEW reconciliation is a separate ticket
  - Notion report: https://www.notion.so/3475903a0ffe81ecac7ddf63709d7b9d

- **Sitemap: Pipeline-Only States** — MERGED ✅ (PR #590, 2026-04-19, staging @ `ea4a541f`)
  - Problem: `app/api/sitemap/route.ts` iterated waiver-library states only → DC (only pipeline-only state today) was invisible to Google
  - Fix: added `pipelineDrafts` loop after waiver-library loop with `isRegion` filter; `SLUG_TO_ABBREV` / `ABBREV_TO_SLUG` maps mirrored from `lib/program-data.ts`
  - /pre-test caught: orphan-programs block (ported from the dead shadow `app/sitemap.ts`) would have emitted ~12 redirect-only duplicate URLs for Texas because pipeline v3 IDs don't match waiver-library legacy IDs. Scoped down to pipeline-only STATES only.
  - Notion report: https://www.notion.so/3475903a0ffe812ea201fa0a27411994

- **Pipeline Drafts Partition** — MERGED ✅ (PR #587, 2026-04-19, staging @ `ce1ff9df`)
  - 114,388 lines → 127-line barrel + 51 per-state `data/pipeline/{STATE}/drafts.ts` files
  - New `data/pipeline-drafts-types.ts` (hand-maintained) breaks the circular import
  - New `--regen-index` CLI flag on `scripts/benefits-pipeline.js` re-renders all per-state files
  - Default pipeline runs now write only active state's drafts.ts + barrel
  - Atomic tmp+rename writes; identSafe prefixes `_` to handle digit-leading/reserved-word region slugs
  - Deep-equal of all 51 states against pre-partition monolith confirmed byte-identical
  - Unblocks ~1,900 new benefits routes (category pages + program subpages)
  - Out of scope (follow-up): `data/pipeline-summary.ts` (368 KB sibling, same pattern)
  - Notion report: https://www.notion.so/3475903a0ffe8130ad1ff70833c836be

### 2026-04-19 (evening) — Strategic pivot: Category Pages P1 retired

Pulled the top P1 🔥 ("Category pages per state") for exploration and, on critical review, retired it. The UX job is already solved by the inline category pills on `StatePageV3.tsx:722-810` + `getCategory()` in `lib/waiver-category.ts` — pills with live counts, one-click filter. The only unshipped piece was crawlable URLs at state × category grain, i.e. pure SEO bet.

Killed it because:
- **Same structural bet as city pages, which already failed.** Per `zen-perlman` analysis, city × care-type pages sit at position 35-60 with near-zero CTR due to DA ~5 vs competitors DA 60-75. No mechanism by which state × category ranks better on the same domain.
- **Reinforces a content group already flagged dead in the SEO Running Thread.** `/state/` at CTR 0.08% position 48.9; adding 200 pages below that hub compounds the problem instead of fixing it.
- **Hidden content cost** — 200 pages need per-category intro copy to avoid thin-content doorway classification. Pipeline drafts are program-level, not category-level. Editorial workstream wasn't in the 1-2 day estimate.
- **Algorithm tailwind against us** — Google HCU + 2024 core updates specifically target programmatic SEO at scale.

Actions taken:
- Demoted the Notion ticket to Backlog priority + page-level comment pointing to reasoning: https://www.notion.so/3445903a0ffe81c3b622f42960e0b3c5
- Full reasoning logged as mid-week addendum in SEO Running Thread: https://www.notion.so/3455903a0ffe81888526d1f4bdf7e1f4
- Meta-note in the Running Thread: **first time a prior-documented Pattern (content-group ROI ranking) directly retired an incoming P1** — exactly what that doc was built to do.

Spun off a follow-up task instead — the same reasoning discipline applied to the BCBS/VA caregiver-page question TJ raised:
- **Freshness audit across /caregiver-support/ (83 articles)** — P2, Olera Action Items board (not Web App — see new memory `feedback_notion_board_split.md`): https://www.notion.so/3475903a0ffe81349dbee7ba16082370
- Data job, not editorial. Run `diagnose_editorial_decay.py` across all 83 URLs → ranked decay list → feeds Logan's refresh queue data-driven, not vibes-driven.
- Doesn't block on VA refresh; the decision to *act* on the audit list depends on whether VA refresh lifts position after ship.

Prereq PRs shipped earlier today (#587 partition, #590 sitemap, #592 canonicalization, #595 state-in-program-name) stand on their own merits — no sunk cost.

### Next up (P1 🔥 queue)

- (Category Pages per state — **RETIRED → Backlog, 2026-04-19**. See above. If revisited, pilot shape only: one category × 10-15 strong states, 60-90 day measurement before scaling.)
- **Make sure we have a thoughtful data/code/system backup system in place** (P2) — now the highest-priority outstanding item on the Web App board.

### Standalone follow-ups (low priority)

- `data/pipeline-summary.ts` (368 KB sibling monolith) — same partition pattern as PR #587. Not blocking anything.
- Texas `/texas/benefits/:slug` URL reconciliation — requires TX_OLD_TO_NEW slug mapping awareness in `/benefits/[slug]/[program]` resolver.
- Dead `/senior-benefits/*` route handlers in `app/senior-benefits/` — redirects make them unreachable; cleanup not urgent.
- Dead `app/sitemap.ts` — shadowed by rewrite to `/api/sitemap`. Cleanup ticket.
- `navigator.share` title in `ProgramPageV3` still uses `program.name` (not `getDisplayName`). Minor UX inconsistency.

- **Admin Directory Union** (branch: `admin-directory-union`) — MERGED ✅ (PR #583, 2026-04-17)
  - Notion: [Fix admin directory search hiding orphan business_profiles](https://www.notion.so/3455903a0ffe81b49d43c73058359bbe)
  - Fix: search-triggered union with orphan BPs (`source_provider_id IS NULL, type IN (organization, caregiver)`); BP↔OP category mapping (snake_case ↔ title-case); "User-created" badge on BP rows, click-through opens public page, Delete hidden on BP rows
  - Confirmed working in admin Activity Center (orphan BPs like `aggie-assisted-living-college-station-tx-166r` now visible with `suspicious_claim` flag)
  - Also bundled `/slack-notes` slash command in same PR

- **Organization Search Union Rewrite** — MERGED ✅ (PR #582, 2026-04-17)
  - Fixed MedJobs "Your organization" search for franchise locations (Home Instead Houston)
  - True union across olera-providers + business_profiles via canonical identity dedup
  - Actual root cause: `hero_image_url` column doesn't exist in olera-providers — all OP queries were erroring silently. Two prior fix attempts never touched the column
  - Helper module: `lib/organization-search.ts`
  - Plan: `plans/organization-search-union-rewrite-plan.md`

- **Aging in America — Framer → Olera Web Migration** (branch: `thirsty-hugle`) — IN PROGRESS
  - Migrating aginginamerica.co (Framer) into olera.care/aging-in-america
  - Dark cinematic landing page with season accordion + episode detail pages
  - Design refs: bfnadocs.org (primary), thewhy.dk (season accordion), water.org (human storytelling), NYT Op-Docs (clean grid)
  - Data file: `lib/aging-in-america-data.ts` — all S1 (3 eps) + S2 (trailer + 4 eps) content
  - Components: HeroSection, AboutSection, SeasonAccordion, EpisodeCard, YouTubePlayer, CtaSection
  - Pages: `/aging-in-america` (index) + `/aging-in-america/[slug]` (detail)
  - **BLOCKED: Need YouTube video IDs** for S2 episodes (Carol Dean, Rob Arnold, Jason Goldstein, Robert Sutton) — marked as TODO in data file
  - Build passes clean, all routes generating
  - Plan: `plans/aging-in-america-plan.md`
  - **Next**: Get YouTube IDs from TJ, responsive polish, update homepage CommunitySection link, sitemap

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA
  - Fixed mega menu flicker: redesigned hover architecture — backdrop `onMouseEnter` as leave detector instead of fragile `onMouseLeave` on panel
  - Fixed search bar height shift: `truncate` on care type label prevents "Independent Living" from wrapping
  - Fixed hero dropdown z-index: stacking context was `z-10`, trapping dropdowns behind provider card hearts — bumped to `z-20`
  - De-janked search bar inputs: `transition-colors` → `transition-all` for smooth ring animation, fixed heights (`h-12`)
  - Redesigned care type dropdown: entrance animation, rounded pill items, primary dot selection indicator
  - Removed decorative heart icon from care type trigger
  - Files changed: `Navbar.tsx`, `FindCareMegaMenu.tsx`, `HeroSection.tsx`, `globals.css`

- **Provider Image Migration to R2** — DONE ✅
  - `cdn-api.olera.care` CloudFront was dead → 33,319 providers with broken image URLs
  - Browse card fallback fix merged (PR #475)
  - Migration completed: 72 min, 41,202 photos uploaded, 21,997 DB rows updated, 0 errors
  - 7,380 providers had no photos on Google → still show initials placeholder
  - Images live on `pub-e9cff84835324ecca87386d81c641a56.r2.dev`, verified on production
  - Backlog: custom domain `images.olera.care` → [Notion ticket](https://www.notion.so/3375903a0ffe8199b1f6e381b3f4c87a)
  - **Next: run `classify-provider-images.mjs` to pick hero images**

- **Provider Page CTA Conversion Redesign — 2026-04-02** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW
  - **Problem**: Provider page CTA converts at 0.44%. Getting to 3% = 329 connections/month (6.9x increase).
  - Email-only form, post-submit enrichment with localized pricing, care report email
  - **Branch**: `fine-dijkstra` — 10 commits, pushed to origin
  - **Next**: PR to staging → QA → monitor conversion vs 0.44% baseline

- **City Expansion Batch — 2026-04-17** — DONE ✅
  - 185 cities processed end-to-end (small suburbs, pop 16K-19K)
  - Discovery: 31,745 raw providers (1h46m, quick mode, 1 transient connection error auto-recovered)
  - Pipeline: cleaned → uploaded → enriched, total runtime 2h52m
  - **2,312 active providers across 179 cities** (main batch)
  - Cost: discovery $187 + pipeline $231 = **$418 total** (vs $4,625 original estimate — ~$2.26/city)
  - Enrichment: 1,016 trust-signals confirmed, 1,465 deleted as false positives (unified entity+trust check working well), 2,937 review snippets, 2,345 images
  - Spot-check came back clean on all 6 dimensions (0 out-of-state coords, 0 null place_ids, 0 invalid categories, 0 LLC/Inc name suffixes, 0 slug collisions)
  - **Diagnosed stale-checkout bug, not a code regression**: 6 pre-existing cities initially came back "empty" because the script I was running was from `~/Desktop/olera-web` on `fix/dedupe-tier3` (494 commits behind staging). That stale copy was missing the `.eq('deleted', false)` filter on phaseClean dedup and phaseLoad "already in DB" count. Staging already has the fix — running from a worktree off staging would've avoided the issue. Applied the same fix manually to the stale script, re-ran the 6 cities → salvaged 4 real providers in Round Lake IL (other 5 correctly re-classified as false positives). Memory added: always run pipeline-batch.js from a fresh worktree.
  - 185 Notion pages created + flipped to Complete
  - **Next**: monitor a few city pages on olera.care after ISR warm (1 hr)
  - Expansion board: previous 476 Complete + 185 = **~661 Complete cities**

- **City Expansion Batch — 2026-04-04** — DONE ✅
  - 193 new cities processed end-to-end via batch pipeline
  - Discovery: ~35,000 raw providers (53 min, quick mode)
  - Pipeline: cleaned → uploaded → enriched, total cost ~$263 (~$1.36/city)
  - Fixed `pipeline-batch.js`: removed redundant re-hydration loop (22K sequential Supabase writes) that hung the pipeline for 16+ hours — Stream D and Stream B already handled the same work
  - 193 Notion pages created + all marked Complete
  - Spot-checked 4 cities (Birmingham MI, Fort Walton Beach FL, Golden CO, Makakilo HI) — all rendering with ratings, reviews, images, descriptions, trust signals
  - Updated city pipeline cost estimator: actual ~$4/city, not $25/city
  - Added postmortem for the re-hydration hang to `docs/POSTMORTEMS.md`
  - Added batch script debugging guidance to `/troubleshoot` command
  - **Notion board: 476 Complete cities (283 prior + 193 new)**

- **City Expansion Batch — 2026-04-01** — DONE ✅
  - 90 new cities processed end-to-end via batch pipeline
  - Discovery: 18,191 raw providers (45 min, ~$102 Google Places)
  - Pipeline: cleaned → uploaded → enriched across all 343 cities (6h 21m, ~$323)
  - 13,814 total providers in DB after dedup + AI verification
  - Fixed `pipeline-batch.js`: added `relax_quotes: true` + `relax_column_count: true` + try-catch for malformed CSVs
  - 90 Notion pages created, all marked Complete
  - Live site verified: providers rendering with ratings/reviews on olera.care
  - Total cost: ~$425
  - **Notion board: 283 Complete cities (193 prior + 90 new), 7 Planning remain**

- **Strict User Account Type Separation** (branch: `feature/user-accounts-separation-logic`) — READY FOR MERGE (PR #463)
  - **22 commits**, clean fast-forward from staging, no conflicts
  - **Phase 1**: Fix broken provider experience (stop auto-creating family profiles, fix menus/dropdowns, account settings by type)
  - **Phase 2**: Block family-only actions (save buttons, connection card, server-side guards, guest provider email detection)
  - **Auth flow fix**: Sign out existing session when provider creates family account with different email
  - **Context-aware navigation**: Logo redirects to "home base" by account type (family→/, provider→/for-providers, caregiver→/medjobs). Hide MedJobs/For Providers from family accounts in nav.
  - **Cleanup**: Removed obsolete "Remove this profile" (154 lines), updated save tooltips to dark style
  - **Principle**: One email = one account type. No mixing. Defense in depth (UI → API → email check)
  - **PR URL**: https://github.com/olera-care/olera-web/pull/463
  - **Testing**: Provider logged in → sees blocking UI on save/connect. Guest with provider email → "Provider email detected" UI. Family users unaffected.

- **Staging → Main Promotion** — IN PROGRESS
  - Audited full staging diff: 253 commits, 225 files changed, ~31K lines across ~90 PRs
  - Key areas: one-click onboarding, provider dashboard, MedJobs, reviews, activity center, email revamp, highlights waterfall, city expansion, admin improvements
  - Caught missing PR #435 (funny-turing nav cleanup + 2-card PlatformShowcase) — rebased and merged
  - Caught PR #438 (breadcrumb fix) would silently regress Navbar — rebased and merged clean
  - **Next: Continue merging remaining open PRs, then promote staging → main**

- **MedJobs Candidates Redesign** (branch: `keen-perlman`) — MERGED ✅ (PR #436)
  - Dense scannable list rows, infinite scroll, shared CandidateRow/CandidateFilters
  - **Next: Detail page taste pass, test auth flow end-to-end**

- **Provider Onboard + Nav Cleanup** (branch: `funny-turing`) — MERGED ✅ (PR #433 + #435)
  - Onboard: profile-editor → platform showcase with 2 cards (Families + Hire Staff)
  - Nav: Home | Find Families | Hire Staff, conditional Inbox/Leads, Q&A/Reviews hidden
  - MedJobs provider experience: photo cards + aspirational empty state

- **SEO: Breadcrumb Fix** (branch: `helpful-mendel`) — MERGED ✅ (PR #438)
  - Fixed 3,082 GSC errors: added `item` URL to final breadcrumb entry across 7 page types
  - Need to trigger GSC validation after staging deploys

- **SEO: City/Browse Page Optimization** (branch: `zen-perlman`) — ANALYSIS COMPLETE, IMPLEMENTATION NEXT
  - GSC 7-day report analyzed (Mar 19-25): 690K impressions, 2.7K clicks, 0.4% CTR, avg position 26.7
  - City pages ranking position 35-60 for "[care type] [city]" queries — massive impressions, near-zero clicks
  - Root cause: content thinness + domain authority gap (DA ~5 vs competitors DA 60-75)
  - Caregiver articles are SEO engine (positions 4-6) but authority doesn't flow to city pages
  - Full analysis + action plan in Notion: https://www.notion.so/3305903a0ffe818bbd86e106f8dbfb26
  - **Next: Implement Action 1 (city-specific content sections) + Action 2 (internal linking) + Action 3 (structured data)**

- **DNS Cutover v1.0 → v2.0** (branch: `peaceful-wiles`) — DONE ✅
  - olera.care now serving v2.0 Next.js app via Vercel
  - Provider slug migration done (008 + 009): 477/500 top GSC pages passing
  - Sitemap fixed: `/sitemap.xml` → sitemap index + dynamic API shards
  - OG image replaced: shutterstock caregiver photo (1200x630)
  - GSC sitemap submitted: 4,943 pages in shard 0 (provider shards auto-discovered via index)
  - Reviews API hotfix: GET switched to anon client (was 5xx from service key dependency)
  - All PRs merged, main ↔ staging fully synced

- **Migration Quick Wins + SEO + Traffic Recovery** (branch: `stellar-stonebraker`) — DONE ✅
  - PRs #165-171 all merged to staging

- **Editorial Content Polish** (branch: `stellar-stonebraker`) — DONE ✅
  - PRs #172-176 all merged to staging
  - Author pages at `/author/[slug]` with Person JSON-LD
  - Topic-based filter tabs (6 categories replacing care_type tabs)
  - Author linking in article bylines + avatar fallback to static data
  - CMS admin: author dropdown + topic category dropdown
  - OG/Twitter metadata audit — all page types now have full social previews
  - LinkedIn URLs corrected for TJ and Logan

- **Surface Approved Providers in Public Search** (branch: `vibrant-keller`) — DONE ✅
  - Approved business_profiles now appear in all 4 public discovery surfaces
  - Parallel queries with deduplication via source_provider_id

- **Leadership Team Page** (branch: `joyful-goodall`) — DONE ✅
  - PR #106 merged to staging
  - New `/team` page with editorial design, scroll animations, expanded bios
  - Crosslink from `/for-providers` LeadershipSection, footer link, sitemap entry

- **Admin Silent Failures Fix** (branch: `joyful-goodall`) — DONE ✅
  - PR #108 merged to staging
  - Error banners on 5 admin pages: overview, images, leads, providers, team
  - Replaced `alert()` with inline banners on team page

- **Raw `<img>` Tags Fix** (branch: `joyful-goodall`) — DONE ✅
  - PR #107 merged to staging
  - Swapped 4 raw `<img>` → `next/image` in caregiver-support page

- **Research & Press Blog Section** (branch: `fine-wright`) — DONE ✅

- **Caregiver Support Editorial Redesign** (branch: `joyful-turing`) — DONE ✅

- **v1.0 → v2.0 Migration Playbook** (branch: `seo/structured-data-p1`) — REDIRECTS COMPLETE
  - **Remaining:** P2 SEO polish, CMS migration, DNS cutover ops

- **Migration Sanity Check** (branch: `helpful-williams`) — DONE ✅
  - PR #152: Full audit of v1.0 codebase against v2.0
  - Found 13 gaps not in original playbook; fixed 11 in this session
  - Added 14 redirect rules (next.config.ts) + 2 middleware rules
  - Expanded sitemap with `generateSitemaps()`, articles, waiver library, browse pages
  - Created `docs/migration-sanity-check.md` tracking all findings
  - Created `docs/cutover-runbook.md` — step-by-step DNS cutover with pre-flight, rollback
  - Item #1 (gated provider portal page) assigned to Esther
  - Items #12, #13 are monitor-only (research-and-press redirect verify, forum content loss)

- **Senior Benefits Finder Voice + Results Redesign** — MERGED TO STAGING ✅
  - PR #256 merged 2026-03-13 → staging at `3c14db7`
  - Combined work from `guided-voice-sbf` + `results-redesign-sbf` into `sbf-voice-and-results-redesign`
  - **Voice Input (Phases 1-7):**
    - Speech recognition hook, voice intent parser, guided mode with conversational prompts
    - TTS audio narration via Web Speech Synthesis API (narrates each question, mic auto-starts after)
    - Mode selection: "Fill it out myself" (primary) / "Talk through it" (secondary)
    - Browser detection: disables voice on unsupported browsers
    - Auth gate removed from submit — results shown to everyone, auth on bookmark only
  - **Results Redesign (Progressive Disclosure):**
    - "Great news" header with savings estimate folded into one line
    - "Recommended First Step" hero card with "When you call, say this" script
    - Confidence bars (green/amber/gray) replacing tier labels
    - Savings badges ($X–$Y/mo) on program cards
    - "How to Apply" numbered steps generated from existing data
    - Progressive reveal: top 5 programs, "See X more" button for rest
    - Document checklist collapsed behind toggle (4 category cards, 20 items)
    - Print: expands all programs + checklist, hides nav/sidebar/interactive
    - Removed: SaveResultsBanner, FinancialImpactDashboard (folded into header), ActionPlan (replaced by hero), standalone AAA card
  - **New files:** 13 components, 3 hooks, 2 plans, voice-intent-parser, speech-recognition types
  - **Design principle:** Progressive disclosure — 3 beats: (1) moment of relief, (2) explore at your pace, (3) tools when ready

- **Provider Email Outreach Revamp** (branch: `joyful-pasteur`) — DONE ✅
  - PR #354 merged
  - Rewrite 3 provider-facing emails (question, connection, review) from cold → warm/trust-building

- **City Pipeline: Sunrise Manor, NV** (branch: `bright-dijkstra`) — DONE ✅
  - 632 discovered → 315 active providers after 3 rounds of filtering
  - All enrichment complete: descriptions, reviews, images, trust signals
  - Notion: all 14 checkboxes checked, status Complete

- **Ramapo, NY City Expansion** (branch: `great-euler`, no code changes) — COMPLETE ✅
  - Full pipeline: discovery → classification → upload → enrichment
  - 204 legitimate providers across 6 categories

- **Greece, NY City Expansion** (branch: `silly-thompson`, no code changes) — COMPLETE ✅
  - Full pipeline: discovery → classification → dedup → upload → geocoding → parallel enrichment
  - 109 legitimate providers across 6 categories
  - Notion: all 14 checkboxes checked, status Complete

- **Batch Pipeline Optimization** (branch: `silly-thompson`) — IMPLEMENTED, NEEDS E2E TEST
  - Plan: `plans/batch-pipeline-optimization-plan.md`
  - `scripts/discovery-batch.py` — non-interactive batch discovery with `--batch` CLI
  - `scripts/pipeline-batch.js` — 4-phase processor (clean/load/enrich/finalize)
  - Clean phase validated: 3 cities processed, dedup CSV loaded once, AI batch-50 working
  - `.claude/commands/city-pipeline.md` updated with new batch mode instructions
  - Next: full E2E test with fresh cities, then 80-city batch

- **MedJobs: Full Onboarding Overhaul** (branch: `fresh-ramanujan`, PR #368) — MERGED ✅ + ACCOUNT FIX MERGED ✅
  - Plan: `plans/medjobs-account-creation-plan.md`
  - Notion: [Task](https://www.notion.so/32c5903a0ffe811e80eadeb088f96bd3)
  - **Account creation:** Auth user + account created after step 1 (name+email), not step 4. Auto-sign-in via verifyOtp token.
  - **Two-phase profile:** Partial profile on step 1 (`application_completed: false`), full update on step 4 (`application_completed: true`)
  - **Student dashboard:** `/portal/medjobs` — completion checklist with inline doc upload, locked items when application incomplete
  - **Seamless return flow:** All auth paths (OAuth, magic link, OTP) auto-redirect incomplete students to dashboard
  - **UI redesign:** Typeform-inspired — borderless inputs, custom searchable dropdowns, letter-badged multi-select cards, slide transitions, warm microcopy
  - **Email distinction:** New user = "Welcome to MedJobs!", returning user = "Welcome back!", no Loops seeker drip
  - **Document upload:** Private `student-documents` bucket, auth-gated endpoint, inline on dashboard + submit-video page
  - **Footer hidden** on apply/submit-video/portal-medjobs pages
  - **Bugs fixed:** Duplicate email, generic welcome email to students, Loops drip, nudge cron inactive profiles, dropdown clipping

- **Provider Highlights Dedup + Data-Driven Generation** (branch: `fair-morse`, PR #376) — MERGED ✅

- **88-City Batch Expansion** (branch: `magical-knuth`, PR #383 merged) — COMPLETE ✅
  - **Batch 1 (10 cities):** 598 verified providers. Oyster Bay NY, Richardson TX, Highlands Ranch CO, Pasco WA, Chino Hills CA, Bristol TN, Brookline MA, Pico Rivera CA, Piscataway NJ, Euless TX. Cost: ~$30
  - **Batch 2 (78 cities):** 6,542 verified providers (from 16,006 discovered). 78 cities across 25 states. Cost: ~$240. 4 parallel processing + enrichment batches
  - **Combined: 88 cities, ~7,140 verified providers added in one session**
  - New batch discovery script: `scripts/discovery-batch.py`
  - 30+ state bounding boxes added to `scripts/process-city.js`
  - ~1,100 false positives caught by trust signal verification across both batches
  - Total cost: ~$270 (vs $2,200 combined estimate — 88% under budget)
  - Notion: all 88 pages marked Complete with all checkboxes checked
  - 6 cities needed enrichment retry (Supabase statement timeouts from 4 concurrent batches) — all succeeded on sequential retry
  - Plan: `plans/provider-highlights-dedup-plan.md`
  - Notion: [Task](https://www.notion.so/Logan-s-Audit-QA-de-duplicate-care-service-labels-on-all-provider-pages-32c5903a0ffe8166a12bf29c98319e7e)
  - 5-tier highlight waterfall: trust signals → social proof → CMS → staff screening → capability
  - Browse cards skip tautological category label (skipCapability flag)
  - "Well Reviewed" tier added (4.0★ + 15 reviews) below "Highly Rated" (4.5★ + 10)
  - Synonym normalization map (~25 entries) for care_types dedup
  - Deleted duplicate CATEGORY_HIGHLIGHTS maps from provider.ts + provider-utils.ts
  - **Backfill Pass 1 DONE**: 8,101 providers hydrated with google_reviews_data (free)
  - **Backfill Pass 2 DONE**: 22,292 non-CMS providers processed — 20,841 confirmed (trust signals saved), 1,317 soft-deleted (false positives), 134 errors (JSON parse). ~$22 cost, ~3hrs runtime
  - **1,317 false positives cleaned up**: apartment complexes, golf courses, staffing agencies, rec centers, disability care, closed/unverifiable businesses. Soft-deleted (deleted=true, deleted_at set). No audit trail yet — tracked as P2 Notion task.
  - Backfill script: `scripts/backfill-highlights-data.js` (paginated queries, 10 concurrent workers, 429 retry)
  - To query the 1,317 deletions: `deleted=true AND deleted_at >= '2026-03-24T21:00:00Z' AND ai_trust_signals IS NULL AND provider_category IN ('Home Care (Non-medical)', 'Assisted Living', 'Memory Care', 'Independent Living')`

- **Admin Photo Deletion** (branch: `gentle-newton`, PR #395) — MERGED ✅
  - Plan: `plans/admin-delete-photos-plan.md`
  - Notion: [Task](https://www.notion.so/Admin-dashboard-Add-the-ability-for-providers-to-delete-photos-3295903a0ffe805dbc3bec53b1eca849)
  - API: `delete_image` action added to PATCH `/api/admin/images/[providerId]`
  - UI: hover overlay with trash icon + confirm dialog on both classified and raw image grids
  - Root cause fix: `hero_image_url` column doesn't exist in `olera-providers` — handler was selecting it explicitly, Supabase 500'd

- **MedJobs Account Fix + Admin Documents** (PRs #397, #398) — MERGED ✅
  - PR #397: Fix account creation failing on full form submit (root cause: UPDATE path had no account creation logic)
  - PR #398: Add Documents section to admin student detail page (driver's license + car insurance upload status)
  - Type fix: Added document fields to `StudentMetadata` in `lib/types.ts`

- **Provider Activity Center** (branch: `fond-keller`) — DONE ✅
  - Plan: `plans/provider-activity-center-plan.md`
  - Notion: [Track provider activity in "Activity Center"](https://www.notion.so/Track-provider-activity-in-Activity-Center-32f5903a0ffe80c8ad21ebd8b3176a6f)
  - Track email click-throughs from provider notifications, surface in admin dashboard
  - 5 phases: DB table → instrument emails → capture clicks → API → admin UI
  - PRs #404 merged to staging, #405 promoted to main

- **Provider Onboarding Routing Fix + UX + One-Click Flow** (branch: `loving-swartz`) — E2E WORKING, PR #428 OPEN
  - Plan: `plans/provider-onboarding-routing-plan.md`
  - Notion: [Task](https://www.notion.so/089aad975c5d4ba0930c8da33b8a6597)
  - PRs: #421 merged, #427 merged, #428 open (all fixes from session 62)
  - 5 routing bugs fixed + notification card UX redesign + privacy masking
  - One-click flow fully working: email link → auto-sign-in → auto-claim → onboard page with notification card
  - Root cause of all prior failures: Apple Mail Link Tracking Protection strips params named `token`
  - Fix: renamed `token` to `otk` (one-time key) — Apple doesn't strip it

- **Care Seeker Connection Flow De-Jank** (branch: `helpful-euler`) — IN PROGRESS
  - Enrichment questions → /welcome page transition redesign
  - Fixed 6-second blank white screen: removed force-dynamic from /welcome, moved to static page + client-side data fetching
  - /welcome page taste pass: warm bg (#FAFAF8), side-by-side connection card, flat step cards, Airbnb Trips / Perena inspired
  - `/dejank` slash command created for systematic jank removal methodology
  - **Still TODO:** Test full enrichment → /welcome transition end-to-end, verify connection card skeleton works, continue design polish

- **Family Activity Center** (branch: `logical-mahavira`) — IN PROGRESS
  - Plan: `plans/family-activity-center-plan.md`
  - Expand Activity Center into unified engagement hub: Providers | Families | Feed
  - Track family signals: connection_sent, profile_enriched, email_click, question_asked, matches_activated
  - New seeker_activity table, instrument 16 family email types with tracking, family engagement heat
  - Replaces Matches admin page (funnel metrics → per-person engagement view)
  - 5 phases: DB schema → instrument events → email tracking → admin API → admin UI

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — DONE ✅
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — DONE ✅
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — DONE ✅
  - Plan: `plans/provider-deletion-request-plan.md`

- **Backend Integration Roadmap** — PHASES 1-5 COMPLETE ✅ + Notification Testing IN PROGRESS
  - Plan: `plans/backend-integration-roadmap-plan.md`
  - Analysis: `docs/backend-integration-analysis.md`
  - Notion: [Backend Integration Roadmap](https://www.notion.so/3185903a0ffe800982bbd55176cb46e2)
  - PRs: #111 (Email + Slack), #112 (Twilio SMS), #113 (Vercel Cron), #123-#129 (Loops Marketing), #138 (Approval Email + Loops), #141 (Fix: accounts table lookup), #147 (Family emails + remove mock leads)
  - Phases: ~~Email~~ ✅ → ~~Slack~~ ✅ → ~~Twilio SMS~~ ✅ → ~~Vercel Cron~~ ✅ → ~~Marketing (Loops)~~ ✅ → Sentry (P4 backlog)
  - **Notification Test Matrix:** [Notion](https://www.notion.so/Notification-Test-Matrix-2026-03-04-3195903a0ffe8190be95d95554e52dd1) — 18 tests across Email/SMS/Slack/Cron/Loops

---

## Blocked / Needs Input

- ~~**Migration Playbook → Notion:**~~ ✅ Done (2026-03-01) — updated via Notion MCP
- ~~**Top 100 pages from Search Console:**~~ ✅ Done — GSC export analyzed, 0 404 risks found
- ~~**Editorial content redirect decision:**~~ ✅ Done — all v1.0 content routes now have redirects in `next.config.ts`: `/research-and-press/*` → homepage, `/caregiver-forum/*` → `/`, `/caregiver-relief-network/*` → homepage, `/company/*` → dedicated pages

---

## Next Up

1. **MedJobs candidates detail page taste pass** — Apply warm surface + Perena-inspired styling to `/medjobs/candidates/[slug]` and `/provider/medjobs/candidates/[slug]`
2. **MedJobs provider onboarding flow** — Ensure MedJobs tab → browse → candidate detail → auth → contact is butter smooth end-to-end
3. **Enrichment questions after connection** — Add follow-up questions after seeker submits connection to feed into their profile (separate workstream from onboard redesign)
4. **De-jank provider transitions** — Airbnb-smooth state transitions across provider flows (notification → dashboard, claim → portal)
5. **SEO Action 1: City-specific content sections** — Add cost snapshot, "Paying for Care" module (waiver library links), city stats, FAQ section to browse pages
2. **SEO Action 2: Internal linking** — Link caregiver articles → city pages, waiver library → city pages, nearby city cross-links
3. **SEO Action 3: Structured data + meta** — FAQ schema, AggregateRating schema, cost/review-enriched meta descriptions
4. **SEO Action 4: More caregiver content** — 10-15 articles targeting financial/benefits queries (Medicare, Medicaid, cost guides)
5. **Merge PR #219** (waiver library redesign) — waiting on Chantel to remove `package.json.tmp` + `.mcp.json`
6. **Fix Supabase 1000-row limit** in provider sitemap shards (returns 1000 instead of 10,000)
7. **Debug auto-sign-in** — check `[OneClick]` console logs, fix background auth
8. **Phase 2: Activity Center PII tracking** — log "viewed_lead_pii" events, Slack alerts for sensitive interactions
9. **Unmask question/review content** on onboard notification cards (public data, no privacy concern)
10. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)
11. **Run backfill script** for source_provider_id (dry-run first): `scripts/backfill-source-provider-id.js`
12. **Add `CLAIM_TOKEN_SECRET` env var** to Vercel (currently falls back to SUPABASE_SERVICE_ROLE_KEY)

---

## Decisions Made

| Date | Decision | Rationale |
| 2026-03-28 | MedJobs candidates page is a search tool, not a gallery | Hiring is purposeful evaluation, not emotional discovery. Giant image blocks waste space when most students don't have photos. List rows let providers scan 8-10 candidates per screen vs 3. |
| 2026-03-28 | Any authenticated user sees contact info (not just providers) | Provider profile creation is progressive profiling, not a prerequisite. Gating on "is provider" after auth creates a second wall that breaks the onboarding flow. |
| 2026-03-28 | Infinite scroll over pagination buttons | Pagination feels dated and adds cognitive load. IntersectionObserver with 200px rootMargin pre-fetches the next batch before the user reaches bottom. Feels like Telegram. |
| 2026-03-28 | Onboard page is a platform showcase, not a profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." Profile completion is ONE compact card, not the entire page. |
| 2026-03-28 | Platform cards use router.push, not Link elements | Avoids DOM swap when isSignedIn changes (div→Link remount re-triggers animations). Single div with onClick handler works for both auth states. |
| 2026-03-28 | Guard isNotificationEntry on notificationData presence | ActionCard notification renders require data — without it, renders nothing. SmartDashboardShell must check `&& !!notificationData` before treating as notification entry. Falls back to verify-form. |
| 2026-03-28 | No new API endpoints for v1 of onboard redesign | Value cards use aspirational copy + existing provider data (google_reviews_data). Live counts (lead count in area, Q&A pending) are a fast follow once design is validated. |
| 2026-03-28 | Profile editing removed from onboard page | Wizard/inline editing moves to the portal Dashboard. Onboard page is the "lobby" — sells the vision. Portal is where they work. |
| 2026-03-28 | MedJobs card on onboard is placeholder for now | Feature is early, will be refined in next work session with proper data + design |
| 2026-03-27 | /welcome page must be static, not force-dynamic | Server component ran 3+ Supabase queries that always fail for guests (no session cookie). Blocked page render 2-3s + AuthProvider timeout 5s = 6-8s blank screen. Static page + client-side data fetching = instant render. |
| 2026-03-27 | Never gate /welcome page render on auth state | Connection card, step cards, greeting all work without auth. Auth resolving in background upgrades the UI (profile %, live status) but shouldn't block first paint. Show skeleton for async data, not a loading spinner for the whole page. |
| 2026-03-27 | Side-by-side card layout (square image) > landscape hero for provider cards | Landscape aspect ratio crops provider logos/photos badly — most provider images are logos or square portraits, not wide photos. Square image left + content right works for all image shapes. |
| 2026-03-27 | City page SEO = content depth + authority, not technical fixes | Pages rank 35-60 because they're thin provider lists on a new domain (DA ~5). Competitors have DA 60-75 and editorial city guides. On-page fixes → position 20-25; page 1 requires 3-6mo authority building from article strategy |
| 2026-03-27 | Waiver Library is the unique SEO weapon for city pages | Nobody else connects Medicaid waiver program data to city browse pages. "Paying for Care" module linking waiver library to city pages gives Google content it can't find elsewhere |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail Link Tracking Protection strips params named "token" (both click and copy). `otk` (one-time key) is not on Apple's strip list. This was the root cause of ~10 failed debugging rounds. |
| 2026-03-27 | One-click flow stays on onboard page, not redirect to Leads | The onboard page (notification card hero + dashboard) IS the intended landing. Redirecting to Leads table gives first-time providers nothing to trust. Trojan horse: lead hooks, dashboard sells. |
| 2026-03-27 | Never name URL params `token`, `session`, `key` in email links | Email clients (Apple Mail, Outlook, privacy extensions) strip params that look like auth credentials. Use abbreviations: `otk`, `sid`, `k`. |
| 2026-03-27 | Finalize claim BEFORE refreshAccountData in one-click flow | First-time providers have no account until finalize creates it. Refreshing before finalize returns empty profiles → downstream pages break. |
| 2026-03-27 | Use createAuthClient() (implicit flow) for server-generated verifyOtp | SSR browser client forces PKCE. Server-generated magic link tokens don't have a code_challenge. Must use implicit flow + session transfer. Pattern documented in lib/supabase/auth-client.ts. |
| 2026-03-27 | Fetch notification data server-side in validate-token | The connections table has RLS — unauthenticated browser client can't read it. Notification data must be fetched server-side (service role key) and returned with the token validation response. |
| 2026-03-27 | Notification card display must never depend on auth state | The notification card is the hook — it must render for unauthenticated providers. All data it needs must come from server-side APIs (validate-token), not client-side queries that require auth. |
| 2026-03-26 | Lead email is Trojan horse — dashboard is the product demo | Bare notification page would look like another lead-gen scam. Providers burned by APFM/Caring.com need to see the full platform (gallery, reviews, completeness) to believe Olera is real. Hero card hooks, dashboard below sells. |
| 2026-03-26 | Always mask seeker info on onboard page | `isSignedIn` doesn't mean verified owner of this listing. Protect seekers in case email goes to wrong recipient. First name only, no photo, city only, message truncated. Full info after claiming. |
| 2026-03-26 | Notification card overrides "already claimed" for email entry | Provider clicking email link and seeing "This listing is claimed — Dispute" is hostile. Show the lead/question/review preview instead, let them verify to respond. |
| 2026-03-26 | BP-only providers need slug-based fallback in claim check | Second claim check queries by source_provider_id, which is NULL for BP-only providers. Fallback query by slug catches them. |
| 2026-03-26 | Dark CTA buttons (bg-gray-900) for provider onboarding | Matches MedJobs aesthetic — calm confidence over teal SaaS template. Consistent across provider-facing surfaces. |
| 2026-03-26 | One-click email tokens for provider onboarding (Phase 2) | Email IS the verification — asking for OTP after they clicked the email is proving the same thing twice. Signed JWT in email link = one click from email to full portal access. Zero friction. |
| 2026-03-26 | Two tiers, not three: Full Access + Trusted | Full access via one-click token (everything including seeker PII). Trusted tier (phone call from Olera) only for destructive actions (delete listing, transfer ownership). Middle "Verified" tier was mud that solved a problem we don't have at current scale. |
| 2026-03-26 | Observability over gates for PII protection | At 5-10 leads/day with ~10% provider engagement, manual oversight is feasible. Activity Center + Slack alerts when provider views seeker PII. Human review, not software gates. Gates only when volume demands it. |
| 2026-03-26 | Phone call (not SMS OTP) for Trusted tier | Senior care providers are 60-70yo facility operators. SMS OTP = friction and confusion. Human phone call to business number = highest trust, zero tech friction, builds relationship. Rare actions only (~2-3/week). |
| 2026-03-26 | Questions and reviews don't need privacy masking | Q&A and reviews are already public on the provider page. Only leads contain private seeker PII. Showing full question/review text on onboard page is fine and more compelling. |
| 2026-03-25 | Full apply must retry account creation if apply-partial failed | Two-phase form (partial on step 1, full on step 4) means the full submit UPDATE path must check `account_id` and create auth+account if null. Silent try/catch in apply-partial hid the failure |
| 2026-03-25 | `hero_image_url` column doesn't exist in `olera-providers` | The set_hero action wrote to it but it was never added to the table schema. All references must use `select("*")` and guard with `"hero_image_url" in provider` |
| 2026-03-25 | Hover overlay > exposed pill buttons for image actions | Colored pills (yellow/red/green) below each image were visual noise. Dark gradient overlay with icon buttons on hover — images are content, buttons are tools |
| 2026-03-25 | Quick discovery mode (3 terms/category) is sufficient for batch | Standard mode (12 terms) costs 4x more but yields mostly duplicates. Quick found 16K+ providers across 78 cities for $100. After dedup/filter, same quality |
| 2026-03-25 | 4 parallel processing/enrichment batches for large batches | Single batch would take ~10hrs for 78 cities. 4 parallel batches cut to ~2.7hrs. Tradeoff: 6 Supabase timeouts from concurrent load (easy sequential retry) |
| 2026-03-25 | Cap parallel enrichment batches at 4 to avoid Supabase timeouts | 4 concurrent `enrich-city.js` processes cause occasional statement timeouts. 3-4 batches is the sweet spot for speed vs stability |
| 2026-03-25 | Place ID dedup before fuzzy dedup | Same place_id = same business (100% precision). Run this first to eliminate obvious dupes, then fuzzy catches the rest. Avoids fuzzy false positives on chains with similar names |
| 2026-03-25 | Claimed accounts get +1000 score in dedup — never deleted | 152 providers linked via business_profiles. Even if a claimed provider is the "worse" record, it has real account data tied to it. Always keep it |
|------|----------|-----------|
| 2026-03-24 | Highlights are earned, not defaulted — fewer honest > 4 generic | Every Home Care agency showed identical "In-Home Care, Certified Caregivers, Companionship, Light Housekeeping". Users see through it. 1 verified fact ("State Licensed") builds more trust than 4 templated labels |
| 2026-03-24 | Skip capability label on browse cards (skipCapability) | On a Home Care filtered page, showing "In-Home Care" as a highlight is tautological. Category already visible in card header line. Only show Tiers 1-4 (earned signals) on cards |
| 2026-03-24 | "Well Reviewed" at 4.0★/15+ reviews below "Highly Rated" at 4.5★/10+ | Binary "Highly Rated" was too exclusive — many good providers missed Tier 2. Second tier creates visible variety across cards |
| 2026-03-24 | Backfill trust signals for all 22K non-CMS providers (~$22) | Trust signals are the only differentiator for Home Care/Assisted Living/Memory Care/Independent Living (no CMS data). Pipeline already existed, just hadn't been run on pre-existing providers |
| 2026-03-24 | Don't send MedJobs students to Loops seeker audience | Adding students as seeker contacts enrolls them in Logan's care-seeker onboarding drip. Students get their own Resend email flow |
| 2026-03-24 | Collapse 15 acknowledgment checkboxes into single "I agree" | Wall of legal text killed momentum at step 4. Consolidated into 5 summary bullets + one toggle. Same legal coverage, 90% less friction |
| 2026-03-24 | Dark buttons (bg-gray-900) over teal for MedJobs apply | Calm confidence aesthetic. Teal felt like every SaaS template. Dark is quieter, more Linear/Notion |
| 2026-03-24 | Private storage bucket for student documents | Driver's license and car insurance are PII. Unlike profile photos (public), these must be access-controlled |
| 2026-03-24 | Use generateLink to resolve existing auth users | `listUsers` has no email filter in this Supabase version. `generateLink` always returns the user object, even for existing users — clean and efficient |
| 2026-03-24 | Early account creation after step 1, not step 4 | Capture the lead as soon as we have name+email. Students who abandon mid-form can be nudged back. Two-phase: partial on step 1, full update on step 4 |
| 2026-03-24 | Save step 1 data only, not progressive per-step (approach B) | Steps 2-3 (certifications, availability) are fast to re-fill. Simpler than PATCH-per-step. We capture the valuable lead data (name, email, phone, city, state) |
| 2026-03-24 | Auto-sign-in via dual magic link tokens | Generate two magic links: one for email (reusable), one consumed client-side via verifyOtp. Student gets a browser session without clicking the email, nav updates mid-form |
| 2026-03-24 | Dashboard as the canonical return destination | `/portal/medjobs` is the persistent home for students. All magic links, auth redirects, and success screens point here. No more URL-param-dependent flows |
| 2026-03-24 | Hide footer on MedJobs form pages | Senior care discovery footer is wrong context for student application. Apply, submit-video, and portal/medjobs get no footer |
| 2026-03-24 | Typeform hybrid: 4 sections + Typeform components | Pure one-question-per-screen (17 clicks) is friction disguised as simplicity. Keep grouped fields but bring Typeform-quality interactions: borderless inputs, custom dropdowns, letter-badged multi-selects, slide transitions |
| 2026-03-23 | Post-geocoding area check is required | 36/269 Ramapo providers geocoded outside the area — discovery assigns city=Ramapo to everything regardless of actual location. Must validate coordinates fall within ~0.5° of target city after geocoding |
| 2026-03-23 | Slugs must include city to avoid collisions | Many NY providers share names across cities. Slug format `{name}-{city}-{state}` prevents unique constraint violations |
| 2026-03-23 | Don't run google_reviews_data hydration and review snippets in parallel | Both write to the same JSONB column — race condition causes data loss. Run hydration first, then snippets |
| 2026-03-22 | Never store raw Google Places photo reference URLs | Raw `places.googleapis.com/v1/.../photos/...` URLs are ephemeral API resource paths requiring an API key. Must resolve to permanent `lh3.googleusercontent.com` URLs using `skipHttpRedirect=true` |
| 2026-03-22 | Jettison "Add Score" from city pipeline | olera_score/community_Score/value_score/information_availability_score are dead columns from the old Perplexity AI scoring system, removed in commit 302a4e5. New system uses Google Reviews + CMS data + AI Trust Signals |
| 2026-03-22 | Replace "Add Score" with "Hydrate Google Reviews Data" | New pipeline step populates google_reviews_data JSONB (rating, review_count, snippets) instead of the old proprietary scores |
| 2026-03-22 | AI Trust Signals run as part of city pipeline | Unified workflow: after upload, run /api/admin/verify-trust-signals for non-CMS categories in the target city |
| 2026-03-22 | AI classification required before upload | 32% of Bellevue discovery was garbage (Walmart, GameStop, Roto-Rooter). Keyword filtering misses most false positives. Perplexity AI classification costs ~$0.40 per city and catches everything |
| 2026-03-22 | Run enrichment steps in parallel | Post-upload steps (descriptions, reviews, trust signals, images, email) are independent — run concurrently with background tasks. TJ explicitly praised this approach |
| 2026-03-22 | Trust signals + CMS are display-only, not ranking | Current recommendation engine sorts exclusively by evidence density (google rating × log(review count)). Ranking enhancement is a separate Notion task for deep dive |
| 2026-03-13 | Form-first, voice-second in mode selection | Most users expect a form; voice is a differentiator but shouldn't be the default path |
| 2026-03-13 | Auth gate on bookmark only, not on results | Let users see value first → higher conversion. Bookmark is the natural auth moment |
| 2026-03-13 | Web Speech Synthesis API for TTS (no external service) | Free, built into all browsers, zero latency, no API key. Good enough for intake prompts |
| 2026-03-13 | Borrow Chantel's results page ideas, not her code | Her Lovable prototype has great UX patterns (financial impact, action plan, print) but needs to be rebuilt in our stack |
| 2026-03-13 | Progressive disclosure over report layout | Results page had 9 sections — overwhelming. Reduced to 3 beats: hero card, program list, tools. Document checklist behind toggle. |
| 2026-03-13 | "Recommended First Step" hero > Action Plan list | One specific program with call script > 5 programs in a numbered list. Reduces decision paralysis. |
| 2026-03-13 | Remove SaveResultsBanner from results | Show value first, ask later. Auth only on bookmark. Banner was the first thing users saw — wrong priority. |
| 2026-03-13 | Print expands everything via beforeprint event | Progressive disclosure is great for screen, bad for paper. JS listener overrides collapsed state during print. |
| 2026-03-05 | Flat `/provider/{slug}` URL is correct | v1.0 already used flat canonical URLs — no SEO trade-off in migration |
| 2026-03-05 | Gated provider portal → Esther | `/provider-portal/provider/{slug}/*` needs smart landing page, not just redirect. Critical for provider email funnel |
| 2026-03-02 | 16:9 primary featured image, 4 featured articles | 3:2 and 4:3 were too tall — pushed article grid below fold. 4 featured (1 large + 3 small) fills the right column without blank space |
| 2026-03-01 | Skip MedicalBusiness schema, revisit later | Low reward: Google doesn't render it differently than LocalBusiness. No concrete SERP benefit. Competitors don't use it either. |
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
| 2026-03-10 | Dynamic API route for sitemap, not metadata file | `app/sitemap.ts` is statically generated at build time — Supabase queries fail, empty result cached permanently. `app/api/sitemap/route.ts` with `force-dynamic` works correctly |
| 2026-03-10 | Rewrite `/sitemap.xml` → `/api/sitemap` | `app/[category]` dynamic route catches `sitemap.xml` as a category slug → 404. Rewrite in `next.config.ts` bypasses the route conflict |
| 2026-03-10 | Static OG image over dynamic ImageResponse | Shutterstock photo looks better than teal gradient text; static `.jpg` is simpler and faster |
| 2026-03-10 | Web Speech API + Deepgram fallback for voice | Web Speech API is free and covers ~75% of traffic (Chrome/Edge). Deepgram at $0.008/min covers Firefox + iOS Safari. Cheaper and simpler than a single paid provider for all traffic |
| 2026-03-10 | Keyword parser over LLM for voice interpretation | iOS VoiceIntentParser uses keyword matching and handles all edge cases. No need for Claude API — deterministic, instant, zero cost. LLM can be added later for Plan C conversational mode |
| 2026-03-10 | Mic per step, not separate voice mode | Keeps voice as an enhancement to the existing form. Users can mix voice and tap freely. Lower engineering cost than a full voice overlay (Plan B) |
| 2026-03-10 | Voice on all 6 steps, not just text inputs | Even pill-select steps (care preference, needs, income, Medicaid) benefit from voice — "help with bathing and cooking" is natural speech that maps cleanly to pills |
| 2026-03-10 | Labeled pill over bare icon for voice button | Bare 40x40 gray circle has zero affordance — users won't discover it. Labeled pill with "Speak" text is discoverable without being pushy |
| 2026-03-10 | Teal listening state over red | Red = error/danger in every mental model. Teal (brand color) signals "active" with calm confidence |
| 2026-03-10 | Voice below options, not above | Voice is a secondary input method. Below the primary interaction (input/pills) communicates "or you can speak" without competing with the primary path |
| 2026-03-10 | City search over ZIP-only for voice | Users naturally say "I live in Katy Texas" not "seven seven four four nine". Reuse existing 18K city search infra with state name extraction. ZIP still works if spoken |
| 2026-03-10 | Auto-retry on audio-capture mic error | Chrome's Web Speech API flakes on mic access — abort→start race condition. One silent 500ms retry resolves most transient failures |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

